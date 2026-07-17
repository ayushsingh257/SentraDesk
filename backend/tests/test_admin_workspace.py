import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User

def test_admin_rbac_and_boundaries(client: TestClient, db: Session):
    # 1. Register a system administrator and login
    client.post("/api/v1/users/register", json={
        "email": "admin_suite@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Admin Suite User",
        "role": "system_administrator"
    })
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin_suite@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register a plain investigator and login
    client.post("/api/v1/users/register", json={
        "email": "investigator_suite@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Investigator Suite User",
        "role": "investigator"
    })
    inv_login = client.post("/api/v1/auth/login", json={
        "email": "investigator_suite@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    inv_token = inv_login.json()["data"]["access_token"]
    inv_headers = {"Authorization": f"Bearer {inv_token}"}

    # 3. Check RBAC boundary checks: investigator is blocked on admin-only routes
    blocked_endpoints = [
        ("GET", "/api/v1/admin/dashboard"),
        ("GET", "/api/v1/admin/users"),
        ("GET", "/api/v1/admin/config"),
        ("GET", "/api/v1/admin/roles"),
        ("GET", "/api/v1/admin/departments"),
    ]

    for method, path in blocked_endpoints:
        if method == "GET":
            resp = client.get(path, headers=inv_headers)
        assert resp.status_code == 403

    # 4. Check admin-only routes allow access for system admin
    allow_endpoints = [
        "/api/v1/admin/dashboard",
        "/api/v1/admin/users",
        "/api/v1/admin/config",
        "/api/v1/admin/roles",
        "/api/v1/admin/departments",
    ]
    for path in allow_endpoints:
        resp = client.get(path, headers=admin_headers)
        assert resp.status_code == 200


def test_admin_user_lifecycle_crud(client: TestClient, db: Session):
    # Login admin
    client.post("/api/v1/users/register", json={
        "email": "admin_lifecycle@sentradesk.gov.in",
        "password": "SecurePassword123!",
        "name": "Lifecycle Admin",
        "role": "system_administrator"
    })
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin_lifecycle@sentradesk.gov.in",
        "password": "SecurePassword123!"
    })
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Provision user via POST
    prov_resp = client.post(
        "/api/v1/admin/users",
        json={
            "email": "provisioned_user@sentradesk.gov.in",
            "password": "SecurePassword123!",
            "name": "Provisioned User",
            "role": "investigator",
            "department": "Specialized Cyber Cell",
            "jurisdiction": "Zone Alpha"
        },
        headers=admin_headers
    )
    assert prov_resp.status_code == 200
    u_id = prov_resp.json()["data"]["id"]

    # 2. Update user parameters via PUT
    up_resp = client.put(
        f"/api/v1/admin/users/{u_id}",
        json={
            "name": "Provisioned User (Updated)",
            "role": "senior_investigator"
        },
        headers=admin_headers
    )
    assert up_resp.status_code == 200
    db.expire_all()
    user_db = db.query(User).filter(User.id == uuid.UUID(u_id)).first()
    assert user_db.name == "Provisioned User (Updated)"
    assert user_db.role == "senior_investigator"

    # 3. Lock user status via POST
    lock_resp = client.post(
        f"/api/v1/admin/users/{u_id}/lock-status",
        json={"is_locked": True},
        headers=admin_headers
    )
    assert lock_resp.status_code == 200
    db.expire_all()
    assert db.query(User).filter(User.id == uuid.UUID(u_id)).first().is_locked is True

    # 4. Force logout user via POST
    logout_resp = client.post(
        f"/api/v1/admin/users/{u_id}/force-logout",
        headers=admin_headers
    )
    assert logout_resp.status_code == 200

    # 5. Soft delete user via DELETE
    del_resp = client.delete(
        f"/api/v1/admin/users/{u_id}",
        headers=admin_headers
    )
    assert del_resp.status_code == 200
    db.expire_all()
    user_del = db.query(User).filter(User.id == uuid.UUID(u_id)).first()
    assert user_del.is_deleted is True
    assert user_del.is_active is False
