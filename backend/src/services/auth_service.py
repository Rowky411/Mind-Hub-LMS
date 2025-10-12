"""
Authentication service for user registration, login, and token management.

Handles user authentication, password verification, and JWT token generation.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, jwt

from src.core.config import settings
from src.core.security import hash_password, verify_password
from src.core.exceptions import AuthenticationError, ValidationError
from src.models.user import User, UserRole
from src.schemas.user import UserCreate, UserLogin


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db_session: AsyncSession):
        """
        Initialize authentication service.

        Args:
            db_session: Database session for user operations
        """
        self.db = db_session

    async def register_user(self, user_data: UserCreate) -> User:
        """
        Register a new user.

        Args:
            user_data: User registration data

        Returns:
            User: Created user instance

        Raises:
            ValidationError: If email already exists or data is invalid
        """
        # Check if email already exists
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise ValidationError(
                "Email already registered",
                details={"email": user_data.email}
            )

        # Create user with hashed password
        user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role,
            email_verified=False,
            is_active=True,
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def authenticate_user(self, credentials: UserLogin) -> User:
        """
        Authenticate user with email and password.

        Args:
            credentials: Login credentials

        Returns:
            User: Authenticated user instance

        Raises:
            AuthenticationError: If credentials are invalid or user is inactive
        """
        user = await self.get_user_by_email(credentials.email)

        if not user:
            raise AuthenticationError("Invalid email or password")

        if not verify_password(credentials.password, user.password_hash):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError(
                "Account is suspended. Please contact support.",
                details={"reason": "Account suspended"}
            )

        # Update last login timestamp
        user.last_login = datetime.utcnow()
        await self.db.commit()

        return user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address.

        Args:
            email: User's email address

        Returns:
            User or None: User if found, None otherwise
        """
        result = await self.db.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID.

        Args:
            user_id: User's UUID

        Returns:
            User or None: User if found, None otherwise
        """
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    def create_access_token(self, user: User) -> str:
        """
        Create JWT access token for user.

        Args:
            user: User instance

        Returns:
            str: JWT access token
        """
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        expire = datetime.utcnow() + expires_delta

        payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "type": "access",
            "exp": expire,
            "iat": datetime.utcnow(),
        }

        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return token

    def create_refresh_token(self, user: User) -> str:
        """
        Create JWT refresh token for user.

        Args:
            user: User instance

        Returns:
            str: JWT refresh token
        """
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        expire = datetime.utcnow() + expires_delta

        payload = {
            "sub": str(user.id),
            "type": "refresh",
            "exp": expire,
            "iat": datetime.utcnow(),
        }

        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return token

    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """
        Verify and decode JWT token.

        Args:
            token: JWT token string
            token_type: Expected token type ("access" or "refresh")

        Returns:
            dict: Token payload

        Raises:
            AuthenticationError: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )

            # Verify token type
            if payload.get("type") != token_type:
                raise AuthenticationError(
                    f"Invalid token type. Expected {token_type}"
                )

            return payload

        except JWTError as e:
            raise AuthenticationError(
                "Invalid or expired token",
                details={"error": str(e)}
            )

    async def refresh_access_token(self, refresh_token: str) -> tuple[str, str]:
        """
        Generate new access and refresh tokens using a refresh token.

        Args:
            refresh_token: Valid refresh token

        Returns:
            tuple: (new_access_token, new_refresh_token)

        Raises:
            AuthenticationError: If refresh token is invalid
        """
        # Verify refresh token
        payload = self.verify_token(refresh_token, token_type="refresh")

        # Get user from token
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload")

        user = await self.get_user_by_id(user_id)
        if not user:
            raise AuthenticationError("User not found")

        if not user.is_active:
            raise AuthenticationError("Account is suspended")

        # Generate new tokens
        new_access_token = self.create_access_token(user)
        new_refresh_token = self.create_refresh_token(user)

        return new_access_token, new_refresh_token
