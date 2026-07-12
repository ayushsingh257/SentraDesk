def test_register_and_login(client):
    # 1. Register a user
    register_payload = {
        "email": "test_officer@ccgp.gov.in",
        "password": "SecurePassword123!",
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
        "password": "SecurePassword123!"
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

def test_password_policy_strength_validations(client):
    # Test short password
    payload_short = {
        "email": "short@ccgp.gov.in",
        "password": "Short1!",
        "name": "Short Pass User"
    }
    resp = client.post("/api/v1/users/register", json=payload_short)
    assert resp.status_code == 422
    assert "at least 12 characters" in resp.text

    # Test missing uppercase
    payload_no_upper = {
        "email": "noupper@ccgp.gov.in",
        "password": "lowercase123!",
        "name": "No Upper User"
    }
    resp = client.post("/api/v1/users/register", json=payload_no_upper)
    assert resp.status_code == 422
    assert "uppercase letter" in resp.text

    # Test common password blocklist
    payload_common = {
        "email": "common@ccgp.gov.in",
        "password": "password12345!", # contains common word
        "name": "Common User"
    }
    # Wait, the blacklist checks if the password is EXACTLY in COMMON_PASSWORDS in lowercase
    # Let's test a blacklisted password exactly
    payload_blacklisted = {
        "email": "blacklisted@ccgp.gov.in",
        "password": "password123",
        "name": "Blacklisted User"
    }
    resp = client.post("/api/v1/users/register", json=payload_blacklisted)
    assert resp.status_code == 422
    assert "too common" in resp.text

def test_email_verification_flow(client, db):
    # Set environment to development to avoid auto-verifying registered user
    from app.core.config import settings
    original_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "development"
    
    try:
        register_payload = {
            "email": "unverified@ccgp.gov.in",
            "password": "SecurePassword123!",
            "name": "Unverified User",
            "role": "citizen"
        }
        resp = client.post("/api/v1/users/register", json=register_payload)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["email_verified"] is False
        
        # Verify verification token exists in DB
        from app.models.user import EmailVerificationToken, User
        token_entry = db.query(EmailVerificationToken).filter(EmailVerificationToken.is_used == False).first()
        assert token_entry is not None
        
        # Call verification endpoint
        verify_resp = client.post("/api/v1/auth/verify-email", json={"token": token_entry.token})
        assert verify_resp.status_code == 200
        assert verify_resp.json()["data"]["verified"] is True
        
        # Verify user state has changed
        db.refresh(token_entry)
        assert token_entry.is_used is True
        user = db.query(User).filter(User.id == token_entry.user_id).first()
        assert user.email_verified is True
    finally:
        settings.ENVIRONMENT = original_env

def test_password_forgot_and_reset_flow(client, db):
    # Register verified user
    register_payload = {
        "email": "recovery_user@ccgp.gov.in",
        "password": "SecurePassword123!",
        "name": "Recovery User"
    }
    resp = client.post("/api/v1/users/register", json=register_payload)
    assert resp.status_code == 200
    
    # 1. Trigger forgot password
    forgot_resp = client.post("/api/v1/auth/forgot-password", json={"email": "recovery_user@ccgp.gov.in"})
    assert forgot_resp.status_code == 200
    assert "instructions dispatched" in forgot_resp.json()["data"]
    
    # Verify token exists in DB
    from app.models.user import PasswordResetToken, User
    reset_entry = db.query(PasswordResetToken).filter(PasswordResetToken.is_used == False).first()
    assert reset_entry is not None
    
    # 2. Reset password
    reset_payload = {
        "token": reset_entry.token,
        "new_password": "NewSecurePassword123!"
    }
    reset_resp = client.post("/api/v1/auth/reset-password", json=reset_payload)
    assert reset_resp.status_code == 200
    assert "changed successfully" in reset_resp.json()["data"]
    
    # Verify database update
    db.refresh(reset_entry)
    assert reset_entry.is_used is True
    
    # Verify login works with new password
    login_payload = {
        "email": "recovery_user@ccgp.gov.in",
        "password": "NewSecurePassword123!"
    }
    login_resp = client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
