import re
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import RoleRequirement
from app.models.threat_intel import ThreatIndicator
from app.models.evidence import Evidence
from app.schemas.threat_intel import ThreatIndicatorCreate, ThreatIndicatorResponse, ReputationLookupResponse
from app.schemas.response import StandardResponse

from app.services.threat_intel import threat_intel_service

router = APIRouter()

@router.post("/indicators", response_model=StandardResponse[ThreatIndicatorResponse])
def create_threat_indicator(
    indicator: ThreatIndicatorCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Register a new Indicator of Compromise (IoC) threat indicator (requires officer or higher permissions)."""
    # Check if indicator already registered
    existing = db.query(ThreatIndicator).filter(ThreatIndicator.indicator_value == indicator.indicator_value).first()
    if existing:
        raise HTTPException(status_code=400, detail="Threat indicator value already registered.")
        
    db_indicator = ThreatIndicator(
        indicator_type=indicator.indicator_type,
        indicator_value=indicator.indicator_value,
        source_feed=indicator.source_feed,
        threat_score=indicator.threat_score,
        description=indicator.description
    )
    db.add(db_indicator)
    db.commit()
    db.refresh(db_indicator)
    return {
        "success": True,
        "data": db_indicator,
        "error": None
    }

@router.get("/indicators", response_model=StandardResponse[List[ThreatIndicatorResponse]])
def get_threat_indicators(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Retrieve all registered Indicators of Compromise (requires officer or higher permissions)."""
    indicators = db.query(ThreatIndicator).order_by(ThreatIndicator.created_at.desc()).all()
    return {
        "success": True,
        "data": indicators,
        "error": None
    }

@router.get("/lookup", response_model=StandardResponse[ReputationLookupResponse])
def lookup_threat_indicator_reputation(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Perform OTX & AbuseIPDB reputation scanning on indicator value (requires officer or higher permissions)."""
    query_clean = q.strip()
    
    # 1. Check local threat indicator registry database
    db_indicator = db.query(ThreatIndicator).filter(ThreatIndicator.indicator_value == query_clean).first()
    if db_indicator:
        status = "Malicious" if db_indicator.threat_score > 70 else ("Suspicious" if db_indicator.threat_score > 30 else "Clean")
        return {
            "success": True,
            "data": {
                "indicator": query_clean,
                "indicator_type": db_indicator.indicator_type,
                "threat_score": db_indicator.threat_score,
                "status": status,
                "source": "Local Cache Registry",
                "details": {
                    "description": db_indicator.description,
                    "feed": db_indicator.source_feed,
                    "last_updated": db_indicator.created_at.isoformat()
                }
            },
            "error": None
        }
        
    # 2. Determine indicator type via patterns
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", query_clean):
        indicator_type = "ip"
    elif "@" in query_clean and "." in query_clean.split("@")[-1]:
        indicator_type = "email"
    elif "@" in query_clean:
        indicator_type = "upi"
    elif re.match(r"^[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}$", query_clean):
        indicator_type = "domain"
    elif len(query_clean) in [34, 42]:
        indicator_type = "crypto_wallet"
    else:
        indicator_type = "generic"
        
    # 3. Request live feeds reputation
    if indicator_type == "ip":
        res = threat_intel_service.lookup_ip_reputation(query_clean)
    elif indicator_type == "domain":
        res = threat_intel_service.lookup_domain_reputation(query_clean)
    else:
        res = threat_intel_service._fallback_reputation(query_clean, indicator_type)
        
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.get("/scan-file/{evidence_id}", response_model=StandardResponse[ReputationLookupResponse])
def scan_evidence_file_reputation(
    evidence_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Verify evidence hashes against VirusTotal reputation database (requires officer or higher permissions)."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found.")
        
    file_hash = evidence.sha256_hash or ""
    
    # Check VirusTotal file hash service
    res = threat_intel_service.scan_file_hash(file_hash)
    
    # Overwrite if extensions are suspicious
    suspicious_extensions = [".exe", ".bat", ".scr", ".vbs", ".zip"]
    filename_lower = evidence.filename.lower()
    if any(filename_lower.endswith(ext) for ext in suspicious_extensions):
        res["threat_score"] = max(res["threat_score"], 92.0)
        res["status"] = "Malicious"
        res["details"]["extension_flagged"] = True
        
    return {
        "success": True,
        "data": res,
        "error": None
    }
