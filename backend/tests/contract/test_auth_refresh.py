"""
Contract test for POST /api/v1/auth/refresh endpoint.

Tests token refresh functionality per Constitution Principle VI.
"""
import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.asyncio
async def test_refresh_token_success(client: AsyncClient):
    """Test successful token refresh with valid refresh token."""
    # Register and login to get tokens
    register_payload = {
        "email": "refreshtest@example.com",
        "password": "SecurePass123!",
        "first_name": "Refresh",
        "last_name": "Test",
    }
    await client.post("/api/v1/auth/register", json=register_payload)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "refreshtest@example.com", "password": "SecurePass123!"}
    )
    old_tokens = login_response.json()

    # Refresh the token
    refresh_payload = {"refresh_token": old_tokens["refresh_token"]}
    response = await client.post("/api/v1/auth/refresh", json=refresh_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Verify response structure
    assert "access_token" in data
    assert "refresh_token" in data

    # New tokens should be different from old ones
    assert data["access_token"] != old_tokens["access_token"]
    assert data["refresh_token"] != old_tokens["refresh_token"]


@pytest.mark.asyncio
async def test_refresh_token_invalid(client: AsyncClient):
    """Test refresh fails with invalid token."""
    refresh_payload = {"refresh_token": "invalid.token.here"}
    response = await client.post("/api/v1/auth/refresh", json=refresh_payload)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert "code" in data
    assert "message" in data


@pytest.mark.asyncio
async def test_refresh_token_missing(client: AsyncClient):
    """Test refresh fails when token is missing."""
    response = await client.post("/api/v1/auth/refresh", json={})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = response.json()
    assert "code" in data
    assert data["code"] == "VALIDATION_ERROR"
