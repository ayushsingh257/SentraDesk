import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.ticket import Ticket, Complaint
from app.models.evidence import Evidence

def test_threat_intelligence_api(client: TestClient, db: Session):
    # 1. Register and login as an officer
    client.post("/api/v1/users/register", json={
        "email": "officer_qa@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Officer QA",
        "role": "cyber_cell_officer"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "officer_qa@ccgp.gov.in",
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
        ticket_number="CCGP-2026-1122",
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
        "email": "auditor_qa@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Auditor QA",
        "role": "security_auditor"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "auditor_qa@ccgp.gov.in",
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
    metrics_resp = client.get("/api/v1/metrics")
    assert metrics_resp.status_code == 200
    assert "ccgp_uptime_seconds" in metrics_resp.text
    assert "ccgp_python_version" in metrics_resp.text


def test_bi_exports_auth_and_format(client: TestClient):
    # 1. Register and login as security auditor
    client.post("/api/v1/users/register", json={
        "email": "auditor_qa_2@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Auditor QA 2",
        "role": "security_auditor"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "auditor_qa_2@ccgp.gov.in",
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
