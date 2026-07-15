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


def test_supervisor_rbac_and_input_validation(client: TestClient, db: Session):
    # 1. Login as Citizen (role: citizen) and Complaint Operator (role: complaint_operator)
    client.post("/api/v1/users/register", json={
        "email": "citizen_qa@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Citizen QA",
        "role": "citizen"
    })
    citizen_login = client.post("/api/v1/auth/login", json={
        "email": "citizen_qa@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    cit_token = citizen_login.json()["data"]["access_token"]
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    client.post("/api/v1/users/register", json={
        "email": "operator_qa@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Operator QA",
        "role": "complaint_operator"
    })
    op_login = client.post("/api/v1/auth/login", json={
        "email": "operator_qa@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    op_token = op_login.json()["data"]["access_token"]
    op_headers = {"Authorization": f"Bearer {op_token}"}

    # Register supervisor for valid auth checks
    client.post("/api/v1/users/register", json={
        "email": "supervisor_qa@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Supervisor QA",
        "role": "supervisor"
    })
    sup_login = client.post("/api/v1/auth/login", json={
        "email": "supervisor_qa@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    sup_token = sup_login.json()["data"]["access_token"]
    sup_headers = {"Authorization": f"Bearer {sup_token}"}

    # 2. Verify Citizens are Blocked on all Bulk APIs
    bulk_url_methods = [
        ("/api/v1/supervisor/bulk-approve", {"ticket_ids": [], "action": "approve", "comment": "Valid comment"}),
        ("/api/v1/supervisor/bulk-reassign", {"ticket_ids": [], "officer_id": None}),
        ("/api/v1/supervisor/bulk-priority", {"ticket_ids": [], "severity": "High"}),
        ("/api/v1/supervisor/bulk-escalate", {"ticket_ids": [], "is_escalated": True}),
    ]

    for url, payload in bulk_url_methods:
        resp = client.post(url, json=payload, headers=cit_headers)
        assert resp.status_code == 403
        
        # Operators are also blocked
        resp_op = client.post(url, json=payload, headers=op_headers)
        assert resp_op.status_code == 403

    # 3. Verify Malformed Input / Validation Errors (under Supervisor Auth)
    # Payload with invalid status/action value
    resp_invalid_action = client.post(
        "/api/v1/supervisor/bulk-approve", 
        json={"ticket_ids": [str(uuid.uuid4())], "action": "invalid_action", "comment": "Too short"},
        headers=sup_headers
    )
    assert resp_invalid_action.status_code == 422

    # Payload with comment too short
    resp_short_comment = client.post(
        "/api/v1/supervisor/bulk-approve", 
        json={"ticket_ids": [str(uuid.uuid4())], "action": "approve", "comment": "a"},
        headers=sup_headers
    )
    assert resp_short_comment.status_code == 422

    # Payload with invalid UUID string format
    resp_invalid_uuid = client.post(
        "/api/v1/supervisor/bulk-approve", 
        json={"ticket_ids": ["not-a-uuid"], "action": "approve", "comment": "Valid comment"},
        headers=sup_headers
    )
    assert resp_invalid_uuid.status_code == 422

