from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, tickets, complaints, health, evidence, approvals, email

api_router = APIRouter()

api_router.include_router(health.router, prefix="", tags=["Diagnostics"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users Profile Management"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["Tickets & Workflows"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Public Citizen Intake"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["Evidence & Storage"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["Closure Approvals"])
api_router.include_router(email.router, prefix="/email", tags=["Email Automation & Testing"])
