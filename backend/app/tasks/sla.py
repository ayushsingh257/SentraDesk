from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.sla import sla_service
from app.core.logging import logger

@celery_app.task(name="app.tasks.sla.check_sla_breaches_task")
def check_sla_breaches_task():
    """Background task running periodically to evaluate SLA breaches and trigger escalations (Phase 44)."""
    db = SessionLocal()
    try:
        logger.info("Executing periodic SLA breach evaluation check.")
        escalation_count = sla_service.check_sla_breaches(db)
        if escalation_count > 0:
            logger.info(f"SLA monitor escalated {escalation_count} tickets during this run.")
    except Exception as e:
        logger.error(f"Error checking SLA breaches in background task: {str(e)}")
    finally:
        db.close()
