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

logger = logging.getLogger("ccgp")
setup_logging()
