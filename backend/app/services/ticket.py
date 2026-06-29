from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional

from app.models.ticket import Complaint, Ticket, TicketVersion, Comment, PrivateNote, ActivityTimeline
from app.repositories.ticket import ticket_repository
from app.core.exceptions import ValidationError, NotFoundError
from app.core.logging import logger

class TicketService:
    """Operations governing tickets, workflow rules, timeline feeds, and comments."""

    def create_complaint_and_ticket(
        self,
        db: Session,
        *,
        title: str,
        description: str,
        source: str,
        reporter_name: str,
        reporter_email: Optional[str] = None,
        reporter_phone: Optional[str] = None,
        metadata_json: Optional[dict] = None
    ) -> Ticket:
        """Create a new citizen complaint and automatically provision a tracked ticket."""
        meta = metadata_json or {}
        import time
        from app.services.ai_pipeline import ai_pipeline_service
        start_time = time.time()
        ai_res = ai_pipeline_service.process_complaint(description, meta)
        inference_time_ms = (time.time() - start_time) * 1000
        
        # Prioritize AI predictions unless explicitly provided in request metadata
        category = meta.get("category") or ai_res["category"]
        severity = meta.get("severity") or ai_res["severity"]
        
        # Populate AI telemetry details back into metadata_json
        meta["ai_category_prediction"] = ai_res["category"]
        meta["ai_confidence"] = ai_res["confidence"]
        meta["ai_extracted_entities"] = ai_res["entities"]
        meta["ai_risk_score"] = ai_res["risk_score"]
        meta["ai_language"] = ai_res["language"]
        meta["needs_ai_review"] = ai_res["confidence"] < 70.0
        
        assigned_group = "General Cyber Triage Team"
        
        # Apply assignment rules based on category and financial amount
        if category == "Cyber Financial Fraud":
            assigned_group = "Financial Fraud Unit"
        elif category in ["Hacking", "Ransomware"]:
            assigned_group = "Technical Investigation Cell"
        elif category in ["Cyber Stalking", "Online Harassment"]:
            assigned_group = "Women & Children Safety Cell"
            
        # Calculate SLA deadline based on Severity
        sla_hours = 360 # Default Low: 15 days
        if severity == "Critical":
            sla_hours = 24 # 1 day
        elif severity == "High":
            sla_hours = 72 # 3 days
        elif severity == "Medium":
            sla_hours = 168 # 7 days
            
        sla_deadline = datetime.now(timezone.utc) + timedelta(hours=sla_hours)
        
        # Save Complaint Model
        new_complaint = Complaint(
            title=title,
            description=description,
            source=source,
            status="New",
            reporter_name=reporter_name,
            reporter_email=reporter_email,
            reporter_phone=reporter_phone,
            metadata_json=meta
        )
        complaint = ticket_repository.create_complaint(db, complaint=new_complaint)
        
        # Generate Sequential Ticket Number
        ticket_number = ticket_repository.generate_next_ticket_number(db)
        
        # Create Ticket Model
        new_ticket = Ticket(
            ticket_number=ticket_number,
            complaint_id=complaint.id,
            category=category,
            severity=severity,
            assigned_group=assigned_group,
            sla_deadline=sla_deadline,
            is_escalated=False
        )
        ticket = ticket_repository.create(db, obj_in=new_ticket)
        
        # Log Timeline Event
        new_event = ActivityTimeline(
            ticket_id=ticket.id,
            event_type="ComplaintCreated",
            description=f"Complaint received and ticket {ticket.ticket_number} generated",
            actor_id=None
        )
        ticket_repository.add_timeline_event(db, event=new_event)
        
        # Index NER-extracted technical indicators in DB (Phase 69)
        from app.models.threat_intel import ExtractedEntityIndex
        extracted_entities_dict = ai_res.get("entities", {})
        for ent_type, values in extracted_entities_dict.items():
            if values:
                norm_type = ent_type
                if norm_type.endswith("s"):
                    norm_type = norm_type[:-1]
                for val in values:
                    entity_record = ExtractedEntityIndex(
                        ticket_id=ticket.id,
                        entity_type=norm_type,
                        entity_value=val
                    )
                    db.add(entity_record)
        db.commit()
        
        # Upsert vector representation into Qdrant for similarity search
        ai_pipeline_service.upsert_complaint_vector(
            ticket_id=ticket.id,
            text=description,
            ticket_number=ticket.ticket_number,
            category=category,
            severity=severity
        )
        
        # Audit log inference metrics for SIEM scanning
        from app.core.logging import log_ai_inference
        log_ai_inference(
            ticket_id=ticket.id,
            predicted_category=ai_res["category"],
            confidence=ai_res["confidence"],
            risk_score=ai_res["risk_score"],
            inference_time_ms=inference_time_ms
        )
        
        return ticket

    def update_ticket_status(self, db: Session, *, ticket_id: uuid.UUID, new_status: str, actor_id: uuid.UUID) -> Ticket:
        """Execute ticket state transitions under strict workflow constraints."""
        ticket = ticket_repository.get(db, ticket_id)
        if not ticket:
            raise NotFoundError(message="Ticket not found", code="TICKET_NOT_FOUND")
            
        complaint = ticket.complaint
        old_status = complaint.status
        
        if old_status == new_status:
            return ticket
            
        # Enforce State Machine Rules
        allowed_transitions = {
            "New": ["Assigned", "Resolved"],
            "Assigned": ["Under Investigation", "Resolved"],
            "Under Investigation": ["Closure Requested", "Resolved"],
            "Closure Requested": ["Closed", "Reopened"],
            "Closed": ["Reopened"],
            "Reopened": ["Assigned", "Under Investigation"]
        }
        
        if new_status not in allowed_transitions.get(old_status, []):
            raise ValidationError(
                message=f"Invalid state transition: cannot transition ticket from {old_status} to {new_status}",
                code="INVALID_STATE_TRANSITION"
            )
            
        # Closure requires L1 and L2 approvals
        if new_status == "Closed":
            if not ticket.l1_approved or not ticket.l2_approved:
                raise ValidationError(
                    message="Closure requested requires L1 and L2 supervisor approvals before closing",
                    code="CLOSURE_APPROVALS_REQUIRED"
                )
                
        # Track version changes history
        old_values = {"status": old_status}
        new_values = {"status": new_status}
        
        complaint.status = new_status
        db.add(complaint)
        
        # Write History Version
        db_version = TicketVersion(
            ticket_id=ticket.id,
            old_values=old_values,
            new_values=new_values,
            changed_by_id=actor_id
        )
        ticket_repository.add_ticket_version(db, version=db_version)
        
        # Log Timeline Event
        new_event = ActivityTimeline(
            ticket_id=ticket.id,
            event_type="StatusChanged",
            description=f"Status changed from {old_status} to {new_status}",
            actor_id=actor_id
        )
        ticket_repository.add_timeline_event(db, event=new_event)
        
        db.commit()
        return ticket

    def assign_ticket(
        self,
        db: Session,
        *,
        ticket_id: uuid.UUID,
        officer_id: Optional[uuid.UUID] = None,
        group: Optional[str] = None,
        actor_id: uuid.UUID
    ) -> Ticket:
        """Assign ticket to an officer and/or group, transitioning state to 'Assigned'."""
        ticket = ticket_repository.get(db, ticket_id)
        if not ticket:
            raise NotFoundError(message="Ticket not found", code="TICKET_NOT_FOUND")
            
        old_values = {
            "assigned_officer_id": str(ticket.assigned_officer_id) if ticket.assigned_officer_id else None,
            "assigned_group": ticket.assigned_group
        }
        
        # Update assignment properties
        if officer_id:
            ticket.assigned_officer_id = officer_id
        if group:
            ticket.assigned_group = group
            
        db.add(ticket)
        
        # Write Version History
        new_values = {
            "assigned_officer_id": str(ticket.assigned_officer_id) if ticket.assigned_officer_id else None,
            "assigned_group": ticket.assigned_group
        }
        db_version = TicketVersion(
            ticket_id=ticket.id,
            old_values=old_values,
            new_values=new_values,
            changed_by_id=actor_id
        )
        ticket_repository.add_ticket_version(db, version=db_version)
        
        # Log Timeline Event
        assigned_desc = f"Assigned to group {ticket.assigned_group}"
        if officer_id:
            assigned_desc += f" and officer ID {ticket.assigned_officer_id}"
            
        new_event = ActivityTimeline(
            ticket_id=ticket.id,
            event_type="Assigned",
            description=assigned_desc,
            actor_id=actor_id
        )
        ticket_repository.add_timeline_event(db, event=new_event)
        
        # Auto-update status to Assigned if currently New
        if ticket.complaint.status == "New":
            ticket.complaint.status = "Assigned"
            db.add(ticket.complaint)
            
        db.commit()
        return ticket

    def submit_comment(self, db: Session, *, ticket_id: uuid.UUID, content: str, author_id: uuid.UUID) -> Comment:
        """Add an internal, viewable comment to the ticket thread."""
        ticket = ticket_repository.get(db, ticket_id)
        if not ticket:
            raise NotFoundError(message="Ticket not found", code="TICKET_NOT_FOUND")
            
        new_comment = Comment(
            ticket_id=ticket_id,
            author_id=author_id,
            content=content
        )
        comment = ticket_repository.add_comment(db, comment=new_comment)
        
        # Log Timeline Event
        new_event = ActivityTimeline(
            ticket_id=ticket_id,
            event_type="CommentAdded",
            description="New officer comment added to ticket",
            actor_id=author_id
        )
        ticket_repository.add_timeline_event(db, event=new_event)
        
        return comment

    def submit_private_note(self, db: Session, *, ticket_id: uuid.UUID, content: str, author_id: uuid.UUID) -> PrivateNote:
        """Submit a private investigation note (internal-only)."""
        ticket = ticket_repository.get(db, ticket_id)
        if not ticket:
            raise NotFoundError(message="Ticket not found", code="TICKET_NOT_FOUND")
            
        new_note = PrivateNote(
            ticket_id=ticket_id,
            author_id=author_id,
            content=content
        )
        note = ticket_repository.add_private_note(db, note=new_note)
        
        # Log Timeline Event
        new_event = ActivityTimeline(
            ticket_id=ticket_id,
            event_type="NoteAdded",
            description="Private investigation note added by officer",
            actor_id=author_id
        )
        ticket_repository.add_timeline_event(db, event=new_event)
        
        return note

    def submit_approval_action(self, db: Session, *, ticket_id: uuid.UUID, approver_id: uuid.UUID, decision: str, reason: str, level: int) -> Ticket:
        """Approve or reject a closure request at L1 or L2 levels."""
        ticket = ticket_repository.get(db, ticket_id)
        if not ticket:
            raise NotFoundError(message="Ticket not found", code="TICKET_NOT_FOUND")
            
        if decision == "approved":
            if level == 1:
                ticket.l1_approved = True
                desc = "L1 closure request approved by supervisor"
            elif level == 2:
                ticket.l2_approved = True
                desc = "L2 closure request approved by supervisor"
                # Transition status automatically once both approvals are met
                if ticket.l1_approved:
                    ticket.complaint.status = "Closed"
                    db.add(ticket.complaint)
            else:
                raise ValidationError(message="Invalid approval tier level", code="INVALID_APPROVAL_LEVEL")
        else:
            # Reject and reset approval flags
            ticket.l1_approved = False
            ticket.l2_approved = False
            ticket.complaint.status = "Reopened"
            db.add(ticket.complaint)
            desc = f"Closure request rejected: {reason}"
            
        db.add(ticket)
        
        # Log Timeline Event
        new_event = ActivityTimeline(
            ticket_id=ticket_id,
            event_type="ApprovalDecision",
            description=desc,
            actor_id=approver_id
        )
        ticket_repository.add_timeline_event(db, event=new_event)
        db.commit()
        return ticket

    def merge_duplicate_tickets(self, db: Session, *, primary_ticket_id: uuid.UUID, duplicate_ticket_id: uuid.UUID, actor_id: uuid.UUID) -> Ticket:
        """Merge a duplicate ticket into the primary ticket, linking them in metadata."""
        primary = ticket_repository.get(db, primary_ticket_id)
        duplicate = ticket_repository.get(db, duplicate_ticket_id)
        
        if not primary or not duplicate:
            raise NotFoundError(message="Primary or duplicate ticket not found", code="TICKET_NOT_FOUND")
            
        # Update metadata of duplicate to link to primary
        dup_meta = dict(duplicate.complaint.metadata_json or {})
        dup_meta["merged_into_ticket_id"] = str(primary.id)
        duplicate.complaint.metadata_json = dup_meta
        duplicate.complaint.status = "Closed" # Auto-close duplicate
        db.add(duplicate.complaint)
        
        # Log events
        ev_primary = ActivityTimeline(
            ticket_id=primary.id,
            event_type="TicketsMerged",
            description=f"Ticket {duplicate.ticket_number} merged into this ticket as a duplicate",
            actor_id=actor_id
        )
        ticket_repository.add_timeline_event(db, event=ev_primary)
        
        ev_duplicate = ActivityTimeline(
            ticket_id=duplicate.id,
            event_type="TicketsMerged",
            description=f"This ticket was merged into primary ticket {primary.ticket_number} and closed",
            actor_id=actor_id
        )
        ticket_repository.add_timeline_event(db, event=ev_duplicate)
        
        db.commit()
        return primary

ticket_service = TicketService()
