def test_create_and_manage_ticket(client):
    # 1. Register operator & supervisor
    client.post("/api/v1/users/register", json={
        "email": "operator@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Operator",
        "role": "complaint_operator"
    })
    client.post("/api/v1/users/register", json={
        "email": "supervisor@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Supervisor",
        "role": "supervisor"
    })
    client.post("/api/v1/users/register", json={
        "email": "officer@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Officer",
        "role": "cyber_cell_officer"
    })

    # 2. Login as operator
    login_op = client.post("/api/v1/auth/login", json={"email": "operator@sentradesk.gov.in", "password": "SecurePassword123!"})
    op_token = login_op.json()["data"]["access_token"]

    # 3. Create Ticket (Operator role)
    complaint_payload = {
        "title": "Stolen Funds UPI Scam",
        "description": "Victim transfered 150,000 INR to a fraudulent UPI account.",
        "source": "portal",
        "reporter_name": "Ayush Singh",
        "reporter_email": "ayush@example.com",
        "reporter_phone": "+919876543210",
        "metadata_json": {
            "category": "Cyber Financial Fraud",
            "amount": 150000.0
        }
    }
    
    response = client.post(
        "/api/v1/tickets", 
        json=complaint_payload,
        headers={"Authorization": f"Bearer {op_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    ticket_id = data["data"]["id"]
    assert data["data"]["severity"] == "High" # Rule: Financial Fraud >= 100k
    assert data["data"]["assigned_group"] == "Financial Fraud Unit"

    # 4. Login as supervisor to assign
    login_sup = client.post("/api/v1/auth/login", json={"email": "supervisor@sentradesk.gov.in", "password": "SecurePassword123!"})
    sup_token = login_sup.json()["data"]["access_token"]

    # Get officer details to assign
    me_resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {sup_token}"})
    officer_id = me_resp.json()["data"]["id"]

    # Assign Ticket
    assign_resp = client.put(
        f"/api/v1/tickets/{ticket_id}/assign",
        json={"officer_id": officer_id},
        headers={"Authorization": f"Bearer {sup_token}"}
    )
    assert assign_resp.status_code == 200
    assert assign_resp.json()["data"]["assigned_officer_id"] == officer_id

def test_ai_pipeline_and_similar_tickets(client):
    # Reset Qdrant collection to ensure test determinism on persistent clusters
    from app.core.qdrant import qdrant_client, init_qdrant_schema
    try:
        qdrant_client.delete_collection("complaints")
    except Exception:
        pass
    init_qdrant_schema()

    # 0. Register operator & officer
    client.post("/api/v1/users/register", json={
        "email": "operator@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Operator",
        "role": "complaint_operator"
    })
    client.post("/api/v1/users/register", json={
        "email": "officer@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Officer",
        "role": "cyber_cell_officer"
    })

    # 1. Login as operator
    login_op = client.post("/api/v1/auth/login", json={"email": "operator@sentradesk.gov.in", "password": "SecurePassword123!"})
    op_token = login_op.json()["data"]["access_token"]

    # 2. Login as officer
    login_off = client.post("/api/v1/auth/login", json={"email": "officer@sentradesk.gov.in", "password": "SecurePassword123!"})
    off_token = login_off.json()["data"]["access_token"]

    # 3. Create Ticket 1
    resp1 = client.post(
        "/api/v1/tickets",
        json={
            "title": "UPI phishing scam",
            "description": "I lost funds from my account through a fake upi transaction transfer wallet scam to fraudster@okaxis",
            "source": "portal",
            "reporter_name": "Ravi",
            "metadata_json": {"amount": 250000.0}
        },
        headers={"Authorization": f"Bearer {op_token}"}
    )
    assert resp1.status_code == 200
    ticket1 = resp1.json()["data"]
    t1_id = ticket1["id"]
    
    # Assert AI telemetry was populated
    assert "ai_category_prediction" in ticket1["complaint"]["metadata_json"]
    assert ticket1["complaint"]["metadata_json"]["ai_category_prediction"] == "Cyber Financial Fraud"
    assert ticket1["complaint"]["metadata_json"]["ai_language"] == "en"

    # 4. Create Ticket 2 (highly similar words)
    resp2 = client.post(
        "/api/v1/tickets",
        json={
            "title": "Scam upi transaction",
            "description": "Lost my money to a fake upi transaction transfer debit scam wallet link",
            "source": "portal",
            "reporter_name": "Amit",
            "metadata_json": {"amount": 50000.0}
        },
        headers={"Authorization": f"Bearer {op_token}"}
    )
    assert resp2.status_code == 200
    t2_id = resp2.json()["data"]["id"]

    # 5. Query similarity on Ticket 1
    sim_resp = client.get(
        f"/api/v1/tickets/{t1_id}/similar?limit=20",
        headers={"Authorization": f"Bearer {off_token}"}
    )
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()["data"]
    
    # Assert that ticket 2 is returned as similar
    assert len(sim_data) >= 1
    similar_ids = [item["ticket_id"] for item in sim_data]
    assert t2_id in similar_ids
    
    # Check similarity score is high (above 50%)
    t2_match = [x for x in sim_data if x["ticket_id"] == t2_id][0]
    assert t2_match["similarity_score"] > 50.0

    # 6. Verify explanation endpoint
    exp_resp = client.get(
        f"/api/v1/tickets/{t1_id}/explain",
        headers={"Authorization": f"Bearer {off_token}"}
    )
    assert exp_resp.status_code == 200
    exp_data = exp_resp.json()["data"]
    assert exp_data["predicted_category"] == "Cyber Financial Fraud"
    assert "SGDClassifier" in exp_data["reasoning"]
    assert "fraudster@okaxis" in exp_data["reasoning"]

    # 7. Create a low-confidence ticket that flags needs_review
    resp3 = client.post(
        "/api/v1/tickets",
        json={
            "title": "Vague incident query",
            "description": "Just checking general platform operations and help center query support.",
            "source": "portal",
            "reporter_name": "Suresh",
            "metadata_json": {}
        },
        headers={"Authorization": f"Bearer {op_token}"}
    )
    assert resp3.status_code == 200
    t3_data = resp3.json()["data"]
    assert t3_data["complaint"]["metadata_json"]["needs_ai_review"] is True

    # 8. Query list with needs_review filter
    review_resp = client.get(
        "/api/v1/tickets?needs_review=true",
        headers={"Authorization": f"Bearer {off_token}"}
    )
    assert review_resp.status_code == 200
    review_tickets = review_resp.json()["data"]
    review_ids = [t["id"] for t in review_tickets]
    assert t3_data["id"] in review_ids

    # 9. Verify Investigator AI Assistant Summary Card
    sum_resp = client.get(
        f"/api/v1/tickets/{t1_id}/ai-summary",
        headers={"Authorization": f"Bearer {off_token}"}
    )
    assert sum_resp.status_code == 200
    sum_data = sum_resp.json()["data"]
    assert sum_data["category"] == "Cyber Financial Fraud"
    assert len(sum_data["key_facts"]) >= 2
    assert "fraudster@okaxis" in "".join(sum_data["key_facts"])
    assert len(sum_data["suggested_next_steps"]) >= 2
    assert "halt transactions" in "".join(sum_data["suggested_next_steps"])

    # 10. Verify structured SIEM audit log file exists and contains entries
    import os
    import json
    from app.core.logging import AI_INFERENCE_LOG_PATH
    
    assert os.path.exists(AI_INFERENCE_LOG_PATH) is True
    with open(AI_INFERENCE_LOG_PATH, "r") as f:
        log_lines = f.readlines()
    assert len(log_lines) >= 3
    
    # Parse last log line
    last_log = json.loads(log_lines[-1])
    assert "ticket_id" in last_log
    assert "predicted_category" in last_log
    assert "inference_time_ms" in last_log

    # 11. Verify hybrid global search endpoint
    search_resp = client.get(
        "/api/v1/tickets/global/search?q=phishing+scam+upi",
        headers={"Authorization": f"Bearer {off_token}"}
    )
    assert search_resp.status_code == 200
    search_results = search_resp.json()["data"]
    assert len(search_results) >= 1
    
    # Assert ticket 1 is matched
    matched_ids = [item["ticket_id"] for item in search_results]
    assert t1_id in matched_ids
    t1_match = [x for x in search_results if x["ticket_id"] == t1_id][0]
    assert t1_match["match_type"] in ["hybrid", "semantic", "keyword"]
    assert t1_match["score"] > 20.0

