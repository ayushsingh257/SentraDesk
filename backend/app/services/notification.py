import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.models.notification import NotificationLog

# Fallback basic templates dictionary in case file templates are missing
DEFAULT_TEMPLATES = {
    "ticket_created": """
    <html>
        <body>
            <h2>Ticket Created successfully</h2>
            <p>Dear {reporter_name},</p>
            <p>Your complaint has been successfully registered. A support ticket has been generated for tracking.</p>
            <p><strong>Ticket ID:</strong> {ticket_number}</p>
            <p><strong>Category:</strong> {category}</p>
            <p><strong>Severity:</strong> {severity}</p>
            <p>Our team is reviewing your report. You will receive email notifications as case status updates occur.</p>
            <p>Best regards,<br/>CCGP Governance Alert System</p>
        </body>
    </html>
    """,
    "ticket_assigned": """
    <html>
        <body>
            <h2>Ticket Assignment Notice</h2>
            <p>Dear Officer,</p>
            <p>A new ticket has been assigned to you for active investigation.</p>
            <p><strong>Ticket ID:</strong> {ticket_number}</p>
            <p><strong>Category:</strong> {category}</p>
            <p><strong>Severity:</strong> {severity}</p>
            <p>Please log into the dashboard to review file details and submit timeline updates.</p>
            <p>Best regards,<br/>CCGP Governance Alert System</p>
        </body>
    </html>
    """,
    "ticket_status_changed": """
    <html>
        <body>
            <h2>Ticket Progress Update</h2>
            <p>Dear {reporter_name},</p>
            <p>Your case status has updated.</p>
            <p><strong>Ticket ID:</strong> {ticket_number}</p>
            <p><strong>New Status:</strong> {status}</p>
            <p>Please check the citizen portal link to track active timelines.</p>
            <p>Best regards,<br/>CCGP Governance Alert System</p>
        </body>
    </html>
    """,
    "ticket_escalated": """
    <html>
        <body>
            <h2>🚨 SLA Breach Escalation Alert</h2>
            <p>Dear Supervisor,</p>
            <p>A ticket has breached its designated SLA time limit and has been automatically escalated.</p>
            <p><strong>Ticket ID:</strong> {ticket_number}</p>
            <p><strong>SLA Deadline:</strong> {sla_deadline}</p>
            <p><strong>Assigned Group:</strong> {assigned_group}</p>
            <p>Please review active assignments queues and approve next-step closures.</p>
            <p>Best regards,<br/>CCGP Governance Alert System</p>
        </body>
    </html>
    """,
    "ticket_closed": """
    <html>
        <body>
            <h2>Ticket Closed & Resolved</h2>
            <p>Dear {reporter_name},</p>
            <p>Your support ticket has been resolved and officially closed following L1 and L2 supervisor approvals.</p>
            <p><strong>Ticket ID:</strong> {ticket_number}</p>
            <p><strong>Resolution Status:</strong> Resolved & Closed</p>
            <p>Thank you for your patience during this process.</p>
            <p>Best regards,<br/>CCGP Governance Alert System</p>
        </body>
    </html>
    """
}

class NotificationService:
    """Service governing SMTP dispatch and notifications logs tracking (Phase 38, 39, 40)."""

    def send_email(
        self,
        db: Session,
        *,
        recipient: str,
        template_name: str,
        subject: str,
        variables: dict,
        ticket_id: Optional[uuid.UUID] = None
    ) -> NotificationLog:
        """Render notification template and dispatch email via SMTP, recording history logs."""
        # 1. Create pending notification log entry
        log = NotificationLog(
            ticket_id=ticket_id,
            recipient=recipient,
            template_name=template_name,
            status="Pending",
            retry_count=0
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        # 2. Render Template
        raw_template = DEFAULT_TEMPLATES.get(template_name)
        if not raw_template:
            logger.error(f"Template '{template_name}' not found. Dispatch failed.")
            log.status = "Failed"
            log.error_message = f"Template {template_name} not found"
            db.commit()
            return log

        # Replace variables
        try:
            rendered_html = raw_template.format(**variables)
        except KeyError as e:
            logger.error(f"Missing variables in template variables dictionary: {str(e)}")
            rendered_html = raw_template # Fallback

        # 3. Assemble and Send Mail
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = recipient
        msg.attach(MIMEText(rendered_html, "html"))

        try:
            # Connect and send
            if settings.ENVIRONMENT == "testing":
                logger.info(f"[MOCK EMAIL DISPATCH] To: {recipient} | Subject: {subject}")
            else:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    if settings.ENVIRONMENT != "development":
                        server.starttls()
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.SMTP_FROM_EMAIL, [recipient], msg.as_string())
            
            # Update log as sent
            log.status = "Sent"
            log.sent_at = datetime.utcnow()
            log.error_message = None
            db.commit()
            logger.info(f"Notification email dispatched successfully to {recipient}")
        except Exception as e:
            logger.error(f"SMTP dispatch failure: {str(e)}")
            log.status = "Failed"
            log.error_message = str(e)
            db.commit()
            # We raise the exception so that Celery background task handler can catch it and schedule retry
            raise e

        return log

notification_service = NotificationService()
