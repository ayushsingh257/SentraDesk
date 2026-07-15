import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.ticket import Ticket, Complaint
from app.models.user import User

def test_complete_e2e_state_cyber_cell_workflow(client: TestClient, db: Session):
    # -------------------------------------------------------------
    # 0. PRE-REGISTER THE INVESTIGATOR, SUPERVISOR, AND ADMIN
    # -------------------------------------------------------------
    # Investigator
    client.post("/api/v1/users/register", json={
        "email": "officer_e2e@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Officer E2E",
        "role": "investigator",
        "department": "Financial Fraud Unit",
        "jurisdiction": "State-wide"
    })
    
    # Supervisor
    client.post("/api/v1/users/register", json={
        "email": "supervisor_e2e@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Supervisor E2E",
        "role": "supervisor"
    })
    
    # Admin
    client.post("/api/v1/users/register", json={
        "email": "admin_e2e@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Admin E2E",
        "role": "system_administrator"
    })

    # Retrieve login headers for Investigator, Supervisor, and Admin
    inv_login = client.post("/api/v1/auth/login", json={
        "email": "officer_e2e@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    inv_headers = {"Authorization": f"Bearer {inv_login.json()['data']['access_token']}"}
    
    sup_login = client.post("/api/v1/auth/login", json={
        "email": "supervisor_e2e@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    sup_headers = {"Authorization": f"Bearer {sup_login.json()['data']['access_token']}"}

    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin_e2e@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['data']['access_token']}"}

    # -------------------------------------------------------------
    # 1. CITIZEN REGISTRATION & LOGIN
    # -------------------------------------------------------------
    client.post("/api/v1/users/register", json={
        "email": "citizen_e2e@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Citizen E2E",
        "role": "citizen"
    })
    
    citizen_login = client.post("/api/v1/auth/login", json={
        "email": "citizen_e2e@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    citizen_headers = {"Authorization": f"Bearer {citizen_login.json()['data']['access_token']}"}

    # -------------------------------------------------------------
    # 2. CITIZEN SUBMITS COMPLAINT
    # -------------------------------------------------------------
    complaint_payload = {
        "title": "UPI Fraud Phishing",
        "description": "Clicked on a suspicious link 192.168.1.105 and domain malware-phish.com and lost 25,000 INR from my banking app.",
        "reporter_name": "Citizen E2E",
        "reporter_email": "citizen_e2e@ccgp.gov.in",
        "reporter_phone": "+919999911111",
        "category": "Cyber Financial Fraud",
        "fraud_amount": 25000.0,
        "upi_id": "malicious@ybl"
    }
    
    resp_create = client.post("/api/v1/tickets", json=complaint_payload, headers=citizen_headers)
    assert resp_create.status_code == 200
    ticket_data = resp_create.json()["data"]
    ticket_id = ticket_data["id"]
    assert ticket_data["ticket_number"].startswith("CCGP-")

    # -------------------------------------------------------------
    # 3. CITIZEN UPLOADS EVIDENCE
    # -------------------------------------------------------------
    upload_resp = client.post(
        f"/api/v1/evidence/{ticket_id}/upload-link", 
        json={"filename": "screenshot_e2e.png"}, 
        headers=citizen_headers
    )
    assert upload_resp.status_code == 200
    
    save_resp = client.post(
        f"/api/v1/evidence/{ticket_id}/save",
        json={
            "filename": "screenshot_e2e.png",
            "file_size": 2048,
            "mime_type": "image/png",
            "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "file_path": "screenshot_e2e.png"
        },
        headers=citizen_headers
    )
    assert save_resp.status_code == 200

    # -------------------------------------------------------------
    # 4. OFFICER INVESTIGATION WORKFLOW
    # -------------------------------------------------------------
    # Get officer's dashboard
    dash_resp = client.get("/api/v1/officer/dashboard", headers=inv_headers)
    assert dash_resp.status_code == 200
    
    # Run manual Reputation Lookup on the threat indicators
    lookup_resp_ip = client.get(
        "/api/v1/threat-intel/lookup?q=192.168.1.105", 
        headers=inv_headers
    )
    assert lookup_resp_ip.status_code == 200
    
    # Fetch AI Analyst Dossier report
    dossier_resp = client.get(
        f"/api/v1/tickets/{ticket_id}/ai-analyst", 
        headers=inv_headers
    )
    assert dossier_resp.status_code == 200

    # Transition ticket status to Under Investigation
    status_resp = client.put(
        f"/api/v1/tickets/{ticket_id}/status",
        json={"status": "Under Investigation"},
        headers=inv_headers
    )
    assert status_resp.status_code == 200

    # Request Case Closure
    close_req = client.post(
        f"/api/v1/approvals/{ticket_id}/request-closure",
        json={"reason": "Phishing transaction investigated and logged."},
        headers=inv_headers
    )
    assert close_req.status_code == 200
    assert close_req.json()["data"]["complaint"]["status"] == "Closure Requested"

    # -------------------------------------------------------------
    # 5. SUPERVISOR REVIEW & APPROVALS
    # -------------------------------------------------------------
    # L1 Approval
    l1_resp = client.post(
        f"/api/v1/approvals/{ticket_id}/l1-approve",
        json={"comment": "L1 review verified. Proceed to final closure approval."},
        headers=sup_headers
    )
    assert l1_resp.status_code == 200
    assert l1_resp.json()["data"]["l1_approved"] is True

    # L2 Approval
    l2_resp = client.post(
        f"/api/v1/approvals/{ticket_id}/l2-approve",
        json={"comment": "L2 approved. Closing case file officially."},
        headers=sup_headers
    )
    assert l2_resp.status_code == 200
    assert l2_resp.json()["data"]["l2_approved"] is True
    assert l2_resp.json()["data"]["complaint"]["status"] == "Closed"

    # -------------------------------------------------------------
    # 6. ADMINISTRATOR SYSTEM AUDITS
    # -------------------------------------------------------------
    # Fetch configurations
    cfg_resp = client.get("/api/v1/admin/config", headers=admin_headers)
    assert cfg_resp.status_code == 200
    
    # Update classification thresholds
    update_cfg = client.put(
        "/api/v1/admin/config",
        json={
            "key": "ai_settings",
            "value": {
                "auto_classification_enabled": True,
                "min_confidence_threshold": 0.90,
                "selected_model": "SGDClassifier-offline-V2"
            }
        },
        headers=admin_headers
    )
    assert update_cfg.status_code == 200

    # Fetch audit logs
    audit_resp = client.get("/api/v1/audit/logs", headers=admin_headers)
    assert audit_resp.status_code == 200

    # Download compliance report
    report_resp = client.get("/api/v1/admin/reports/compliance", headers=admin_headers)
    assert report_resp.status_code == 200
