from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any

class ThreatIndicatorBase(BaseModel):
    indicator_type: str
    indicator_value: str
    source_feed: Optional[str] = "Manual Nodal Entry"
    threat_score: Optional[float] = 100.0
    description: Optional[str] = None

class ThreatIndicatorCreate(ThreatIndicatorBase):
    pass

class ThreatIndicatorResponse(ThreatIndicatorBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReputationLookupResponse(BaseModel):
    indicator: str
    indicator_type: str
    threat_score: float
    status: str # Clean, Suspicious, Malicious
    source: str # AbuseIPDB, OTX, VirusTotal, Local Cache
    details: Dict[str, Any]
