from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.user import User
from app.core.security import hash_password

def seed_data():
    """Create basic system roles and administrative testing accounts."""
    db = SessionLocal()
    try:
        # Verify if users are already seeded
        existing = db.query(User).filter(User.email == "admin@sentradesk.gov.in").first()
        if existing:
            print("Database has already been seeded.")
            return
            
        print("Seeding database tables with default user roles...")
        
        users_data = [
            {"email": "admin@sentradesk.gov.in", "name": "System Administrator", "role": "system_administrator"},
            {"email": "operator@sentradesk.gov.in", "name": "Complaint Operator", "role": "complaint_operator"},
            {"email": "officer@sentradesk.gov.in", "name": "Cyber Cell Officer", "role": "cyber_cell_officer"},
            {"email": "investigator@sentradesk.gov.in", "name": "Investigator Officer", "role": "investigator"},
            {"email": "supervisor@sentradesk.gov.in", "name": "Supervisory Supervisor", "role": "supervisor"},
            {"email": "auditor@sentradesk.gov.in", "name": "Security Auditor", "role": "security_auditor"},
            {"email": "citizen@sentradesk.gov.in", "name": "Citizen User", "role": "citizen"}
        ]
        
        default_pwd_hash = hash_password("password123")
        
        for u in users_data:
            db_user = User(
                email=u["email"],
                hashed_password=default_pwd_hash,
                name=u["name"],
                role=u["role"],
                is_active=True
            )
            db.add(db_user)
            
        db.commit()
        print("Database seeding completed successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    seed_data()
