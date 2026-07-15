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
        citizen_id: Optional[uuid.UUID] = None,
        metadata_json: Optional[dict] = None
    ) -> Ticket:
        """Create a new citizen complaint and automatically provision a tracked ticket."""
        meta = metadata_json or {}
        import time
        from app.services.ai_pipeline import ai_pipeline_service
        logger.info(f"AI processing started for complaint description (len={len(description)})")
        start_time = time.time()
        ai_res = ai_pipeline_service.process_complaint(description, meta)
        inference_time_ms = (time.time() - start_time) * 1000
        logger.info(f"AI processing completed: predicted category '{ai_res['category']}', severity '{ai_res['severity']}' in {inference_time_ms:.2f}ms")
        
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
            citizen_id=citizen_id,
            metadata_json=meta
        )
        logger.info("Database insert started for complaint record")
        complaint = ticket_repository.create_complaint(db, complaint=new_complaint)
        logger.info(f"Database insert completed: Complaint ID {complaint.id}")
        
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
        
        new_ticket.complaint = complaint
        
        # Auto-assign investigator based on workload
        logger.info(f"Auto-assigning investigator workload calculation started for ticket {ticket_number}")
        officer_id = self.auto_assign_investigator(db, new_ticket)
        if officer_id:
            new_ticket.assigned_officer_id = officer_id
            complaint.status = "Assigned"
            db.add(complaint)
            
        logger.info(f"Database insert started for ticket {ticket_number}")
        ticket = ticket_repository.create(db, obj_in=new_ticket)
        logger.info(f"Database insert completed: Ticket ID {ticket.id} | number {ticket_number}")
        
        # Dispatch notification to officer if auto-assigned
        if officer_id:
            try:
                from app.models.user import User
                officer_user = db.query(User).filter(User.id == officer_id).first()
                if officer_user and officer_user.email:
                    from app.core.config import settings as _settings
                    if _settings.ENVIRONMENT != "testing":
                        from app.tasks.email import send_notification_task
                        from app.core.celery_app import dispatch_task
                        dispatch_task(
                            send_notification_task,
                            recipient=officer_user.email,
                            template_name="ticket_assigned",
                            subject=f"CCGP Ticket Assigned [{ticket.ticket_number}]",
                            variables={
                                "ticket_number": ticket.ticket_number,
                                "category": ticket.category,
                                "severity": ticket.severity
                            },
                            ticket_id=str(ticket.id)
                        )
            except Exception as assign_err:
                logger.error(f"Failed to dispatch auto-assigned notification task: {assign_err}")

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
        
        # Upsert vector representation into Qdrant for similarity search asynchronously
        import threading
        thread = threading.Thread(
            target=ai_pipeline_service.upsert_complaint_vector,
            kwargs={
                "ticket_id": ticket.id,
                "text": description,
                "ticket_number": ticket.ticket_number,
                "category": category,
                "severity": severity
            }
        )
        thread.daemon = True
        thread.start()
        
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

    def update_ticket_status(self, db: Session, *, ticket_id: uuid.UUID, new_status: str, actor_id: uuid.UUID, actor_role: Optional[str] = None) -> Ticket:
        """Execute ticket state transitions under strict workflow constraints."""
        ticket = ticket_repository.get(db, ticket_id)
        if not ticket:
            raise NotFoundError(message="Ticket not found", code="TICKET_NOT_FOUND")
            
        complaint = ticket.complaint
        old_status = complaint.status
        
        if old_status == new_status:
            return ticket
            
        # Enforce State Machine Rules with Role Requirements
        # (old_status, new_status): minimum_required_role_level
        allowed_transitions = {
            ("New", "AI Processing"): 0,  # system (automatic)
            ("New", "Assigned"): 0,       # system (automatic) or operator/officer
            ("New", "Resolved"): 3,
            ("AI Processing", "Assigned"): 0,
            ("Assigned", "Under Investigation"): 3,  # cyber_cell_officer
            ("Assigned", "Resolved"): 3,
            ("Under Investigation", "Waiting for Citizen"): 3,
            ("Under Investigation", "Evidence Received"): 3,
            ("Under Investigation", "Closure Requested"): 4,  # investigator
            ("Under Investigation", "Resolved"): 3,
            ("Waiting for Citizen", "Under Investigation"): 3,
            ("Evidence Received", "Under Investigation"): 3,
            ("Closure Requested", "Closed"): 6,  # supervisor
            ("Closure Requested", "Reopened"): 6, # supervisor reject
            ("Closed", "Reopened"): 1,           # citizen
            ("Closed", "Under Investigation"): 1,  # citizen reopen directly transitions to Under Investigation in endpoint
            ("Reopened", "Assigned"): 3,
            ("Reopened", "Under Investigation"): 3
        }
        
        transition = (old_status, new_status)
        if transition not in allowed_transitions:
            raise ValidationError(
                message=f"Invalid state transition: cannot transition ticket from {old_status} to {new_status}",
                code="INVALID_STATE_TRANSITION"
            )
            
        if actor_role:
            from app.core.security import ROLE_HIERARCHY
            user_level = ROLE_HIERARCHY.get(actor_role, 1)
            required_level = allowed_transitions[transition]
            if user_level < required_level:
                raise ValidationError(
                    message=f"Insufficient permissions to transition ticket from {old_status} to {new_status}. Required role level: {required_level}",
                    code="FORBIDDEN_STATE_TRANSITION"
                )
            
        # Closure requires L1 and L2 approvals
        if new_status == "Closed":
            if not ticket.l1_approved or not ticket.l2_approved:
                raise ValidationError(
                    message="Closure requested requires L1 and L2 supervisor approvals before closing",
                    code="CLOSURE_APPROVALS_REQUIRED"
                )
                
        # Reopening resets L1 & L2 approvals
        if new_status == "Reopened":
            ticket.l1_approved = False
            ticket.l2_approved = False
            db.add(ticket)
            
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

        # Dispatch notification alerts on status change (Phase 38)
        if ticket.complaint.reporter_email:
            try:
                from app.core.config import settings as _settings
                if _settings.ENVIRONMENT != "testing":
                    from app.tasks.email import send_notification_task
                    from app.core.celery_app import dispatch_task
                    dispatch_task(
                        send_notification_task,
                        recipient=ticket.complaint.reporter_email,
                        template_name="ticket_status_changed",
                        subject=f"CCGP Ticket Update [{ticket.ticket_number}] - {new_status}",
                        variables={
                            "reporter_name": ticket.complaint.reporter_name,
                            "ticket_number": ticket.ticket_number,
                            "status": new_status
                        },
                        ticket_id=str(ticket.id)
                    )
            except Exception as notif_err:
                logger.error(f"Failed to dispatch status changed notification task: {notif_err}")

        # Also create In-App Notification for citizen/recipient
        if ticket.complaint.citizen_id:
            try:
                from app.services.notification import notification_service
                notification_service.create_in_app_notification(
                    db,
                    user_id=ticket.complaint.citizen_id,
                    title=f"Ticket Update: {ticket.ticket_number}",
                    message=f"Case status has updated to {new_status}.",
                    ticket_id=ticket.id
                )
            except Exception as in_app_err:
                logger.error(f"Failed to create in-app status notification: {in_app_err}")

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
            
        # Dispatch notifications to the newly assigned officer (NOT-2)
        if officer_id:
            try:
                from app.models.user import User
                officer_user = db.query(User).filter(User.id == officer_id).first()
                if officer_user:
                    from app.services.notification import notification_service
                    # 1. In-app notification
                    notification_service.create_in_app_notification(
                        db,
                        user_id=officer_id,
                        title=f"Ticket Assigned: {ticket.ticket_number}",
                        message=f"You have been assigned to case {ticket.ticket_number} (Severity: {ticket.severity}).",
                        ticket_id=ticket.id
                    )
                    # 2. Email notification (async)
                    if officer_user.email:
                        from app.core.config import settings as _settings
                        if _settings.ENVIRONMENT != "testing":
                            from app.tasks.email import send_notification_task
                            from app.core.celery_app import dispatch_task
                            dispatch_task(
                                send_notification_task,
                                recipient=officer_user.email,
                                template_name="ticket_assigned",
                                subject=f"CCGP Ticket Assigned [{ticket.ticket_number}]",
                                variables={
                                    "ticket_number": ticket.ticket_number,
                                    "category": ticket.category,
                                    "severity": ticket.severity
                                },
                                ticket_id=str(ticket.id)
                            )
            except Exception as assign_err:
                logger.error(f"Failed to dispatch assignment alerts to officer {officer_id}: {assign_err}")

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

        # Dispatch comment notification (Phase 38)
        try:
            from app.models.user import User
            # Determine who to notify
            recipient_id = None
            recipient_email = None
            
            if ticket.complaint.citizen_id == author_id:
                # Complainant commented -> notify assigned officer
                recipient_id = ticket.assigned_officer_id
                if recipient_id:
                    officer_user = db.query(User).filter(User.id == recipient_id).first()
                    if officer_user:
                        recipient_email = officer_user.email
            else:
                # Officer or system commented -> notify citizen
                recipient_id = ticket.complaint.citizen_id
                recipient_email = ticket.complaint.reporter_email
                
            if recipient_email:
                # 1. In-app notification
                if recipient_id:
                    from app.services.notification import notification_service
                    notification_service.create_in_app_notification(
                        db,
                        user_id=recipient_id,
                        title=f"New message on ticket {ticket.ticket_number}",
                        message=content[:100] + ("..." if len(content) > 100 else ""),
                        ticket_id=ticket.id
                    )
                # 2. Email notification
                from app.core.config import settings as _settings
                if _settings.ENVIRONMENT != "testing":
                    from app.tasks.email import send_notification_task
                    from app.core.celery_app import dispatch_task
                    dispatch_task(
                        send_notification_task,
                        recipient=recipient_email,
                        template_name="query_received",
                        subject=f"💬 New message on ticket [{ticket.ticket_number}]",
                        variables={
                            "ticket_number": ticket.ticket_number,
                            "snippet": content[:150] + ("..." if len(content) > 150 else "")
                        },
                        ticket_id=str(ticket.id)
                    )
        except Exception as comment_err:
            logger.error(f"Failed to dispatch comment notification alerts: {comment_err}")
        
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

    def auto_assign_investigator(self, db: Session, ticket: Ticket) -> Optional[uuid.UUID]:
        """Automatically find the active investigator with the least workload matching category, department or jurisdiction (Phase 43)."""
        from app.models.user import User
        from app.models.ticket import Ticket as TicketModel, Complaint as ComplaintModel
        from sqlalchemy import func

        investigator_roles = ["cyber_cell_officer", "investigator", "senior_investigator", "supervisor"]
        query = db.query(User).filter(User.role.in_(investigator_roles), User.is_active == True)

        meta = ticket.complaint.metadata_json or {}
        dept = meta.get("department")
        jurisdiction = meta.get("jurisdiction")

        candidates = []
        if dept:
            candidates = query.filter(User.department == dept).all()
        if not candidates and jurisdiction:
            candidates = query.filter(User.jurisdiction == jurisdiction).all()
        if not candidates:
            candidates = query.all()

        if not candidates:
            logger.info("No active investigator candidates found in DB. Auto-assignment skipped.")
            return None

        active_statuses = ["New", "Assigned", "Under Investigation", "Closure Requested"]
        workload_map = {}
        for cand in candidates:
            count = (
                db.query(func.count(TicketModel.id))
                .join(TicketModel.complaint)
                .filter(
                    TicketModel.assigned_officer_id == cand.id,
                    ComplaintModel.status.in_(active_statuses)
                )
                .scalar()
            )
            workload_map[cand.id] = count or 0

        # Sort candidate users by workload ascending
        sorted_candidates = sorted(candidates, key=lambda x: workload_map[x.id])
        chosen_officer = sorted_candidates[0]

        logger.info(f"Auto-assigned ticket {ticket.ticket_number} to officer {chosen_officer.email} (active workload: {workload_map[chosen_officer.id]} tickets)")
        return chosen_officer.id

ticket_service = TicketService()
