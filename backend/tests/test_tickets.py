def test_create_and_manage_ticket(client):
    # 1. Register operator & supervisor
    client.post("/api/v1/users/register", json={
        "email": "operator@ccgp.gov.in",
        "password": "password123",
        "name": "Operator",
        "role": "complaint_operator"
    })
    client.post("/api/v1/users/register", json={
        "email": "supervisor@ccgp.gov.in",
        "password": "password123",
        "name": "Supervisor",
        "role": "supervisor"
    })
    client.post("/api/v1/users/register", json={
        "email": "officer@ccgp.gov.in",
        "password": "password123",
        "name": "Officer",
        "role": "cyber_cell_officer"
    })

    # 2. Login as operator
    login_op = client.post("/api/v1/auth/login", json={"email": "operator@ccgp.gov.in", "password": "password123"})
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
    login_sup = client.post("/api/v1/auth/login", json={"email": "supervisor@ccgp.gov.in", "password": "password123"})
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
