import uuid
from sqlalchemy.orm import Session
from app.models.ticket import Ticket, ActivityTimeline, Comment
from app.services.ticket import TicketService
from app.services.notification import notification_service
from app.core.exceptions import ValidationError, NotFoundError
from app.core.logging import logger

class ApprovalService:
    """Service governing supervisor multi-tier closure approval workflows (Phases 46-48)."""

    def __init__(self):
        self.ticket_service = TicketService()

    def request_closure(self, db: Session, *, ticket_id: uuid.UUID, actor_id: uuid.UUID, reason: str) -> Ticket:
        """Initiate closure request for an active ticket (Phase 46)."""
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise NotFoundError(message="Ticket not found")
            
        # Enforce transition status checks (from Under Investigation to Closure Requested)
        if ticket.complaint.status != "Under Investigation":
            raise ValidationError(
                message=f"Cannot request closure on ticket in status '{ticket.complaint.status}'. Ticket must be 'Under Investigation'."
            )
            
        # Reset any previous approval flags
        ticket.l1_approved = False
        ticket.l2_approved = False
        db.add(ticket)
        
        # Log closure request comment
        comment = Comment(
            ticket_id=ticket.id,
            author_id=actor_id,
            content=f"--- [Closure Requested] ---\nReason: {reason}"
        )
        db.add(comment)
        db.commit()
        
        # Transition state via main ticket state machine
        self.ticket_service.update_ticket_status(
            db,
            ticket_id=ticket_id,
            new_status="Closure Requested",
            actor_id=actor_id
        )
        
        logger.info(f"Ticket {ticket.ticket_number} successfully placed in Closure Requested state.")
        return ticket

    def submit_l1_approval(self, db: Session, *, ticket_id: uuid.UUID, actor_id: uuid.UUID, comment_text: str) -> Ticket:
        """Approve case closure at L1 Tier (Phase 47)."""
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise NotFoundError(message="Ticket not found")
            
        if ticket.complaint.status != "Closure Requested":
            raise ValidationError(message="Ticket closure is not currently requested.")
            
        if ticket.l1_approved:
            raise ValidationError(message="L1 closure approval has already been granted.")
            
        ticket.l1_approved = True
        db.add(ticket)
        
        # Add comment
        comment = Comment(
            ticket_id=ticket.id,
            author_id=actor_id,
            content=f"--- [L1 Closure Approved] ---\nComments: {comment_text}"
        )
        db.add(comment)
        
        # Log Timeline
        timeline = ActivityTimeline(
            ticket_id=ticket.id,
            event_type="L1Approved",
            description="L1 closure approval granted by supervisor.",
            actor_id=actor_id
        )
        db.add(timeline)
        db.commit()
        db.refresh(ticket)
        
        logger.info(f"L1 closure approval granted for ticket {ticket.ticket_number}.")
        return ticket

    def submit_l2_approval(self, db: Session, *, ticket_id: uuid.UUID, actor_id: uuid.UUID, comment_text: str) -> Ticket:
        """Approve case closure at L2 Tier and close the case (Phase 48)."""
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise NotFoundError(message="Ticket not found")
            
        if ticket.complaint.status != "Closure Requested":
            raise ValidationError(message="Ticket closure is not currently requested.")
            
        if not ticket.l1_approved:
            raise ValidationError(message="L2 approval requires prior L1 supervisor sign-off.")
            
        if ticket.l2_approved:
            raise ValidationError(message="L2 closure approval has already been granted.")
            
        ticket.l2_approved = True
        db.add(ticket)
        
        # Add comment
        comment = Comment(
            ticket_id=ticket.id,
            author_id=actor_id,
            content=f"--- [L2 Closure Approved] ---\nComments: {comment_text}"
        )
        db.add(comment)
        
        # Log Timeline
        timeline = ActivityTimeline(
            ticket_id=ticket.id,
            event_type="L2Approved",
            description="L2 closure approval granted by senior supervisor. Resolving ticket.",
            actor_id=actor_id
        )
        db.add(timeline)
        db.commit()
        
        # Both L1 and L2 are approved. Transition status to Closed (Phase 48)
        self.ticket_service.update_ticket_status(
            db,
            ticket_id=ticket_id,
            new_status="Closed",
            actor_id=actor_id
        )
        
        # Send closing notification email to citizen complainant
        if ticket.complaint.reporter_email:
            try:
                notification_service.send_email(
                    db,
                    recipient=ticket.complaint.reporter_email,
                    template_name="ticket_closed",
                    subject=f"CCGP Ticket Resolved & Closed [{ticket.ticket_number}]",
                    variables={
                        "reporter_name": ticket.complaint.reporter_name,
                        "ticket_number": ticket.ticket_number
                    },
                    ticket_id=ticket.id
                )
            except Exception as e:
                logger.error(f"Failed to dispatch closure acknowledgement to complainant: {str(e)}")
                
        logger.info(f"Ticket {ticket.ticket_number} fully approved (L1+L2) and transition to Closed state is complete.")
        return ticket

    def reject_closure(self, db: Session, *, ticket_id: uuid.UUID, actor_id: uuid.UUID, comment_text: str) -> Ticket:
        """Reject ticket closure request, resetting approval flags and reverting status to 'Under Investigation' (Phase 48)."""
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise NotFoundError(message="Ticket not found")
            
        if ticket.complaint.status != "Closure Requested":
            raise ValidationError(message="Ticket closure is not currently requested.")
            
        # Reset approval flags
        ticket.l1_approved = False
        ticket.l2_approved = False
        db.add(ticket)
        
        # Log rejection comment
        comment = Comment(
            ticket_id=ticket.id,
            author_id=actor_id,
            content=f"--- [Closure Rejected] ---\nComments: {comment_text}"
        )
        db.add(comment)
        
        # Log Timeline
        timeline = ActivityTimeline(
            ticket_id=ticket.id,
            event_type="ClosureRejected",
            description="Ticket closure request rejected by supervisor. Reverting status to Under Investigation.",
            actor_id=actor_id
        )
        db.add(timeline)
        db.commit()
        
        # Transition back to Reopened (Phase 48) — valid state machine path from Closure Requested
        self.ticket_service.update_ticket_status(
            db,
            ticket_id=ticket_id,
            new_status="Reopened",
            actor_id=actor_id
        )
        
        # Dispatch notification to assigned officer
        if ticket.assigned_officer_id:
            try:
                from app.models.user import User
                officer_user = db.query(User).filter(User.id == ticket.assigned_officer_id).first()
                if officer_user and officer_user.email:
                    # In-app notification
                    notification_service.create_in_app_notification(
                        db,
                        user_id=ticket.assigned_officer_id,
                        title=f"Closure Request Rejected: {ticket.ticket_number}",
                        message=f"Closure request rejected. Supervisor comments: {comment_text}",
                        ticket_id=ticket.id
                    )
                    # Email notification
                    from app.core.config import settings as _settings
                    if _settings.ENVIRONMENT != "testing":
                        from app.tasks.email import send_notification_task
                        from app.core.celery_app import dispatch_task
                        dispatch_task(
                            send_notification_task,
                            recipient=officer_user.email,
                            template_name="ticket_rejected",
                            subject=f"❌ Closure Request Rejected: [{ticket.ticket_number}]",
                            variables={
                                "ticket_number": ticket.ticket_number,
                                "comments": comment_text
                            },
                            ticket_id=str(ticket.id)
                        )
            except Exception as notif_err:
                logger.error(f"Failed to dispatch closure rejection alerts: {notif_err}")
                
        logger.info(f"Ticket {ticket.ticket_number} closure request was rejected by supervisor.")
        return ticket

approval_service = ApprovalService()
