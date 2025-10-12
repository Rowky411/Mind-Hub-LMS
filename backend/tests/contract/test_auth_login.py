"""
Contract test for POST /api/v1/auth/login endpoint.

Tests the API contract for user login including authentication, token generation,
and error handling per Constitution Principle VI.
"""
import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login with valid credentials."""
    # First register a user
    register_payload = {
        "email": "logintest@example.com",
        "password": "SecurePass123!",
        "first_name": "Login",
        "last_name": "Test",
        "role": "student",
    }
    await client.post("/api/v1/auth/register", json=register_payload)

    # Now login
    login_payload = {
        "email": "logintest@example.com",
        "password": "SecurePass123!",
    }

    response = await client.post("/api/v1/auth/login", json=login_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Verify response structure
    assert "access_token" in data
    assert "refresh_token" in data
    assert "user" in data

    # Verify user data
    user = data["user"]
    assert user["email"] == login_payload["email"]
    assert "password" not in user
    assert "password_hash" not in user


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login fails with incorrect password."""
    # Register a user
    register_payload = {
        "email": "wrongpass@example.com",
        "password": "CorrectPass123!",
        "first_name": "Test",
        "last_name": "User",
    }
    await client.post("/api/v1/auth/register", json=register_payload)

    # Attempt login with wrong password
    login_payload = {
        "email": "wrongpass@example.com",
        "password": "WrongPassword123!",
    }

    response = await client.post("/api/v1/auth/login", json=login_payload)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert "code" in data
    assert "message" in data


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login fails for user that doesn't exist."""
    login_payload = {
        "email": "nonexistent@example.com",
        "password": "SomePass123!",
    }

    response = await client.post("/api/v1/auth/login", json=login_payload)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert "code" in data
    assert "message" in data


@pytest.mark.asyncio
async def test_login_missing_credentials(client: AsyncClient):
    """Test login fails when credentials are missing."""
    # Missing password
    response = await client.post("/api/v1/auth/login", json={"email": "test@example.com"})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Missing email
    response = await client.post("/api/v1/auth/login", json={"password": "Pass123!"})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_login_returns_fresh_tokens(client: AsyncClient):
    """Test that each login generates new tokens."""
    # Register user
    register_payload = {
        "email": "freshtoken@example.com",
        "password": "SecurePass123!",
        "first_name": "Fresh",
        "last_name": "Token",
    }
    await client.post("/api/v1/auth/register", json=register_payload)

    login_payload = {
        "email": "freshtoken@example.com",
        "password": "SecurePass123!",
    }

    # First login
    response1 = await client.post("/api/v1/auth/login", json=login_payload)
    data1 = response1.json()

    # Second login
    response2 = await client.post("/api/v1/auth/login", json=login_payload)
    data2 = response2.json()

    # Tokens should be different
    assert data1["access_token"] != data2["access_token"]
    assert data1["refresh_token"] != data2["refresh_token"]
