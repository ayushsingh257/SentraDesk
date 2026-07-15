import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import RoleRequirement, JWTBearer
from app.schemas.response import StandardResponse
from app.schemas.ticket import TicketResponse
from app.models.ticket import Ticket, Complaint, ActivityTimeline, Comment, ApprovalRecord
from app.models.user import User
from app.services.approval import approval_service
from app.services.ticket import TicketService
from app.core.exceptions import ValidationError, NotFoundError

router = APIRouter()
ticket_service = TicketService()

# --- Pydantic Schemas for Supervisor Analytics ---

class CategoryDistribution(BaseModel):
    category: str
    count: int

class DistrictDistribution(BaseModel):
    district: str
    count: int

class TrendPoint(BaseModel):
    date: str
    count: int

class OfficerProductivity(BaseModel):
    officer_id: uuid.UUID
    officer_name: str
    active_count: int
    closed_count: int
    avg_resolution_hours: float

class SupervisorDashboardStats(BaseModel):
    pending_approvals: int
    active_investigations: int
    sla_breached: int
    sla_approaching: int
    escalated_count: int
    total_tickets: int
    avg_resolution_hours: float
    resolution_rate: float

class SupervisorDashboardData(BaseModel):
    stats: SupervisorDashboardStats
    category_distribution: List[CategoryDistribution]
    district_distribution: List[DistrictDistribution]
    trends: List[TrendPoint]
    officer_productivity: List[OfficerProductivity]
    recent_activities: List[Dict[str, Any]]
    escalated_tickets_list: List[TicketResponse]

# --- Bulk Operation Input Schemas ---

class BulkApprovalInput(BaseModel):
    ticket_ids: List[uuid.UUID]
    action: str = Field(..., pattern="^(approve|reject)$")
    comment: str = Field(..., min_length=3, max_length=1000)

class BulkReassignInput(BaseModel):
    ticket_ids: List[uuid.UUID]
    officer_id: Optional[uuid.UUID] = None
    group: Optional[str] = None

class BulkPriorityInput(BaseModel):
    ticket_ids: List[uuid.UUID]
    severity: str = Field(..., pattern="^(Critical|High|Medium|Low)$")

class BulkEscalateInput(BaseModel):
    ticket_ids: List[uuid.UUID]
    is_escalated: bool

# --- Endpoints ---

@router.get("/dashboard", response_model=StandardResponse[SupervisorDashboardData])
def get_supervisor_dashboard(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Retrieve detailed system-wide analytics, trends, workloads and escalated cases for supervisors."""
    now = datetime.now(timezone.utc)
    
    # 1. Base counts
    total_tickets = db.query(Ticket).count()
    pending_approvals = db.query(Ticket).join(Complaint).filter(Complaint.status == "Closure Requested").count()
    active_investigations = db.query(Ticket).join(Complaint).filter(Complaint.status == "Under Investigation").count()
    escalated_count = db.query(Ticket).filter(Ticket.is_escalated == True).count()
    
    # 2. SLA calculations
    sla_breached = db.query(Ticket).join(Complaint).filter(
        Complaint.status.notin_(["Closed", "Resolved"]),
        Ticket.sla_deadline < now
    ).count()
    
    sla_approaching = db.query(Ticket).join(Complaint).filter(
        Complaint.status.notin_(["Closed", "Resolved"]),
        Ticket.sla_deadline >= now,
        Ticket.sla_deadline <= now + timedelta(hours=24)
    ).count()

    # 3. Closed / Resolution times
    closed_tickets = db.query(Ticket).join(Complaint).filter(Complaint.status.in_(["Closed", "Resolved"])).all()
    resolution_times = []
    for t in closed_tickets:
        if t.updated_at and t.created_at:
            delta = t.updated_at - t.created_at
            resolution_times.append(delta.total_seconds() / 3600.0)
            
    avg_resolution = round(sum(resolution_times) / len(resolution_times), 1) if resolution_times else 0.0
    resolution_rate = round((len(closed_tickets) / total_tickets * 100.0), 1) if total_tickets > 0 else 0.0

    # 4. Fetch all tickets and complaints to group in Python (100% database-agnostic)
    all_tickets = db.query(Ticket).join(Complaint).all()
    
    # Category Distribution
    cat_counts: Dict[str, int] = {}
    for t in all_tickets:
        cat_counts[t.category] = cat_counts.get(t.category, 0) + 1
    category_distribution = [CategoryDistribution(category=k, count=v) for k, v in cat_counts.items()]
    category_distribution.sort(key=lambda x: x.count, reverse=True)

    # District Distribution
    dist_counts: Dict[str, int] = {}
    for t in all_tickets:
        dist = t.jurisdiction or "Unassigned District"
        dist_counts[dist] = dist_counts.get(dist, 0) + 1
    district_distribution = [DistrictDistribution(district=k, count=v) for k, v in dist_counts.items()]
    district_distribution.sort(key=lambda x: x.count, reverse=True)

    # Trend points (Past 7 days)
    trends_counts: Dict[str, int] = {}
    for i in range(7):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        trends_counts[day] = 0
    for t in all_tickets:
        day_str = t.created_at.strftime("%Y-%m-%d")
        if day_str in trends_counts:
            trends_counts[day_str] += 1
    trends = [TrendPoint(date=k, count=v) for k, v in sorted(trends_counts.items())]

    # 5. Officer Productivity
    officers = db.query(User).filter(User.role.in_(["cyber_cell_officer", "investigator", "senior_investigator"]), User.is_active == True).all()
    officer_productivity = []
    for off in officers:
        off_tickets = [t for t in all_tickets if t.assigned_officer_id == off.id]
        active_cnt = sum(1 for t in off_tickets if t.complaint.status not in ["Closed", "Resolved"])
        closed_cnt = sum(1 for t in off_tickets if t.complaint.status in ["Closed", "Resolved"])
        
        off_res_times = []
        for t in off_tickets:
            if t.complaint.status in ["Closed", "Resolved"] and t.updated_at and t.created_at:
                delta = t.updated_at - t.created_at
                off_res_times.append(delta.total_seconds() / 3600.0)
        off_avg_res = round(sum(off_res_times) / len(off_res_times), 1) if off_res_times else 0.0
        
        officer_productivity.append(
            OfficerProductivity(
                officer_id=off.id,
                officer_name=off.name,
                active_count=active_cnt,
                closed_count=closed_cnt,
                avg_resolution_hours=off_avg_res
            )
        )

    # 6. Escalated ticket listing
    escalated_tickets_list = db.query(Ticket).filter(Ticket.is_escalated == True).order_by(Ticket.created_at.desc()).limit(10).all()

    # 7. Recent activities
    recent_events = db.query(ActivityTimeline).order_by(ActivityTimeline.created_at.desc()).limit(15).all()
    recent_activities = []
    for ev in recent_events:
        recent_activities.append({
            "id": str(ev.id),
            "ticket_number": ev.ticket.ticket_number if ev.ticket else "Unknown",
            "event_type": ev.event_type,
            "description": ev.description,
            "created_at": ev.created_at.isoformat()
        })

    return {
        "success": True,
        "data": {
            "stats": {
                "pending_approvals": pending_approvals,
                "active_investigations": active_investigations,
                "sla_breached": sla_breached,
                "sla_approaching": sla_approaching,
                "escalated_count": escalated_count,
                "total_tickets": total_tickets,
                "avg_resolution_hours": avg_resolution,
                "resolution_rate": resolution_rate
            },
            "category_distribution": category_distribution,
            "district_distribution": district_distribution,
            "trends": trends,
            "officer_productivity": officer_productivity,
            "recent_activities": recent_activities,
            "escalated_tickets_list": escalated_tickets_list
        },
        "error": None
    }

# --- Bulk Operations ---

@router.post("/bulk-approve", response_model=StandardResponse[Dict[str, Any]])
def bulk_approve_or_reject_closures(
    payload: BulkApprovalInput,
    db: Session = Depends(get_db),
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Bulk approve or reject closure requests for a list of tickets."""
    actor_id = uuid.UUID(token_payload.get("sub"))
    success_ids = []
    failed_ids = []
    
    for t_id in payload.ticket_ids:
        try:
            ticket = db.query(Ticket).filter(Ticket.id == t_id).first()
            if not ticket:
                failed_ids.append(str(t_id))
                continue
                
            if payload.action == "reject":
                approval_service.reject_closure(db, ticket_id=t_id, actor_id=actor_id, comment_text=payload.comment)
            else:
                # Automate workflow level detection: L1 -> L2
                if not ticket.l1_approved:
                    approval_service.submit_l1_approval(db, ticket_id=t_id, actor_id=actor_id, comment_text=payload.comment)
                else:
                    approval_service.submit_l2_approval(db, ticket_id=t_id, actor_id=actor_id, comment_text=payload.comment)
            success_ids.append(str(t_id))
        except Exception as e:
            failed_ids.append(f"{t_id}: {str(e)}")
            
    return {
        "success": len(failed_ids) == 0,
        "data": {
            "processed": len(success_ids),
            "success_ids": success_ids,
            "failed_ids": failed_ids
        },
        "error": f"Failed tickets: {failed_ids}" if failed_ids else None
    }

@router.post("/bulk-reassign", response_model=StandardResponse[Dict[str, Any]])
def bulk_reassign_tickets(
    payload: BulkReassignInput,
    db: Session = Depends(get_db),
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Bulk assign/reassign tickets to an investigator or unit."""
    actor_id = uuid.UUID(token_payload.get("sub"))
    success_ids = []
    failed_ids = []
    
    for t_id in payload.ticket_ids:
        try:
            ticket_service.assign_ticket(
                db,
                ticket_id=t_id,
                officer_id=payload.officer_id,
                group=payload.group,
                actor_id=actor_id
            )
            success_ids.append(str(t_id))
        except Exception as e:
            failed_ids.append(f"{t_id}: {str(e)}")
            
    return {
        "success": len(failed_ids) == 0,
        "data": {
            "processed": len(success_ids),
            "success_ids": success_ids,
            "failed_ids": failed_ids
        },
        "error": f"Failed tickets: {failed_ids}" if failed_ids else None
    }

@router.post("/bulk-priority", response_model=StandardResponse[Dict[str, Any]])
def bulk_update_priority(
    payload: BulkPriorityInput,
    db: Session = Depends(get_db),
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Bulk update case severity / priority for a list of tickets."""
    actor_id = uuid.UUID(token_payload.get("sub"))
    success_ids = []
    failed_ids = []
    
    for t_id in payload.ticket_ids:
        ticket = db.query(Ticket).filter(Ticket.id == t_id).first()
        if not ticket:
            failed_ids.append(str(t_id))
            continue
        try:
            old_severity = ticket.severity
            ticket.severity = payload.severity
            
            # Log transition to timeline
            timeline = ActivityTimeline(
                ticket_id=ticket.id,
                event_type="PriorityChanged",
                description=f"Case priority updated from '{old_severity}' to '{payload.severity}' in bulk operation.",
                actor_id=actor_id
            )
            db.add(timeline)
            db.commit()
            success_ids.append(str(t_id))
        except Exception as e:
            failed_ids.append(f"{t_id}: {str(e)}")
            
    return {
        "success": len(failed_ids) == 0,
        "data": {
            "processed": len(success_ids),
            "success_ids": success_ids,
            "failed_ids": failed_ids
        },
        "error": f"Failed tickets: {failed_ids}" if failed_ids else None
    }

@router.post("/bulk-escalate", response_model=StandardResponse[Dict[str, Any]])
def bulk_update_escalation(
    payload: BulkEscalateInput,
    db: Session = Depends(get_db),
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Bulk escalate or de-escalate a list of tickets."""
    actor_id = uuid.UUID(token_payload.get("sub"))
    success_ids = []
    failed_ids = []
    
    for t_id in payload.ticket_ids:
        ticket = db.query(Ticket).filter(Ticket.id == t_id).first()
        if not ticket:
            failed_ids.append(str(t_id))
            continue
        try:
            old_esc = ticket.is_escalated
            ticket.is_escalated = payload.is_escalated
            
            # Log transition to timeline
            desc = "Case escalated to supervisor attention in bulk operation." if payload.is_escalated else "Case de-escalated."
            timeline = ActivityTimeline(
                ticket_id=ticket.id,
                event_type="Escalated" if payload.is_escalated else "DeEscalated",
                description=desc,
                actor_id=actor_id
            )
            db.add(timeline)
            db.commit()
            success_ids.append(str(t_id))
        except Exception as e:
            failed_ids.append(f"{t_id}: {str(e)}")
            
    return {
        "success": len(failed_ids) == 0,
        "data": {
            "processed": len(success_ids),
            "success_ids": success_ids,
            "failed_ids": failed_ids
        },
        "error": f"Failed tickets: {failed_ids}" if failed_ids else None
    }
