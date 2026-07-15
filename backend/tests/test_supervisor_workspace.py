import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.ticket import Ticket, Complaint

def test_supervisor_access_and_dashboard(client: TestClient, db: Session):
    # 1. Register a supervisor and log in
    client.post("/api/v1/users/register", json={
        "email": "supervisor_test_workspace@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Supervisor Test Workspace",
        "role": "supervisor"
    })
    sup_login = client.post("/api/v1/auth/login", json={
        "email": "supervisor_test_workspace@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    sup_token = sup_login.json()["data"]["access_token"]
    sup_headers = {"Authorization": f"Bearer {sup_token}"}

    # 2. Register a complaint operator and log in (should be blocked)
    client.post("/api/v1/users/register", json={
        "email": "operator_test_workspace@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Operator Test Workspace",
        "role": "complaint_operator"
    })
    op_login = client.post("/api/v1/auth/login", json={
        "email": "operator_test_workspace@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    op_token = op_login.json()["data"]["access_token"]
    op_headers = {"Authorization": f"Bearer {op_token}"}

    # 3. Deny operator access
    resp = client.get("/api/v1/supervisor/dashboard", headers=op_headers)
    assert resp.status_code == 403

    # 4. Allow supervisor access
    resp = client.get("/api/v1/supervisor/dashboard", headers=sup_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "stats" in data
    assert "category_distribution" in data
    assert "officer_productivity" in data


def test_supervisor_bulk_operations(client: TestClient, db: Session):
    # Register supervisor
    client.post("/api/v1/users/register", json={
        "email": "supervisor_test_workspace@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Supervisor Test Workspace",
        "role": "supervisor"
    })
    # 1. Login as supervisor
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "supervisor_test_workspace@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    sup_token = login_resp.json()["data"]["access_token"]
    sup_headers = {"Authorization": f"Bearer {sup_token}"}

    # 2. Login as investigator
    client.post("/api/v1/users/register", json={
        "email": "investigator_test_workspace@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Investigator Test Workspace",
        "role": "investigator"
    })
    inv_login = client.post("/api/v1/auth/login", json={
        "email": "investigator_test_workspace@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    inv_token = inv_login.json()["data"]["access_token"]
    inv_headers = {"Authorization": f"Bearer {inv_token}"}

    # 3. Create two test tickets
    tickets = []
    for i in range(2):
        comp = Complaint(
            title=f"Bulk Case {i}",
            description="Testing bulk update workflows.",
            source="portal",
            status="Under Investigation",
            reporter_name="Citizen Complainant"
        )
        db.add(comp)
        db.commit()

        t = Ticket(
            ticket_number=f"CCGP-2026-880{i}",
            complaint_id=comp.id,
            category="UPI Fraud",
            severity="Low"
        )
        db.add(t)
        db.commit()
        tickets.append(t)

    ticket_ids = [str(t.id) for t in tickets]

    # 4. Test Bulk Priority Change
    bp_resp = client.post(
        "/api/v1/supervisor/bulk-priority",
        json={"ticket_ids": ticket_ids, "severity": "Critical"},
        headers=sup_headers
    )
    assert bp_resp.status_code == 200
    db.expire_all()
    assert db.query(Ticket).filter(Ticket.id == tickets[0].id).first().severity == "Critical"

    # 5. Test Bulk Escalation
    be_resp = client.post(
        "/api/v1/supervisor/bulk-escalate",
        json={"ticket_ids": ticket_ids, "is_escalated": True},
        headers=sup_headers
    )
    assert be_resp.status_code == 200
    db.expire_all()
    assert db.query(Ticket).filter(Ticket.id == tickets[0].id).first().is_escalated is True

    # 6. Test Bulk Reassignment
    # Fetch supervisor ID
    user_me = client.get("/api/v1/users/me", headers=inv_headers).json()["data"]
    inv_id = user_me["id"]

    br_resp = client.post(
        "/api/v1/supervisor/bulk-reassign",
        json={"ticket_ids": ticket_ids, "officer_id": inv_id},
        headers=sup_headers
    )
    assert br_resp.status_code == 200
    db.expire_all()
    assert str(db.query(Ticket).filter(Ticket.id == tickets[0].id).first().assigned_officer_id) == inv_id

    # 7. Test Bulk Closure Requests & Bulk Approvals
    # Request closure for both
    for t_id in ticket_ids:
        client.post(
            f"/api/v1/approvals/{t_id}/request-closure",
            json={"reason": "Audit complete."},
            headers=inv_headers
        )

    # Bulk Approve L1
    ba_resp = client.post(
        "/api/v1/supervisor/bulk-approve",
        json={"ticket_ids": ticket_ids, "action": "approve", "comment": "Bulk L1 OK"},
        headers=sup_headers
    )
    assert ba_resp.status_code == 200
    db.expire_all()
    assert db.query(Ticket).filter(Ticket.id == tickets[0].id).first().l1_approved is True
