import logging
import sys
import json
import time
from typing import Any, Dict
from app.core.config import settings

class JSONFormatter(logging.Formatter):
    """Custom formatter rendering structured application logs in JSON."""
    def format(self, record: logging.LogRecord) -> str:
        log_payload: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "environment": settings.ENVIRONMENT,
        }
        
        # Inject context properties if provided
        for key in ["request_id", "user_id", "role"]:
            if hasattr(record, key):
                log_payload[key] = getattr(record, key)
                
        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_payload)

def setup_logging() -> None:
    """Centralized log routing initialization configuration."""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG)
    
    # Configure stdout routing
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

logger = logging.getLogger("sentradesk")
setup_logging()

import os
LOGS_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs"))
os.makedirs(LOGS_DIR, exist_ok=True)
AI_INFERENCE_LOG_PATH = os.path.join(LOGS_DIR, "ai_inference.log")

def log_ai_inference(ticket_id: str, predicted_category: str, confidence: float, risk_score: float, inference_time_ms: float) -> None:
    """Log structured AI model inference details to a dedicated audit file for SIEM scanning (Phase 67)."""
    payload = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
        "ticket_id": str(ticket_id),
        "predicted_category": predicted_category,
        "confidence": confidence,
        "risk_score": risk_score,
        "inference_time_ms": round(inference_time_ms, 2)
    }
    try:
        with open(AI_INFERENCE_LOG_PATH, "a") as f:
            f.write(json.dumps(payload) + "\n")
        logger.info(f"AI Inference audit log saved for Ticket ID {ticket_id}")
    except Exception as e:
        logger.error(f"Failed to write AI inference audit log: {e}")


# SIEM Event Log File (Phase 95)
SIEM_LOG_PATH = os.path.join(LOGS_DIR, "siem_events.log")


def forward_siem_event(
    event_type: str,
    actor_id: str = "",
    actor_role: str = "",
    target: str = "",
    severity: str = "INFO",
    extra: dict = None
) -> None:
    """
    Emit a structured JSON syslog event to the SIEM event log file (Phase 95).
    External collectors (Splunk, ELK) can tail this file for ingestion.
    """
    payload = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "facility": "SentraDesk-SOC",
        "severity": severity,
        "event_type": event_type,
        "actor_id": actor_id,
        "actor_role": actor_role,
        "target": target,
        **(extra or {})
    }
    try:
        with open(SIEM_LOG_PATH, "a") as f:
            f.write(json.dumps(payload) + "\n")
        logger.debug(f"SIEM event forwarded: {event_type}")
    except Exception as e:
        logger.error(f"Failed to write SIEM event log: {e}")

