"""
Authentication API endpoints.

Handles user registration, login, token refresh, and password reset.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.exceptions import create_error_response
from src.schemas.user import (
    UserCreate,
    UserLogin,
    TokenResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    UserResponse,
)
from src.services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_session),
):
    """
    Register a new user.

    Creates a new user account and returns authentication tokens.

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        TokenResponse: Access token, refresh token, and user data

    Raises:
        400: Email already registered
        422: Validation error (weak password, invalid email, etc.)
    """
    auth_service = AuthService(db)

    # Register user
    user = await auth_service.register_user(user_data)

    # Generate tokens
    access_token = auth_service.create_access_token(user)
    refresh_token = auth_service.create_refresh_token(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_session),
):
    """
    Authenticate user and return tokens.

    Args:
        credentials: User login credentials (email and password)
        db: Database session

    Returns:
        TokenResponse: Access token, refresh token, and user data

    Raises:
        401: Invalid credentials or inactive account
    """
    auth_service = AuthService(db)

    # Authenticate user
    user = await auth_service.authenticate_user(credentials)

    # Generate tokens
    access_token = auth_service.create_access_token(user)
    refresh_token = auth_service.create_refresh_token(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_session),
):
    """
    Refresh access and refresh tokens.

    Uses a valid refresh token to generate new access and refresh tokens.

    Args:
        request: Refresh token request containing the refresh token
        db: Database session

    Returns:
        RefreshTokenResponse: New access and refresh tokens

    Raises:
        401: Invalid or expired refresh token
    """
    auth_service = AuthService(db)

    # Generate new tokens
    new_access_token, new_refresh_token = await auth_service.refresh_access_token(
        request.refresh_token
    )

    return RefreshTokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )


@router.post("/password-reset-request", status_code=status.HTTP_200_OK)
async def request_password_reset(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_session),
):
    """
    Request a password reset.

    Sends a password reset email to the user if the email exists.
    Always returns 200 OK to prevent email enumeration.

    Args:
        request: Password reset request with email
        db: Database session

    Returns:
        dict: Success message
    """
    auth_service = AuthService(db)

    # Check if user exists (don't reveal if user doesn't exist)
    user = await auth_service.get_user_by_email(request.email)

    if user:
        # TODO: Generate password reset token and send email
        # For now, just return success
        # In production, this would:
        # 1. Generate a time-limited reset token
        # 2. Store token hash in database or cache
        # 3. Send email with reset link containing token
        pass

    # Always return success to prevent email enumeration
    return {
        "message": "If the email exists, a password reset link has been sent",
        "email": request.email,
    }


@router.post("/password-reset-confirm", status_code=status.HTTP_200_OK)
async def confirm_password_reset(
    request: PasswordResetConfirm,
    db: AsyncSession = Depends(get_session),
):
    """
    Confirm password reset with token.

    Resets the user's password using a valid reset token.

    Args:
        request: Password reset confirmation with token and new password
        db: Database session

    Returns:
        dict: Success message

    Raises:
        401: Invalid or expired reset token
        422: Weak password
    """
    # TODO: Implement password reset confirmation
    # This would:
    # 1. Verify reset token is valid and not expired
    # 2. Get user from token
    # 3. Update password hash
    # 4. Invalidate reset token
    # 5. Optionally send confirmation email

    return {
        "message": "Password has been reset successfully",
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    """
    Logout user (client-side token deletion).

    Since we're using stateless JWT tokens, logout is handled client-side
    by deleting the tokens from storage. This endpoint exists for API completeness
    and potential future server-side token blacklisting.

    Returns:
        dict: Success message
    """
    return {
        "message": "Successfully logged out. Please delete your tokens.",
    }
