import pytest
from app.services.email_listener import email_listener_service
from app.services.ticket import ticket_service
from app.services.search import unified_search_service
from app.services.approval import approval_service
from app.services.threat_intel import threat_intel_service
from app.models.evidence import Evidence
from app.models.notification import InAppNotification

def test_threat_intel_service_probing():
    """Verify ThreatIntelService lookups with mock fallback mechanisms (Phase 70)."""
    # 1. IP Lookup fallback
    ip_res = threat_intel_service.lookup_ip_reputation("1.2.3.4")
    assert ip_res["success"] is True
    assert ip_res["indicator_type"] == "ip"
    
    # 2. Domain Lookup fallback
    dom_res = threat_intel_service.lookup_domain_reputation("scam-site.com")
    assert dom_res["success"] is True
    assert dom_res["status"] == "Malicious"  # keyword scam triggers it
    
    # 3. VirusTotal scan fallback
    hash_res = threat_intel_service.scan_file_hash("abc123malware")
    assert hash_res["success"] is True
    assert hash_res["status"] == "Malicious"

def test_email_attachment_extraction(client, db):
    """Verify parsing multipart emails registers attachments as Evidence linked to the ticket (Phase 34)."""
    # Register user citizen
    client.post("/api/v1/users/register", json={
        "email": "complainant@example.com",
        "password": "SecurePassword123!",
        "name": "Complainant Citizen",
        "role": "citizen"
    })
    
    # Simulate incoming multipart email with attachment
    attachments = [("phishing_invoice.pdf", b"%PDF-1.4 Mock Invoice Data")]
    ticket, is_new = email_listener_service.receive_mock_email(
        db,
        sender="complainant@example.com",
        subject="Financial Fraud UPI Scam loss of 50000 rupees",
        body="I lost 50000 rupees to a scammer using UPI payment.",
        attachments=attachments
    )
    
    assert ticket is not None
    assert is_new is True
    
    # Verify the attachment registered in Evidence repository
    evidence_list = db.query(Evidence).filter(Evidence.ticket_id == ticket.id).all()
    assert len(evidence_list) == 1
    assert evidence_list[0].filename == "phishing_invoice.pdf"
    assert evidence_list[0].mime_type == "application/pdf"
    assert evidence_list[0].file_size > 0
    assert len(evidence_list[0].sha256_hash) == 64

def test_workload_based_officer_auto_assignment(client, db):
    """Verify auto-assignment routing maps ticket to active investigator with least workload (Phase 43)."""
    # Register two investigators
    client.post("/api/v1/users/register", json={
        "email": "investigator_alpha@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Investigator Alpha",
        "role": "investigator"
    })
    client.post("/api/v1/users/register", json={
        "email": "investigator_beta@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Investigator Beta",
        "role": "investigator"
    })

    # Fetch officers to count workload
    from app.models.user import User
    alpha = db.query(User).filter(User.email == "investigator_alpha@ccgp.gov.in").first()
    beta = db.query(User).filter(User.email == "investigator_beta@ccgp.gov.in").first()
    
    # Create a ticket via service and reassign to Alpha to pre-load workload
    t1 = ticket_service.create_complaint_and_ticket(
        db,
        title="Pre-existing Fraud Case",
        description="Pre-existing ticket assigned to Alpha officer.",
        source="portal",
        reporter_name="Alpha Preload",
        reporter_email="preload@example.com"
    )
    t1.assigned_officer_id = alpha.id
    db.add(t1)
    db.commit()

    # Generate a new ticket via the auto-assignment workflow
    ticket = ticket_service.create_complaint_and_ticket(
        db,
        title="Hacking Server Breach",
        description="Our database server was compromised by intrusion.",
        source="portal",
        reporter_name="Citizen Reporter",
        reporter_email="reporter@example.com"
    )
    
    # Investigator Beta has 0 tickets workload, while Alpha has 1 ticket.
    # Auto-assignment must assign the ticket to investigator Beta!
    assert ticket.assigned_officer_id == beta.id

def test_hybrid_search_query_parsing(client, db):
    """Verify hybrid search returns matched outputs for Ticket UUID, reporter email, and name (Phase 68)."""
    ticket = ticket_service.create_complaint_and_ticket(
        db,
        title="Cyber Stalking Profile Bullying",
        description="Harassment online from unknown user account.",
        source="portal",
        reporter_name="Jessica Jones",
        reporter_email="jessica.j@example.com"
    )
    
    # 1. Search by Ticket ID UUID
    res_uuid = unified_search_service.hybrid_search(db, query_text=str(ticket.id))
    assert len(res_uuid) >= 1
    assert res_uuid[0]["ticket_id"] == str(ticket.id)
    
    # 2. Search by Complainant Name
    res_name = unified_search_service.hybrid_search(db, query_text="Jessica")
    assert len(res_name) >= 1
    assert res_name[0]["ticket_id"] == str(ticket.id)
    
    # 3. Search by Complainant Email
    res_email = unified_search_service.hybrid_search(db, query_text="jessica.j")
    assert len(res_email) >= 1
    assert res_email[0]["ticket_id"] == str(ticket.id)

def test_supervisor_rejection_workflow(client, db):
    """Verify supervisor rejection transitions ticket to 'Reopened' and resets approval flags (Phase 48)."""
    # Register supervisor and investigator
    client.post("/api/v1/users/register", json={
        "email": "investigator_super@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Investigator Super",
        "role": "investigator"
    })
    client.post("/api/v1/users/register", json={
        "email": "supervisor_rejection@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Supervisor Rejection",
        "role": "supervisor"
    })
    
    # Get users
    from app.models.user import User
    investigator = db.query(User).filter(User.email == "investigator_super@ccgp.gov.in").first()
    supervisor = db.query(User).filter(User.email == "supervisor_rejection@ccgp.gov.in").first()
    
    # Create ticket — it starts as 'New', advance to 'Assigned', then 'Under Investigation'
    ticket = ticket_service.create_complaint_and_ticket(
        db,
        title="Unauthorized Bank Transactions",
        description="Loss of funds.",
        source="portal",
        reporter_name="Bank Complainant",
        reporter_email="bank@example.com"
    )
    ticket.assigned_officer_id = investigator.id
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    # Manually advance to 'Under Investigation' (bypassing state machine for test setup)
    ticket.complaint.status = "Under Investigation"
    db.add(ticket.complaint)
    db.commit()
    db.refresh(ticket)
    
    # 1. Request closure
    approval_service.request_closure(db, ticket_id=ticket.id, actor_id=investigator.id, reason="Completed scan.")
    assert ticket.complaint.status == "Closure Requested"
    
    # 2. Grant L1 approval
    approval_service.submit_l1_approval(db, ticket_id=ticket.id, actor_id=supervisor.id, comment_text="L1 looks good.")
    assert ticket.l1_approved is True
    
    # 3. Reject closure
    approval_service.reject_closure(db, ticket_id=ticket.id, actor_id=supervisor.id, comment_text="Missing financial statement proof.")
    
    # Re-fetch ticket from db
    db.refresh(ticket)
    assert ticket.complaint.status == "Reopened"  # Rejection transitions to Reopened per state machine
    assert ticket.l1_approved is False
    assert ticket.l2_approved is False
    
    # Verify in-app notification is logged for the investigator
    notif = db.query(InAppNotification).filter(
        InAppNotification.citizen_id == investigator.id,
        InAppNotification.ticket_id == ticket.id
    ).first()
    assert notif is not None
    assert "Closure Request Rejected" in notif.title

