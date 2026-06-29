from celery import Celery
from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "ccgp_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Configure Celery tasks settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Auto-discover tasks in tasks/ folder
    imports=[
        "app.tasks.email",
        "app.tasks.sla"
    ]
)

# Define scheduled cron tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    "poll-imap-every-5-minutes": {
        "task": "app.tasks.email.poll_mailbox_task",
        "schedule": 300.0, # Every 5 minutes
    },
    "check-sla-breaches-every-minute": {
        "task": "app.tasks.sla.check_sla_breaches_task",
        "schedule": 60.0, # Every minute
    }
}
