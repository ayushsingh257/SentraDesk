from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.email_listener import email_listener_service
from app.services.notification import notification_service
from app.core.logging import logger

@celery_app.task(name="app.tasks.email.poll_mailbox_task")
def poll_mailbox_task():
    """Background task to periodically poll the IMAP inbox for new complaints (Phase 33, 41)."""
    db = SessionLocal()
    try:
        logger.info("Starting background IMAP email polling cycle.")
        email_listener_service.poll_mailbox(db)
    except Exception as e:
        logger.error(f"Error in poll_mailbox background task: {str(e)}")
    finally:
        db.close()

@celery_app.task(
    name="app.tasks.email.send_notification_task",
    bind=True,
    max_retries=5,
    default_retry_delay=60
)
def send_notification_task(self, recipient: str, template_name: str, subject: str, variables: dict, ticket_id: str = None):
    """Celery task to handle asynchronous SMTP sending with backoff retry (Phase 41)."""
    db = SessionLocal()
    try:
        logger.info(f"Asynchronous task sending email alert to {recipient}.")
        # Convert ticket_id string back to UUID
        import uuid
        t_id = uuid.UUID(ticket_id) if ticket_id else None
        
        notification_service.send_email(
            db,
            recipient=recipient,
            template_name=template_name,
            subject=subject,
            variables=variables,
            ticket_id=t_id
        )
    except Exception as e:
        logger.warning(f"Failed to dispatch email. Retrying task... (error: {str(e)})")
        # Retry with exponential backoff: 60s, 120s, 240s, 480s, etc.
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
    finally:
        db.close()
