import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.ticket import Ticket, Complaint
from app.models.evidence import Evidence

def test_threat_intelligence_api(client: TestClient, db: Session):
    # 1. Register and login as an officer
    client.post("/api/v1/users/register", json={
        "email": "officer_qa@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Officer QA",
        "role": "cyber_cell_officer"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "officer_qa@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Post a manual blacklisted indicator
    post_resp = client.post(
        "/api/v1/threat-intel/indicators",
        json={
            "indicator_type": "ip",
            "indicator_value": "192.168.1.100",
            "description": "Mock malicious IP used for testing",
            "source_feed": "Manual Blacklist",
            "threat_score": 85.0
        },
        headers=headers
    )
    assert post_resp.status_code == 200
    assert post_resp.json()["success"] is True

    # 3. List blacklisted indicators
    list_resp = client.get("/api/v1/threat-intel/indicators", headers=headers)
    assert list_resp.status_code == 200
    data = list_resp.json()["data"]
    assert len(data) >= 1
    assert any(x["indicator_value"] == "192.168.1.100" for x in data)

    # 4. Lookup reputation for indicator
    lookup_resp = client.get("/api/v1/threat-intel/lookup?q=192.168.1.100", headers=headers)
    assert lookup_resp.status_code == 200
    lookup_data = lookup_resp.json()["data"]
    assert "indicator" in lookup_data
    assert "threat_score" in lookup_data

    # 5. Create evidence record in DB
    comp = Complaint(
        title="Intel Scan Test",
        description="Scanning evidence for malware.",
        source="portal",
        status="New",
        reporter_name="Citizen"
    )
    db.add(comp)
    db.commit()

    ticket = Ticket(
        ticket_number="SentraDesk-2026-1122",
        complaint_id=comp.id,
        category="Cyber Stalking",
        severity="Medium"
    )
    db.add(ticket)
    db.commit()

    evidence = Evidence(
        ticket_id=ticket.id,
        filename="malicious_payload.exe",
        file_path="dummy/path",
        mime_type="application/octet-stream",
        file_size=1024,
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        version=1
    )
    db.add(evidence)
    db.commit()

    # 6. Scan file hash (VirusTotal Mock)
    scan_resp = client.get(
        f"/api/v1/threat-intel/scan-file/{evidence.id}",
        headers=headers
    )
    assert scan_resp.status_code == 200
    scan_data = scan_resp.json()["data"]
    assert scan_data["status"] == "Malicious"  # Ends with .exe
    assert "VirusTotal" in scan_data["source"]


def test_blockchain_audit_verification(client: TestClient):
    # 1. Register and login as security auditor
    client.post("/api/v1/users/register", json={
        "email": "auditor_qa@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Auditor QA",
        "role": "security_auditor"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "auditor_qa@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get audit verification status
    verify_resp = client.get("/api/v1/audit/verify", headers=headers)
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()["data"]
    assert "success" in verify_data
    assert "anomalies" in verify_data

    # 3. Get audit logs
    logs_resp = client.get("/api/v1/audit/logs", headers=headers)
    assert logs_resp.status_code == 200
    assert len(logs_resp.json()["data"]) >= 0


def test_prometheus_metrics(client: TestClient):
    # Verify prometheus metrics endpoint
    client.post("/api/v1/users/register", json={
        "email": "admin_qa_metrics@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Admin QA Metrics",
        "role": "system_administrator"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin_qa_metrics@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    metrics_resp = client.get("/api/v1/metrics", headers=headers)
    assert metrics_resp.status_code == 200
    assert "sentradesk_uptime_seconds" in metrics_resp.text
    assert "sentradesk_python_version" in metrics_resp.text


def test_bi_exports_auth_and_format(client: TestClient):
    # 1. Register and login as security auditor
    client.post("/api/v1/users/register", json={
        "email": "auditor_qa_2@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Auditor QA 2",
        "role": "security_auditor"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "auditor_qa_2@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test JSON export
    json_resp = client.get("/api/v1/governance/export/json", headers=headers)
    assert json_resp.status_code == 200
    assert json_resp.headers["Content-Type"] == "application/json"

    # 3. Test CSV export
    csv_resp = client.get("/api/v1/governance/export/csv", headers=headers)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["Content-Type"]


def test_admin_direct_user_creation_and_session_invalidation(client: TestClient, db: Session):
    # 1. Register/login as system administrator
    client.post("/api/v1/users/register", json={
        "email": "admin_user_mgr@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Admin Mgr",
        "role": "system_administrator"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin_user_mgr@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    admin_token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Directly provision an officer account
    prov_resp = client.post(
        "/api/v1/admin/users",
        json={
            "email": "provisioned_officer@sentradesk.gov.in",
            "password": "TemporarySecurePassword123!",
            "name": "Provisioned Officer",
            "role": "cyber_cell_officer",
            "department": "Forensics Unit",
            "jurisdiction": "State HQ"
        },
        headers=headers
    )
    assert prov_resp.status_code == 200
    prov_data = prov_resp.json()["data"]
    assert prov_data["email"] == "provisioned_officer@sentradesk.gov.in"
    assert prov_data["role"] == "cyber_cell_officer"
    officer_id = prov_data["id"]

    # 3. Log in as the new provisioned officer
    off_login = client.post("/api/v1/auth/login", json={
        "email": "provisioned_officer@sentradesk.gov.in",
        "password": "TemporarySecurePassword123!"
    })
    assert off_login.status_code == 200
    off_token_data = off_login.json()["data"]
    off_refresh = off_token_data["refresh_token"]

    # 4. Admin resets the password (should invalidate refresh token)
    reset_resp = client.put(
        f"/api/v1/admin/users/{officer_id}",
        json={"password": "BrandNewSecurePassword123!"},
        headers=headers
    )
    assert reset_resp.status_code == 200

    # 5. Attempting to use the old refresh token to get a new access token (should fail)
    refresh_fail = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": off_refresh}
    )
    assert refresh_fail.status_code in [401, 403, 422]


def test_evidence_integrity_scan_on_demand(client: TestClient, db: Session):
    # 1. Register/login as officer
    client.post("/api/v1/users/register", json={
        "email": "officer_integrity@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Officer Integrity",
        "role": "cyber_cell_officer"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "officer_integrity@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Complaint & Ticket
    comp = Complaint(
        title="Integrity Test",
        description="Verify stored evidence SHA-256 hash match.",
        source="portal",
        status="New",
        reporter_name="Citizen"
    )
    db.add(comp)
    db.commit()

    ticket = Ticket(
        ticket_number="SentraDesk-2026-9911",
        complaint_id=comp.id,
        category="Ransomware",
        severity="High"
    )
    db.add(ticket)
    db.commit()

    evidence = Evidence(
        ticket_id=ticket.id,
        filename="ransom_note.txt",
        file_path="mock/ransom_note.txt",
        mime_type="text/plain",
        file_size=50,
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        version=1
    )
    db.add(evidence)
    db.commit()

    # 3. Post to verify-integrity endpoint
    verify_resp = client.post(
        f"/api/v1/evidence/{evidence.id}/verify-integrity",
        headers=headers
    )
    assert verify_resp.status_code == 200
    data = verify_resp.json()["data"]
    # Mock environment returns True immediately
    assert data["verified"] is True
    assert data["db_hash"] == evidence.sha256_hash


def test_approval_record_persistent_audit(client: TestClient, db: Session):
    # 1. Register/login as supervisor
    client.post("/api/v1/users/register", json={
        "email": "supervisor_audit@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Supervisor Audit",
        "role": "supervisor"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "supervisor_audit@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Register/login as investigator
    client.post("/api/v1/users/register", json={
        "email": "investigator_audit@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Investigator Audit",
        "role": "investigator"
    })
    inv_login = client.post("/api/v1/auth/login", json={
        "email": "investigator_audit@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    inv_token = inv_login.json()["data"]["access_token"]
    inv_headers = {"Authorization": f"Bearer {inv_token}"}

    # 3. Create Ticket & Complaint
    comp = Complaint(
        title="Audit Ticket",
        description="Verify approval record creation.",
        source="portal",
        status="Under Investigation",
        reporter_name="Citizen"
    )
    db.add(comp)
    db.commit()

    ticket = Ticket(
        ticket_number="SentraDesk-2026-9922",
        complaint_id=comp.id,
        category="Hacking",
        severity="High"
    )
    db.add(ticket)
    db.commit()

    # 4. Request closure as investigator
    req_resp = client.post(
        f"/api/v1/approvals/{ticket.id}/request-closure",
        json={"reason": "Completed cyber forensics audit and isolated indicators."},
        headers=inv_headers
    )
    assert req_resp.status_code == 200

    # 5. Grant L1 approval as supervisor
    l1_resp = client.post(
        f"/api/v1/approvals/{ticket.id}/l1-approve",
        json={"comment": "L1 checked out. Good job."},
        headers=headers
    )
    assert l1_resp.status_code == 200

    # 6. Check database directly for ApprovalRecord
    from app.models.ticket import ApprovalRecord
    records = db.query(ApprovalRecord).filter(ApprovalRecord.ticket_id == ticket.id).all()
    assert len(records) == 1
    assert records[0].level == 1
    assert records[0].decision == "approved"
    assert records[0].comment == "L1 checked out. Good job."

