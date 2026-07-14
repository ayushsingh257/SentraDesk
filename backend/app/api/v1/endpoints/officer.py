import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import RoleRequirement
from app.schemas.response import StandardResponse
from app.schemas.ticket import TicketResponse
from app.models.ticket import Ticket, Complaint

router = APIRouter()

class OfficerDashboardStats(BaseModel):
    assigned: int
    open: int
    under_investigation: int
    pending: int
    closed: int
    avg_resolution: float
    sla_breached: int
    new_assignments: int
    pending_closures: int
    sla_approaching: int

class OfficerDashboardData(BaseModel):
    stats: OfficerDashboardStats
    high_priority_tickets: List[TicketResponse]
    recently_updated_tickets: List[TicketResponse]

@router.get("/dashboard", response_model=StandardResponse[OfficerDashboardData])
def get_officer_dashboard(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Retrieve dashboard metrics and high priority tickets assigned to the officer."""
    officer_id = uuid.UUID(current_user.get("sub"))
    
    # Query all tickets assigned to this officer
    tickets = db.query(Ticket).join(Complaint).filter(Ticket.assigned_officer_id == officer_id).all()
    
    assigned_count = len(tickets)
    open_count = sum(1 for t in tickets if t.complaint.status not in ("Closed", "Resolved"))
    under_investigation_count = sum(1 for t in tickets if t.complaint.status == "Under Investigation")
    pending_count = sum(1 for t in tickets if t.complaint.status in ("Waiting for Citizen", "Reopened", "Awaiting Bank Response", "Awaiting Third Party"))
    closed_count = sum(1 for t in tickets if t.complaint.status in ("Closed", "Resolved"))
    
    # SLA analysis
    now = datetime.now(timezone.utc)
    sla_breached_count = 0
    sla_approaching_count = 0
    approaching_threshold = timedelta(hours=24)

    for t in tickets:
        if t.complaint.status not in ("Closed", "Resolved") and t.sla_deadline:
            deadline = t.sla_deadline
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            if deadline < now:
                sla_breached_count += 1
            elif deadline - now <= approaching_threshold:
                sla_approaching_count += 1
                
    # New assignments (assigned in last 48 hours)
    new_cutoff = now - timedelta(hours=48)
    new_assignments_count = sum(
        1 for t in tickets
        if t.complaint.status == "Assigned" and t.created_at and (
            t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at
        ) > new_cutoff
    )

    # Pending closures: Closure Requested status
    pending_closures_count = sum(1 for t in tickets if t.complaint.status == "Closure Requested")

    # Average resolution time in hours for closed tickets
    resolution_times = []
    for t in tickets:
        if t.complaint.status in ("Closed", "Resolved") and t.updated_at and t.created_at:
            delta = t.updated_at - t.created_at
            resolution_times.append(delta.total_seconds() / 3600.0)
            
    avg_resolution = sum(resolution_times) / len(resolution_times) if resolution_times else 0.0
    
    # High priority queue: active tickets, ordered by severity and deadline
    active_tickets = [t for t in tickets if t.complaint.status not in ("Closed", "Resolved")]
    
    severity_map = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    
    def ticket_sort_key(t: Ticket):
        sev_val = severity_map.get(t.severity, 0)
        deadline_sec = t.sla_deadline.timestamp() if t.sla_deadline else float('inf')
        return (-sev_val, deadline_sec)
        
    active_tickets.sort(key=ticket_sort_key)
    high_priority = active_tickets[:10]  # top 10 high-priority

    # Recently updated tickets: sorted by updated_at desc
    recently_updated = sorted(
        tickets,
        key=lambda t: (t.updated_at or t.created_at or now),
        reverse=True
    )[:8]
    
    return {
        "success": True,
        "data": {
            "stats": {
                "assigned": assigned_count,
                "open": open_count,
                "under_investigation": under_investigation_count,
                "pending": pending_count,
                "closed": closed_count,
                "avg_resolution": round(avg_resolution, 1),
                "sla_breached": sla_breached_count,
                "new_assignments": new_assignments_count,
                "pending_closures": pending_closures_count,
                "sla_approaching": sla_approaching_count
            },
            "high_priority_tickets": high_priority,
            "recently_updated_tickets": recently_updated
        },
        "error": None
    }

