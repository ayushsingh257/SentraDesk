import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.ticket import Ticket, Complaint, Comment, ActivityTimeline
from app.models.evidence import Evidence
from app.models.notification import EmailConversation, NotificationLog
from app.services.sla import sla_service
from app.services.evidence import evidence_service
from app.services.email_listener import email_listener_service

def test_email_intake_automation(client: TestClient, db: Session):
    """Test receiving email automatically triggers complaint creation and auto routing (Phase 37)."""
    # 1. Dispatch mock email complaint
    sender = "citizen.reporter@example.com"
    subject = "Help: Cyber financial fraud of 600000 rupees"
    body = "I lost money to an online phishing link. Please investigate."
    
    resp = client.post(
        "/api/v1/email/receive-mock",
        json={"sender": sender, "subject": subject, "body": body}
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    
    # Verify ticket number and automated group routing
    assert data["ticket_number"].startswith("CCGP-2026-")
    assert data["category"] == "Cyber Financial Fraud"
    assert data["severity"] == "Critical" # >500k loss
    
    # Check DB record creation
    ticket_id = data["id"]
    ticket = db.query(Ticket).filter(Ticket.id == uuid.UUID(ticket_id)).first()
    assert ticket is not None
    assert ticket.complaint.reporter_email == sender
    assert ticket.complaint.source == "email"

    # Check Email Conversation threading log
    conv = db.query(EmailConversation).filter(EmailConversation.ticket_id == ticket.id).first()
    assert conv is not None
    assert conv.sender == sender
    assert conv.subject == subject
    assert conv.body == body

    # Verify auto acknowledgement notification log
    notif = db.query(NotificationLog).filter(NotificationLog.ticket_id == ticket.id).first()
    assert notif is not None
    assert notif.recipient == sender
    assert notif.template_name == "ticket_created"

def test_email_threading_replies(client: TestClient, db: Session):
    """Test reply emails with references match thread instead of creating new tickets (Phase 36)."""
    # Create ticket
    sender = "threading.citizen@example.com"
    ticket, is_new = email_listener_service.receive_mock_email(
        db,
        sender=sender,
        subject="Hacking complaint",
        body="My social account was hacked."
    )
    assert is_new is True
    
    # Simulate reply with References matching the previous conversation message ID
    prev_msg = db.query(EmailConversation).filter(EmailConversation.ticket_id == ticket.id).first()
    reply_subject = f"Re: Hacking complaint [{ticket.ticket_number}]"
    
    # Process mock email with matched subject code
    reply_ticket, is_new_reply = email_listener_service.receive_mock_email(
        db,
        sender=sender,
        subject=reply_subject,
        body="Here is more information about the hack."
    )
    assert is_new_reply is False
    assert reply_ticket.id == ticket.id

    # Verify comment was added to the same ticket
    comments = db.query(Comment).filter(Comment.ticket_id == ticket.id).all()
    assert len(comments) == 1
    assert "Here is more information" in comments[0].content

def test_sla_breach_monitoring_and_escalation(client: TestClient, db: Session):
    """Test SLA breach checker escalates ticket and notifies supervisor (Phase 44, 45)."""
    # Create ticket manually with breach deadline in past
    from datetime import datetime, timedelta, timezone
    past_deadline = datetime.now(timezone.utc) - timedelta(hours=2)
    
    comp = Complaint(
        title="Late Case Title",
        description="SLA breach evaluation test complaint text.",
        source="portal",
        status="New",
        reporter_name="Citizen Complainant"
    )
    db.add(comp)
    db.commit()
    
    ticket = Ticket(
        ticket_number="CCGP-2026-9999",
        complaint_id=comp.id,
        category="Hacking",
        severity="High",
        sla_deadline=past_deadline,
        is_escalated=False
    )
    db.add(ticket)
    db.commit()

    # Trigger SLA check via service
    breaches = sla_service.check_sla_breaches(db)
    assert breaches == 1

    # Reload ticket
    db.refresh(ticket)
    assert ticket.is_escalated is True

    # Check breach timeline log
    timeline = db.query(ActivityTimeline).filter(
        ActivityTimeline.ticket_id == ticket.id,
        ActivityTimeline.event_type == "SLABreach"
    ).first()
    assert timeline is not None
    assert "SLA deadline breached" in timeline.description

    # Verify supervisor alert is logged
    notif = db.query(NotificationLog).filter(
        NotificationLog.ticket_id == ticket.id,
        NotificationLog.template_name == "ticket_escalated"
    ).first()
    assert notif is not None
    assert notif.recipient == "supervisor.ccgp@example.com"

def test_supervisor_closure_approvals_workflow(client: TestClient, db: Session):
    """Test L1 and L2 approval guards for ticket closure (Phases 46-48)."""
    # Create a ticket
    comp = Complaint(
        title="Close Test Complaint",
        description="Supervisor approvals lifecycle test.",
        source="portal",
        status="Under Investigation",
        reporter_name="Jane Doe",
        reporter_email="jane.doe@example.com"
    )
    db.add(comp)
    db.commit()
    
    ticket = Ticket(
        ticket_number="CCGP-2026-8888",
        complaint_id=comp.id,
        category="Cyber Stalking",
        severity="Medium"
    )
    db.add(ticket)
    db.commit()

    # 1. Register supervisor user
    client.post("/api/v1/users/register", json={
        "email": "supervisor@ccgp.gov.in",
        "password": "password123",
        "name": "Supervisor",
        "role": "supervisor"
    })

    # 2. Login to retrieve token
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "supervisor@ccgp.gov.in", "password": "password123"}
    )
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Attempt L1 approval directly (should fail because state isn't Closure Requested)
    l1_resp = client.post(
        f"/api/v1/approvals/{ticket.id}/l1-approve",
        json={"comment": "Approved L1"},
        headers=headers
    )
    assert l1_resp.status_code == 422 # ValidationError
    
    # 2. Request closure
    req_resp = client.post(
        f"/api/v1/approvals/{ticket.id}/request-closure",
        json={"reason": "Completed all investigation steps."},
        headers=headers
    )
    assert req_resp.status_code == 200
    assert req_resp.json()["data"]["complaint"]["status"] == "Closure Requested"

    # 3. Attempt L2 approval before L1 (should fail)
    l2_resp = client.post(
        f"/api/v1/approvals/{ticket.id}/l2-approve",
        json={"comment": "Approved L2"},
        headers=headers
    )
    assert l2_resp.status_code == 422 # ValidationError

    # 4. Perform L1 approval
    l1_resp = client.post(
        f"/api/v1/approvals/{ticket.id}/l1-approve",
        json={"comment": "Approved L1"},
        headers=headers
    )
    assert l1_resp.status_code == 200
    assert l1_resp.json()["data"]["l1_approved"] is True

    # 5. Perform L2 approval (should close case)
    l2_resp = client.post(
        f"/api/v1/approvals/{ticket.id}/l2-approve",
        json={"comment": "Approved L2 and closing case."},
        headers=headers
    )
    assert l2_resp.status_code == 200
    data = l2_resp.json()["data"]
    assert data["l2_approved"] is True
    assert data["complaint"]["status"] == "Closed"

    # Verify closure notification log is created
    notif = db.query(NotificationLog).filter(
        NotificationLog.ticket_id == ticket.id,
        NotificationLog.template_name == "ticket_closed"
    ).first()
    assert notif is not None
    assert notif.recipient == "jane.doe@example.com"

def test_evidence_uploads_versioning_and_zipping(client: TestClient, db: Session):
    """Test evidence upload meta saving, versioning increments, and bulk zipping (Phases 51-54)."""
    # Create ticket
    comp = Complaint(
        title="Evidence Test",
        description="Evidence upload versioning tests.",
        source="portal",
        status="Under Investigation",
        reporter_name="Bob Smith"
    )
    db.add(comp)
    db.commit()
    
    ticket = Ticket(
        ticket_number="CCGP-2026-7777",
        complaint_id=comp.id,
        category="Hacking",
        severity="Medium"
    )
    db.add(ticket)
    db.commit()

    # 1. Register investigator user
    client.post("/api/v1/users/register", json={
        "email": "investigator@ccgp.gov.in",
        "password": "password123",
        "name": "Investigator",
        "role": "investigator"
    })

    # 2. Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "investigator@ccgp.gov.in", "password": "password123"}
    )
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch upload link
    upload_resp = client.post(
        f"/api/v1/evidence/{ticket.id}/upload-link",
        json={"filename": "evidence.pdf"},
        headers=headers
    )
    assert upload_resp.status_code == 200
    assert "upload_url" in upload_resp.json()["data"]
    file_path = upload_resp.json()["data"]["file_path"]

    # 2. Save evidence metadata (Version 1)
    save_resp = client.post(
        f"/api/v1/evidence/{ticket.id}/save",
        json={
            "filename": "evidence.pdf",
            "file_path": file_path,
            "mime_type": "application/pdf",
            "file_size": 2048,
            "sha256_hash": "a" * 64
        },
        headers=headers
    )
    assert save_resp.status_code == 200
    assert save_resp.json()["data"]["version"] == 1

    # 3. Save same evidence file again (Version 2)
    save_resp2 = client.post(
        f"/api/v1/evidence/{ticket.id}/save",
        json={
            "filename": "evidence.pdf",
            "file_path": file_path,
            "mime_type": "application/pdf",
            "file_size": 3072,
            "sha256_hash": "b" * 64
        },
        headers=headers
    )
    assert save_resp2.status_code == 200
    assert save_resp2.json()["data"]["version"] == 2

    # Verify both records are in DB
    evidences = db.query(Evidence).filter(Evidence.ticket_id == ticket.id).all()
    assert len(evidences) == 2

    # 4. Trigger bulk zipping
    zip_resp = client.get(
        f"/api/v1/evidence/{ticket.id}/zip",
        headers=headers
    )
    assert zip_resp.status_code == 200
    assert zip_resp.headers["Content-Type"] == "application/zip"
    assert len(zip_resp.content) > 0
