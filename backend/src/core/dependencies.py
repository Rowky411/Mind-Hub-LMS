"""
FastAPI dependencies for authentication and authorization.

Provides dependency injection for current user, role verification, and database sessions.
"""
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.exceptions import AuthenticationError
from src.models.user import User, UserRole
from src.services.auth_service import AuthService


# OAuth2 scheme for JWT bearer tokens
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_session),
) -> User:
    """
    Get current authenticated user from JWT token.

    Args:
        credentials: HTTP bearer token credentials
        db: Database session

    Returns:
        User: Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials

    try:
        auth_service = AuthService(db)
        payload = auth_service.verify_token(token, token_type="access")

        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload")

        user = await auth_service.get_user_by_id(user_id)
        if not user:
            raise AuthenticationError("User not found")

        if not user.is_active:
            raise AuthenticationError("Account is suspended")

        return user

    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current active user (shorthand for common use case).

    Args:
        current_user: Current user from token

    Returns:
        User: Current active user
    """
    return current_user


def require_role(allowed_roles: List[UserRole]):
    """
    Dependency factory to require specific user roles.

    Args:
        allowed_roles: List of allowed user roles

    Returns:
        Dependency function that verifies user role

    Example:
        @router.get("/admin-only")
        async def admin_endpoint(user: User = Depends(require_role([UserRole.ADMIN]))):
            ...
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        """Check if user has required role."""
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker


# Convenience dependencies for specific roles
require_student = require_role([UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN])
require_instructor = require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])
require_admin = require_role([UserRole.ADMIN])


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_session),
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise.

    Useful for endpoints that have different behavior for authenticated vs anonymous users.

    Args:
        credentials: Optional HTTP bearer token credentials
        db: Database session

    Returns:
        User or None: Current user if authenticated, None otherwise
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        auth_service = AuthService(db)
        payload = auth_service.verify_token(token, token_type="access")

        user_id = payload.get("sub")
        if not user_id:
            return None

        user = await auth_service.get_user_by_id(user_id)
        if not user or not user.is_active:
            return None

        return user

    except Exception:
        return None


def require_course_ownership(user: User, course_instructor_id: str) -> bool:
    """
    Check if user owns a course.

    Args:
        user: Current user
        course_instructor_id: Course instructor's user ID

    Returns:
        bool: True if user owns the course or is admin

    Raises:
        HTTPException: If user doesn't own the course
    """
    if user.is_admin:
        return True

    if str(user.id) != course_instructor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this course",
        )

    return True


def require_enrollment(user: User, enrollment_user_id: str) -> bool:
    """
    Check if user owns an enrollment.

    Args:
        user: Current user
        enrollment_user_id: Enrollment's user ID

    Returns:
        bool: True if user owns the enrollment or is admin

    Raises:
        HTTPException: If user doesn't own the enrollment
    """
    if user.is_admin:
        return True

    if str(user.id) != enrollment_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this enrollment",
        )

    return True
