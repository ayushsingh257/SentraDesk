import pytest
import uuid
from datetime import datetime, timezone
from app.models.ticket import Ticket, Complaint

def test_citizen_ticket_lifecycle(client, db):
    # 1. Register and login citizen A
    client.post("/api/v1/users/register", json={
        "email": "citizen_a@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Citizen A",
        "role": "citizen"
    })
    login_a = client.post("/api/v1/auth/login", json={
        "email": "citizen_a@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    token_a = login_a.json()["data"]["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Register and login citizen B
    client.post("/api/v1/users/register", json={
        "email": "citizen_b@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Citizen B",
        "role": "citizen"
    })
    login_b = client.post("/api/v1/auth/login", json={
        "email": "citizen_b@ccgp.gov.in",
        "password": "SecurePassword123!"
    })
    token_b = login_b.json()["data"]["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Citizen A creates a complaint
    complaint_payload = {
        "title": "UPI Phishing Attack",
        "description": "I clicked on a link and lost 50,000 INR from my banking account.",
        "reporter_name": "Citizen A",
        "reporter_email": "citizen_a@ccgp.gov.in",
        "reporter_phone": "+919999988888",
        "category": "Cyber Financial Fraud",
        "fraud_amount": 50000.0,
        "upi_id": "victim@ybl"
    }
    
    resp_create = client.post("/api/v1/tickets", json=complaint_payload, headers=headers_a)
    assert resp_create.status_code == 200
    ticket_data = resp_create.json()["data"]
    ticket_id = ticket_data["id"]
    assert ticket_data["ticket_number"].startswith("CCGP-")
    assert ticket_data["complaint"]["citizen_id"] is not None

    # Verify database directly
    db_ticket = db.query(Ticket).filter(Ticket.id == uuid.UUID(ticket_id)).first()
    assert db_ticket is not None
    assert db_ticket.complaint.reporter_email == "citizen_a@ccgp.gov.in"
    assert db_ticket.complaint.metadata_json["upi_id"] == "victim@ybl"
    assert db_ticket.complaint.metadata_json["amount"] == 50000.0

    # 4. Citizen A lists their tickets (should return 1)
    resp_list_a = client.get("/api/v1/tickets/my-tickets", headers=headers_a)
    assert resp_list_a.status_code == 200
    assert len(resp_list_a.json()["data"]) == 1
    assert resp_list_a.json()["data"][0]["id"] == ticket_id

    # 5. Citizen B lists their tickets (should return 0)
    resp_list_b = client.get("/api/v1/tickets/my-tickets", headers=headers_b)
    assert resp_list_b.status_code == 200
    assert len(resp_list_b.json()["data"]) == 0

    # 6. Citizen A gets details of their ticket
    resp_detail_a = client.get(f"/api/v1/tickets/{ticket_id}", headers=headers_a)
    assert resp_detail_a.status_code == 200
    assert resp_detail_a.json()["data"]["id"] == ticket_id

    # 7. Citizen B gets details of Citizen A's ticket (should fail with 403)
    resp_detail_b = client.get(f"/api/v1/tickets/{ticket_id}", headers=headers_b)
    assert resp_detail_b.status_code == 403
    assert "Access denied" in resp_detail_b.json()["error"]["message"]

    # 8. Citizen A adds a comment to their ticket
    resp_comment_a = client.post(f"/api/v1/tickets/{ticket_id}/comments", json={"content": "Here is a follow-up indicator detail"}, headers=headers_a)
    assert resp_comment_a.status_code == 200
    assert resp_comment_a.json()["data"]["content"] == "Here is a follow-up indicator detail"

    # 9. Citizen B tries to add a comment to Citizen A's ticket (should fail with 403)
    resp_comment_b = client.post(f"/api/v1/tickets/{ticket_id}/comments", json={"content": "Malicious comment attempt"}, headers=headers_b)
    assert resp_comment_b.status_code == 403

    # 10. Citizen A tries to submit feedback on an open ticket (should fail with 400)
    resp_feed_open = client.post(f"/api/v1/tickets/{ticket_id}/feedback", json={"rating": 5, "feedback": "Great response"}, headers=headers_a)
    assert resp_feed_open.status_code == 400

    # 11. Manually close ticket in DB
    db_ticket.complaint.status = "Closed"
    db.commit()

    # 12. Citizen A submits feedback on closed ticket
    resp_feed_closed = client.post(f"/api/v1/tickets/{ticket_id}/feedback", json={"rating": 5, "feedback": "Excellent work!"}, headers=headers_a)
    assert resp_feed_closed.status_code == 200
    assert resp_feed_closed.json()["data"]["rating"] == 5
    assert resp_feed_closed.json()["data"]["feedback"] == "Excellent work!"

    # Verify timeline event logged
    resp_timeline = client.get(f"/api/v1/tickets/{ticket_id}/timeline", headers=headers_a)
    assert resp_timeline.status_code == 200
    events = [ev["event_type"] for ev in resp_timeline.json()["data"]]
    assert "FeedbackSubmitted" in events

    # 13. Citizen A reopens the closed ticket
    resp_reopen = client.post(f"/api/v1/tickets/{ticket_id}/reopen", json={"reason": "The fraud funds were only partially returned"}, headers=headers_a)
    assert resp_reopen.status_code == 200
    assert resp_reopen.json()["data"]["complaint"]["status"] == "Under Investigation"
    assert resp_reopen.json()["data"]["reopen_reason"] == "The fraud funds were only partially returned"

    # Verify timeline event logged
    resp_timeline_2 = client.get(f"/api/v1/tickets/{ticket_id}/timeline", headers=headers_a)
    events_2 = [ev["event_type"] for ev in resp_timeline_2.json()["data"]]
    assert "TicketReopened" in events_2

    # 13.5 Evidence uploading tests
    resp_ul_a = client.post(f"/api/v1/evidence/{ticket_id}/upload-link", json={"filename": "screenshot.png"}, headers=headers_a)
    assert resp_ul_a.status_code == 200
    
    resp_ul_b = client.post(f"/api/v1/evidence/{ticket_id}/upload-link", json={"filename": "screenshot.png"}, headers=headers_b)
    assert resp_ul_b.status_code == 403

    resp_save = client.post(f"/api/v1/evidence/{ticket_id}/save", json={
        "filename": "screenshot.png",
        "file_path": "bucket/screenshot.png",
        "mime_type": "image/png",
        "file_size": 1024,
        "sha256_hash": "a" * 64
    }, headers=headers_a)
    assert resp_save.status_code == 200
    evidence_id = resp_save.json()["data"]["id"]

    resp_list_ev_a = client.get(f"/api/v1/evidence/{ticket_id}", headers=headers_a)
    assert resp_list_ev_a.status_code == 200
    assert len(resp_list_ev_a.json()["data"]) == 1

    resp_list_ev_b = client.get(f"/api/v1/evidence/{ticket_id}", headers=headers_b)
    assert resp_list_ev_b.status_code == 403

    resp_dl_a = client.get(f"/api/v1/evidence/download/{evidence_id}", headers=headers_a)
    assert resp_dl_a.status_code == 200

    resp_dl_b = client.get(f"/api/v1/evidence/download/{evidence_id}", headers=headers_b)
    assert resp_dl_b.status_code == 403

    # 14. Query notifications
    from app.models.notification import NotificationLog
    notif = NotificationLog(
        recipient="citizen_a@ccgp.gov.in",
        template_name="verify_email",
        status="Sent"
    )
    db.add(notif)
    db.commit()
    
    resp_notif = client.get("/api/v1/users/notifications", headers=headers_a)
    assert resp_notif.status_code == 200
    assert len(resp_notif.json()["data"]) > 0
    assert resp_notif.json()["data"][0]["recipient"] == "citizen_a@ccgp.gov.in"
