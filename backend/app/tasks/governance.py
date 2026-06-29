from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.reporting import reporting_service

@celery_app.task
def send_governance_report_task(supervisor_email: str):
    """Celery background worker generating and emailing executive reports to supervisors (Phase 86)."""
    db = SessionLocal()
    try:
        reporting_service.dispatch_governance_report_email(db, supervisor_email)
    finally:
        db.close()
