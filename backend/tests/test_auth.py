def test_register_and_login(client):
    # 1. Register a user
    register_payload = {
        "email": "test_officer@ccgp.gov.in",
        "password": "securepassword123",
        "name": "Test Officer",
        "role": "cyber_cell_officer"
    }
    response = client.post("/api/v1/users/register", json=register_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "test_officer@ccgp.gov.in"
    assert data["data"]["role"] == "cyber_cell_officer"

    # 2. Login with credentials
    login_payload = {
        "email": "test_officer@ccgp.gov.in",
        "password": "securepassword123"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["role"] == "cyber_cell_officer"

def test_login_invalid_credentials(client):
    login_payload = {
        "email": "unknown@ccgp.gov.in",
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "AUTHENTICATION_FAILED"
