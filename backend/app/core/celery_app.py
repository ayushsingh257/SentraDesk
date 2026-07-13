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
        "app.tasks.sla",
        "app.tasks.governance",
        "app.tasks.devops"
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
    },
    "monthly-governance-reports": {
        "task": "app.tasks.governance.send_governance_report_task",
        "schedule": 2592000.0,
        "args": ("supervisor@ccgp.gov.in",)
    },
    "daily-postgresql-backup": {
        "task": "app.tasks.devops.backup_postgresql_task",
        "schedule": 86400.0,  # Every 24 hours
    },
    "daily-minio-mirror": {
        "task": "app.tasks.devops.backup_minio_task",
        "schedule": 86400.0,  # Every 24 hours
    },
    "hourly-backup-integrity-check": {
        "task": "app.tasks.devops.verify_backup_integrity_task",
        "schedule": 3600.0,  # Every hour
    }
}

def dispatch_task(task, *args, **kwargs):
    """
    Safely dispatch a Celery task asynchronously.
    If Redis (the broker) is offline or unavailable, fallback to running the task 
    synchronously in a separate background thread to prevent blocking request cycles.
    """
    from app.core.database import get_redis
    from app.core.logging import logger
    import threading

    redis_online = False
    try:
        import redis
        from app.core.config import settings
        # Connect with a very short timeout to fail fast if offline
        r_ping = redis.Redis.from_url(
            settings.REDIS_URL, 
            socket_connect_timeout=0.2, 
            socket_timeout=0.2
        )
        r_ping.ping()
        redis_online = True
    except Exception:
        redis_online = False

    if redis_online:
        logger.info(f"Redis is online. Dispatching Celery task '{task.name}' asynchronously.")
        task.delay(*args, **kwargs)
    else:
        logger.warning(
            f"Redis is offline/disconnected. Falling back to background thread for Celery task '{task.name}'."
        )
        target_func = getattr(task, "run", task)
        # Spin up a thread to execute the raw task logic
        thread = threading.Thread(target=target_func, args=args, kwargs=kwargs)
        thread.daemon = True
        thread.start()

