"""
Custom exception classes and error response utilities.

Provides consistent error handling across the API.
"""
from typing import Any, Dict, Optional

from fastapi import HTTPException, status


class AppException(Exception):
    """Base exception for application errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(AppException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)


class AuthorizationError(AppException):
    """Raised when user lacks required permissions."""

    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, details)


class NotFoundError(AppException):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_404_NOT_FOUND, details)


class ValidationError(AppException):
    """Raised when input validation fails."""

    def __init__(self, message: str = "Validation error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class ConflictError(AppException):
    """Raised when a resource conflict occurs (e.g., duplicate email)."""

    def __init__(self, message: str = "Resource conflict", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_409_CONFLICT, details)


class RateLimitError(AppException):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, details)


def create_error_response(
    code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a standardized error response.

    Args:
        code: Error code (e.g., "VALIDATION_ERROR")
        message: Human-readable error message
        details: Optional additional error details
        request_id: Optional request ID for support/debugging

    Returns:
        Dict[str, Any]: Standardized error response
    """
    error_response = {
        "error": {
            "code": code,
            "message": message,
        }
    }

    if details:
        error_response["error"]["details"] = details

    if request_id:
        error_response["error"]["request_id"] = request_id

    return error_response
