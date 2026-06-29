from typing import Optional, List
import uuid
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.user import user_repository
from app.core.security import hash_password
from app.core.exceptions import ValidationError

class UserService:
    """Business operations governing user registration and profile details."""
    
    def get_user_by_id(self, db: Session, user_id: uuid.UUID) -> Optional[User]:
        return user_repository.get(db, user_id)

    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        return user_repository.get_by_email(db, email)

    def register_user(self, db: Session, *, email: str, password: str, name: str, role: str = "citizen") -> User:
        """Register a new user, checking for email availability first."""
        existing_user = user_repository.get_by_email(db, email)
        if existing_user:
            raise ValidationError(message="Email address already registered", code="EMAIL_ALREADY_EXISTS")
            
        hashed_password = hash_password(password)
        new_user = User(
            email=email,
            hashed_password=hashed_password,
            name=name,
            role=role,
            is_active=True
        )
        return user_repository.create(db, obj_in=new_user)

    def get_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return user_repository.get_multi(db, skip=skip, limit=limit)

user_service = UserService()
