import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

SEEDED_ACCOUNTS = [
    {"email": "admin@ccgp.gov.in", "password": "password123", "role": "system_administrator"},
    {"email": "operator@ccgp.gov.in", "password": "password123", "role": "complaint_operator"},
    {"email": "officer@ccgp.gov.in", "password": "password123", "role": "cyber_cell_officer"},
    {"email": "investigator@ccgp.gov.in", "password": "password123", "role": "investigator"},
    {"email": "supervisor@ccgp.gov.in", "password": "password123", "role": "supervisor"},
    {"email": "auditor@ccgp.gov.in", "password": "password123", "role": "security_auditor"},
    {"email": "citizen@ccgp.gov.in", "password": "password123", "role": "citizen"}
]

def print_section(title):
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def test_health():
    print_section("HEALTH & CORE INTEGRATION")
    resp = requests.get(f"{BASE_URL}/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert data["data"]["postgres"] == "connected"
    assert data["data"]["redis"] == "connected"
    print("[OK] Health API is healthy and connected to DB and Redis.")

def test_auth_login_all_seeded():
    print_section("AUTHENTICATION & SEEDED ACCOUNTS CHECK")
    tokens = {}
    
    for account in SEEDED_ACCOUNTS:
        email = account["email"]
        password = account["password"]
        expected_role = account["role"]
        
        # Valid login
        resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
        data = resp.json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]
        assert data["data"]["role"] == expected_role
        
        tokens[expected_role] = data["data"]
        print(f"[OK] Successfully authenticated {email} as {expected_role}.")

    # Test invalid login handling
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "wrong@ccgp.gov.in", "password": "wrongpassword"})
    assert resp.status_code == 401
    assert resp.json()["success"] is False
    assert resp.json()["error"]["code"] == "AUTHENTICATION_FAILED"
    print("[OK] Successfully validated invalid credentials error handling (401 / AUTHENTICATION_FAILED).")
    
    return tokens

def test_refresh_token_and_logout(tokens):
    print_section("JWT REFRESH & SESSION INVALIDATION")
    operator_tokens = tokens["complaint_operator"]
    
    # 1. Test Refresh
    resp = requests.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": operator_tokens["refresh_token"]})
    assert resp.status_code == 200, f"Token refresh failed: {resp.text}"
    refresh_data = resp.json()
    assert refresh_data["success"] is True
    assert "access_token" in refresh_data["data"]
    new_access_token = refresh_data["data"]["access_token"]
    print("[OK] Successfully rotated refresh token and generated new access token.")
    
    # 2. Test Logout and access token invalidation
    headers = {"Authorization": f"Bearer {new_access_token}"}
    logout_resp = requests.post(
        f"{BASE_URL}/auth/logout", 
        json={"refresh_token": operator_tokens["refresh_token"]},
        headers=headers
    )
    assert logout_resp.status_code == 200, f"Logout failed: {logout_resp.text}"
    assert logout_resp.json()["success"] is True
    print("[OK] Successfully processed logout payload.")
    
    # Verify the invalidated token is blacklisted in Redis and rejected on subsequent calls
    user_me_resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    assert user_me_resp.status_code == 401, f"Expected token to be invalidated, got: {user_me_resp.status_code}"
    print("[OK] Verified access token invalidation with Redis blacklisting.")

def test_permission_enforcement(tokens):
    print_section("ROLE-BASED ACCESS CONTROL & PERMISSION ENFORCEMENT")
    
    citizen_headers = {"Authorization": f"Bearer {tokens['citizen']['access_token']}"}
    operator_headers = {"Authorization": f"Bearer {tokens['complaint_operator']['access_token']}"}
    officer_headers = {"Authorization": f"Bearer {tokens['cyber_cell_officer']['access_token']}"}
    
    # 1. Citizen attempting to list all tickets (should be denied)
    resp = requests.get(f"{BASE_URL}/tickets", headers=citizen_headers)
    assert resp.status_code in [401, 403], f"Expected access denied for citizen, got: {resp.status_code}"
    print("[OK] Enforced: Citizens are forbidden from listing all tickets.")
    
    # 2. Operator attempting to list all tickets (should be denied - only officer and above)
    resp = requests.get(f"{BASE_URL}/tickets", headers=operator_headers)
    assert resp.status_code in [401, 403], f"Expected access denied for operator, got: {resp.status_code}"
    print("[OK] Enforced: Complaint Operators are forbidden from listing all tickets.")

    # 3. Officer listing all tickets (should be allowed)
    resp = requests.get(f"{BASE_URL}/tickets", headers=officer_headers)
    assert resp.status_code == 200, f"Expected success for officer, got: {resp.status_code}"
    print("[OK] Enforced: Cyber Cell Officers are allowed to list all tickets.")

def test_complaint_and_ticket_lifecycle(tokens):
    print_section("COMPLAINT INTAKE, AUTOMATED SEVERITY ROUTING, AND STATE MACHINE")
    
    operator_headers = {"Authorization": f"Bearer {tokens['complaint_operator']['access_token']}"}
    officer_headers = {"Authorization": f"Bearer {tokens['cyber_cell_officer']['access_token']}"}
    supervisor_headers = {"Authorization": f"Bearer {tokens['supervisor']['access_token']}"}
    investigator_headers = {"Authorization": f"Bearer {tokens['investigator']['access_token']}"}
    
    # 1. Create a ticket (Critical financial fraud > 500k INR)
    complaint_payload = {
        "title": "Major Financial Phishing Loss",
        "description": "Citizen was tricked into entering credentials, losing 750,000 INR.",
        "source": "portal",
        "reporter_name": "Rajesh Kumar",
        "reporter_email": "rajesh@example.com",
        "reporter_phone": "+919876543211",
        "metadata_json": {
            "category": "Cyber Financial Fraud",
            "amount": 750000.0
        }
    }
    
    resp = requests.post(f"{BASE_URL}/tickets", json=complaint_payload, headers=operator_headers)
    assert resp.status_code == 200, f"Failed to create ticket: {resp.text}"
    ticket = resp.json()["data"]
    ticket_id = ticket["id"]
    
    # Verify sequence-based ticket number prefix
    assert ticket["ticket_number"].startswith("CCGP-2026-")
    # Verify auto-calculated severity (rule: financial >= 500k = Critical)
    assert ticket["severity"] == "Critical"
    # Verify automated unit routing
    assert ticket["assigned_group"] == "Financial Fraud Unit"
    print("[OK] Ticket created with auto ticket number generation, auto severity routing, and unit assignment.")
    
    # 2. Get timeline and verify creation log
    time_resp = requests.get(f"{BASE_URL}/tickets/{ticket_id}/timeline", headers=officer_headers)
    assert time_resp.status_code == 200
    timeline = time_resp.json()["data"]
    assert any(ev["event_type"] == "ComplaintCreated" for ev in timeline)
    print("[OK] Ticket creation event saved in immutable Activity Timeline.")

    # 3. Test state transition lifecycle constraints
    # Transition New -> Under Investigation directly (should be blocked by state machine)
    resp = requests.put(f"{BASE_URL}/tickets/{ticket_id}/status", json={"status": "Under Investigation"}, headers=officer_headers)
    assert resp.status_code == 422, f"State machine failed to reject invalid transition: {resp.text}"
    print("[OK] Enforced: Invalid state transitions (New -> Under Investigation) are blocked.")
    
    # Correct Transition: New -> Assigned
    resp = requests.put(f"{BASE_URL}/tickets/{ticket_id}/status", json={"status": "Assigned"}, headers=officer_headers)
    assert resp.status_code == 200, f"Transition to Assigned failed: {resp.text}"
    
    # 4. Supervisor assigns ticket to Investigator
    # Retrieve user ID of investigator
    users_resp = requests.get(f"{BASE_URL}/users/list", headers=supervisor_headers)
    users = users_resp.json()["data"]
    investigator_id = next(u["id"] for u in users if u["role"] == "investigator")
    
    assign_resp = requests.put(
        f"{BASE_URL}/tickets/{ticket_id}/assign",
        json={"officer_id": investigator_id},
        headers=supervisor_headers
    )
    assert assign_resp.status_code == 200, f"Assignment failed: {assign_resp.text}"
    assert assign_resp.json()["data"]["assigned_officer_id"] == investigator_id
    print("[OK] Ticket successfully assigned to investigator by supervisor.")

    # 5. Investigator updates status to Under Investigation
    resp = requests.put(f"{BASE_URL}/tickets/{ticket_id}/status", json={"status": "Under Investigation"}, headers=officer_headers)
    assert resp.status_code == 200
    print("[OK] Ticket transitioned to Under Investigation status.")
    
    # 6. Investigator adds comments and notes
    resp = requests.post(f"{BASE_URL}/tickets/{ticket_id}/comments", json={"content": "Contacted payment gateway for logs."}, headers=officer_headers)
    assert resp.status_code == 200
    
    resp = requests.post(f"{BASE_URL}/tickets/{ticket_id}/notes", json={"content": "Suspect IP matches known VPN block."}, headers=investigator_headers)
    assert resp.status_code == 200
    print("[OK] Successfully posted public comments and private investigator notes.")
    
    return ticket_id

def test_evidence_workflow(tokens, ticket_id):
    print_section("EVIDENCE VAULT, VERSIONING, AND ZIP GENERATION")
    
    investigator_headers = {"Authorization": f"Bearer {tokens['investigator']['access_token']}"}
    
    # 1. Fetch presigned upload link
    upload_resp = requests.post(
        f"{BASE_URL}/evidence/{ticket_id}/upload-link",
        json={"filename": "gateway_logs.csv"},
        headers=investigator_headers
    )
    assert upload_resp.status_code == 200, f"Failed to get upload link: {upload_resp.text}"
    upload_url = upload_resp.json()["data"]["upload_url"].replace("http://minio:9000", "http://localhost:9000")
    file_path = upload_resp.json()["data"]["file_path"]
    print("[OK] Retrieved presigned upload link.")
    
    # 2. Upload file content directly (PUT mock)
    # Since we are running in integrated environment, we can upload directly
    direct_put_resp = requests.put(upload_url, data="IP,Amount,Status\n1.2.3.4,750000,Success", headers={"Content-Type": "text/csv", "Host": "minio:9000"})
    assert direct_put_resp.status_code == 200, f"Direct upload PUT to storage failed: {direct_put_resp.status_code}"
    print("[OK] Uploaded evidence binary directly to storage.")
    
    # 3. Save metadata (Version 1)
    save_resp = requests.post(
        f"{BASE_URL}/evidence/{ticket_id}/save",
        json={
            "filename": "gateway_logs.csv",
            "file_path": file_path,
            "mime_type": "text/csv",
            "file_size": 33,
            "sha256_hash": "a"*64
        },
        headers=investigator_headers
    )
    assert save_resp.status_code == 200, f"Failed to save metadata: {save_resp.text}"
    evidence = save_resp.json()["data"]
    assert evidence["version"] == 1
    evidence_id = evidence["id"]
    print("[OK] Evidence metadata saved in database (Version 1).")
    
    # 4. Save metadata again to test auto-version incrementing
    save_resp2 = requests.post(
        f"{BASE_URL}/evidence/{ticket_id}/save",
        json={
            "filename": "gateway_logs.csv",
            "file_path": file_path,
            "mime_type": "text/csv",
            "file_size": 33,
            "sha256_hash": "b"*64
        },
        headers=investigator_headers
    )
    assert save_resp2.status_code == 200
    assert save_resp2.json()["data"]["version"] == 2
    print("[OK] Evidence auto-versioning verified (Version 2 incremented successfully).")
    
    # 5. Retrieve evidence download link
    dl_resp = requests.get(f"{BASE_URL}/evidence/download/{evidence_id}", headers=investigator_headers)
    assert dl_resp.status_code == 200
    assert "data" in dl_resp.json()
    print("[OK] Evidence download link successfully retrieved.")
    
    # 6. Verify bulk zip compilation
    zip_resp = requests.get(f"{BASE_URL}/evidence/{ticket_id}/zip", headers=investigator_headers)
    assert zip_resp.status_code == 200
    assert zip_resp.headers["Content-Type"] == "application/zip"
    assert len(zip_resp.content) > 0
    print("[OK] Verified compilation of evidence vault to ZIP archive.")

def test_ticket_merging(tokens, primary_ticket_id):
    print_section("TICKET MERGE & DE-DUPLICATION ENGINE")
    
    operator_headers = {"Authorization": f"Bearer {tokens['complaint_operator']['access_token']}"}
    supervisor_headers = {"Authorization": f"Bearer {tokens['supervisor']['access_token']}"}
    
    # 1. Create a duplicate ticket
    complaint_payload = {
        "title": "Phishing Scam - Duplicate",
        "description": "Same incident of 750,000 INR phishing report.",
        "source": "portal",
        "reporter_name": "Rajesh Kumar",
        "reporter_email": "rajesh@example.com",
        "reporter_phone": "+919876543211",
        "metadata_json": {
            "category": "Cyber Financial Fraud",
            "amount": 750000.0
        }
    }
    resp = requests.post(f"{BASE_URL}/tickets", json=complaint_payload, headers=operator_headers)
    assert resp.status_code == 200
    dup_ticket = resp.json()["data"]
    dup_ticket_id = dup_ticket["id"]
    print(f"[OK] Duplicate ticket {dup_ticket['ticket_number']} created.")
    
    # 2. Merge duplicate ticket into primary
    merge_resp = requests.post(
        f"{BASE_URL}/tickets/merge?primary_ticket_id={primary_ticket_id}",
        json={"duplicate_ticket_id": dup_ticket_id},
        headers=supervisor_headers
    )
    assert merge_resp.status_code == 200, f"Ticket merge failed: {merge_resp.text}"
    print("[OK] Supervisor successfully merged duplicate ticket into primary.")
    
    # 3. Verify duplicate status is closed and metadata links them
    officer_headers = {"Authorization": f"Bearer {tokens['cyber_cell_officer']['access_token']}"}
    dup_details = requests.get(f"{BASE_URL}/tickets/{dup_ticket_id}", headers=officer_headers).json()["data"]
    assert dup_details["complaint"]["status"] == "Closed"
    assert dup_details["complaint"]["metadata_json"]["merged_into_ticket_id"] == str(primary_ticket_id)
    print("[OK] Duplicate ticket closed automatically and metadata reference verified.")

def test_closure_approval_pipeline(tokens, ticket_id):
    print_section("CLOSURE APPROVAL PIPELINE (L1 & L2 SUPERVISORS)")
    
    investigator_headers = {"Authorization": f"Bearer {tokens['investigator']['access_token']}"}
    supervisor_headers = {"Authorization": f"Bearer {tokens['supervisor']['access_token']}"}
    
    # 1. Investigator requests closure
    close_resp = requests.post(
        f"{BASE_URL}/approvals/{ticket_id}/request-closure",
        json={"reason": "Investigation complete. Fraudulent bank account frozen."},
        headers=investigator_headers
    )
    assert close_resp.status_code == 200, f"Closure request failed: {close_resp.text}"
    assert close_resp.json()["data"]["complaint"]["status"] == "Closure Requested"
    print("[OK] Case status updated to 'Closure Requested' by investigator.")
    
    # 2. Supervisor L1 Approval
    l1_resp = requests.post(
        f"{BASE_URL}/approvals/{ticket_id}/l1-approve",
        json={"comment": "L1 review completed. Looks clean."},
        headers=supervisor_headers
    )
    assert l1_resp.status_code == 200, f"L1 approval failed: {l1_resp.text}"
    assert l1_resp.json()["data"]["l1_approved"] is True
    print("[OK] Supervisor L1 approval registered.")
    
    # 3. Supervisor L2 Final Approval
    l2_resp = requests.post(
        f"{BASE_URL}/approvals/{ticket_id}/l2-approve",
        json={"comment": "L2 review completed. Final closure authorized."},
        headers=supervisor_headers
    )
    assert l2_resp.status_code == 200, f"L2 approval failed: {l2_resp.text}"
    assert l2_resp.json()["data"]["l2_approved"] is True
    assert l2_resp.json()["data"]["complaint"]["status"] == "Closed"
    print("[OK] Supervisor L2 final approval registered. Ticket status updated to 'Closed'.")

def main():
    import traceback
    try:
        test_health()
        tokens = test_auth_login_all_seeded()
        test_refresh_token_and_logout(tokens)
        test_permission_enforcement(tokens)
        ticket_id = test_complaint_and_ticket_lifecycle(tokens)
        test_evidence_workflow(tokens, ticket_id)
        test_ticket_merging(tokens, ticket_id)
        test_closure_approval_pipeline(tokens, ticket_id)
        print("\n" + "="*60)
        print(" ALL VERIFICATIONS PASSED SUCCESSFULLY")
        print("="*60)
    except Exception as e:
        print("\n[FAIL] Verification failed:")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
