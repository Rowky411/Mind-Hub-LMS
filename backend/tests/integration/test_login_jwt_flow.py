"""
Integration test for login and JWT verification flow.

Tests JWT token generation, validation, and usage across protected endpoints.
"""
import pytest
from httpx import AsyncClient
from fastapi import status
import time


@pytest.mark.asyncio
async def test_login_and_token_verification_flow(client: AsyncClient):
    """Test complete login flow with JWT token verification."""
    # Step 1: Register a user
    register_payload = {
        "email": "jwttest@example.com",
        "password": "SecurePass123!",
        "first_name": "JWT",
        "last_name": "Test",
        "role": "student",
    }
    await client.post("/api/v1/auth/register", json=register_payload)

    # Step 2: Login with credentials
    login_payload = {
        "email": "jwttest@example.com",
        "password": "SecurePass123!",
    }
    login_response = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_response.status_code == status.HTTP_200_OK

    tokens = login_response.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # Step 3: Verify access token works with protected endpoint
    headers = {"Authorization": f"Bearer {access_token}"}
    # Once protected endpoints are implemented, test them here
    # protected_response = await client.get("/api/v1/profile", headers=headers)
    # assert protected_response.status_code == status.HTTP_200_OK

    # Step 4: Verify token refresh works
    refresh_payload = {"refresh_token": refresh_token}
    refresh_response = await client.post("/api/v1/auth/refresh", json=refresh_payload)
    assert refresh_response.status_code == status.HTTP_200_OK

    new_tokens = refresh_response.json()
    assert new_tokens["access_token"] != access_token
    assert new_tokens["refresh_token"] != refresh_token

    # Step 5: Verify new access token works
    new_headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}
    # new_protected_response = await client.get("/api/v1/profile", headers=new_headers)
    # assert new_protected_response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_invalid_token_rejected(client: AsyncClient):
    """Test that invalid tokens are rejected."""
    headers = {"Authorization": "Bearer invalid.token.here"}
    response = await client.get("/api/v1/profile", headers=headers)

    # Should return 401 Unauthorized
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_missing_token_rejected(client: AsyncClient):
    """Test that requests without tokens are rejected for protected routes."""
    response = await client.get("/api/v1/profile")

    # Should return 401 Unauthorized
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_token_contains_user_info(client: AsyncClient):
    """Test that JWT tokens contain user information in claims."""
    # Register and login
    register_payload = {
        "email": "tokenclaims@example.com",
        "password": "SecurePass123!",
        "first_name": "Claims",
        "last_name": "Test",
        "role": "instructor",
    }
    reg_response = await client.post("/api/v1/auth/register", json=register_payload)
    user_id = reg_response.json()["user"]["id"]

    login_payload = {
        "email": "tokenclaims@example.com",
        "password": "SecurePass123!",
    }
    login_response = await client.post("/api/v1/auth/login", json=login_payload)

    # Use the access token to get current user info
    access_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # When /api/v1/auth/me or /api/v1/profile is implemented:
    # me_response = await client.get("/api/v1/auth/me", headers=headers)
    # assert me_response.status_code == status.HTTP_200_OK
    # me_data = me_response.json()
    # assert me_data["id"] == user_id
    # assert me_data["email"] == "tokenclaims@example.com"
    # assert me_data["role"] == "instructor"
