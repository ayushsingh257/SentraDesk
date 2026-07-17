import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.ticket import Ticket, ActivityTimeline
from app.services.notification import notification_service
from app.core.logging import logger

class SLAService:
    """Service governing SLA deadlines checks, escalations, alerts, and timers (Phases 42-45)."""

    def check_sla_breaches(self, db: Session) -> int:
        """Scan all open tickets, marking breached deadlines as escalated and alert supervisors (Phase 44, 45)."""
        now = datetime.now(timezone.utc)
        
        # Query open tickets (not Closed) that are past their deadline and not yet escalated
        breached_tickets = (
            db.query(Ticket)
            .filter(
                Ticket.sla_deadline < now,
                Ticket.is_escalated == False
            )
            .all()
        )
        
        count = 0
        for ticket in breached_tickets:
            # Skip if complaint status is Closed
            if ticket.complaint.status in ["Closed"]:
                continue
                
            logger.warning(f"Ticket {ticket.ticket_number} has breached its SLA deadline of {ticket.sla_deadline}! Escalating.")
            
            # 1. Update ticket escalation status
            ticket.is_escalated = True
            
            # 2. Add activity timeline log
            timeline = ActivityTimeline(
                ticket_id=ticket.id,
                event_type="SLABreach",
                description=f"SLA deadline breached. Automatically escalated to supervisor.",
                actor_id=None # System event
            )
            db.add(timeline)
            
            # 3. Notify Supervisor
            # Let's find a supervisor email or default system admin email to alert
            supervisor_email = "supervisor.sentradesk@example.com"
            try:
                notification_service.send_email(
                    db,
                    recipient=supervisor_email,
                    template_name="ticket_escalated",
                    subject=f"🚨 SLA BREACH ALERT: Ticket {ticket.ticket_number} Escalated",
                    variables={
                        "ticket_number": ticket.ticket_number,
                        "sla_deadline": ticket.sla_deadline.strftime("%Y-%m-%d %H:%M:%S UTC"),
                        "assigned_group": ticket.assigned_group or "General Cyber Triage Team"
                    },
                    ticket_id=ticket.id
                )
            except Exception as e:
                logger.error(f"Failed to dispatch SLA breach notification for ticket {ticket.ticket_number}: {str(e)}")
                
            count += 1
            
        if count > 0:
            db.commit()
            
        return count

    def get_remaining_sla_seconds(self, ticket: Ticket) -> float:
        """Calculate remaining seconds until SLA deadline, returning negative if breached (Phase 43)."""
        if not ticket.sla_deadline:
            return 999999.0
        now = datetime.now(timezone.utc)
        deadline = ticket.sla_deadline
        
        # Ensure timezone comparison matches
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
            
        return (deadline - now).total_seconds()

sla_service = SLAService()
