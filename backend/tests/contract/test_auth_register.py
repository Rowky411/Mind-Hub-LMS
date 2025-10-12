"""
Contract test for POST /api/v1/auth/register endpoint.

Tests the API contract for user registration including request/response structure,
validation, and error handling per Constitution Principle VI (test coverage for critical paths).
"""
import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Test successful user registration with valid data."""
    payload = {
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "first_name": "New",
        "last_name": "User",
        "role": "student",
    }

    response = await client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()

    # Verify response structure
    assert "access_token" in data
    assert "refresh_token" in data
    assert "user" in data

    # Verify user data
    user = data["user"]
    assert user["email"] == payload["email"]
    assert user["first_name"] == payload["first_name"]
    assert user["last_name"] == payload["last_name"]
    assert user["role"] == payload["role"]
    assert "id" in user
    assert "password" not in user  # Password should not be in response
    assert "password_hash" not in user


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test registration fails with duplicate email."""
    payload = {
        "email": "duplicate@example.com",
        "password": "SecurePass123!",
        "first_name": "First",
        "last_name": "User",
        "role": "student",
    }

    # Register first user
    await client.post("/api/v1/auth/register", json=payload)

    # Attempt to register with same email
    response = await client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "code" in data
    assert "message" in data
    assert "email" in data["message"].lower() or "already exists" in data["message"].lower()


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient):
    """Test registration fails with invalid email format."""
    payload = {
        "email": "invalid-email",
        "password": "SecurePass123!",
        "first_name": "Test",
        "last_name": "User",
        "role": "student",
    }

    response = await client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = response.json()
    assert "code" in data
    assert data["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    """Test registration fails with weak password (missing complexity requirements)."""
    payload = {
        "email": "weakpass@example.com",
        "password": "weak",  # Too short, missing uppercase, digit, special char
        "first_name": "Test",
        "last_name": "User",
        "role": "student",
    }

    response = await client.post("/api/v1/auth/register", json=payload)

    assert response.status_code in [
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_422_UNPROCESSABLE_ENTITY,
    ]
    data = response.json()
    assert "password" in data["message"].lower() or "password" in str(data.get("details", "")).lower()


@pytest.mark.asyncio
async def test_register_missing_required_fields(client: AsyncClient):
    """Test registration fails when required fields are missing."""
    payload = {
        "email": "incomplete@example.com",
        # Missing password, first_name, last_name
    }

    response = await client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = response.json()
    assert "code" in data
    assert data["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_register_invalid_role(client: AsyncClient):
    """Test registration fails with invalid role value."""
    payload = {
        "email": "invalidrole@example.com",
        "password": "SecurePass123!",
        "first_name": "Test",
        "last_name": "User",
        "role": "superadmin",  # Invalid role
    }

    response = await client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = response.json()
    assert "code" in data
    assert data["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_register_default_role_is_student(client: AsyncClient):
    """Test that role defaults to 'student' when not provided."""
    payload = {
        "email": "defaultrole@example.com",
        "password": "SecurePass123!",
        "first_name": "Test",
        "last_name": "User",
        # role not provided
    }

    response = await client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["user"]["role"] == "student"


@pytest.mark.asyncio
async def test_register_all_roles(client: AsyncClient):
    """Test registration succeeds for all valid roles."""
    roles = ["student", "instructor", "admin"]

    for idx, role in enumerate(roles):
        payload = {
            "email": f"{role}{idx}@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": role.capitalize(),
            "role": role,
        }

        response = await client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == status.HTTP_201_CREATED, f"Failed for role: {role}"
        data = response.json()
        assert data["user"]["role"] == role


@pytest.mark.asyncio
async def test_register_response_includes_tokens(client: AsyncClient):
    """Test that registration response includes both access and refresh tokens."""
    payload = {
        "email": "tokens@example.com",
        "password": "SecurePass123!",
        "first_name": "Token",
        "last_name": "User",
        "role": "student",
    }

    response = await client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()

    # Verify tokens are present and non-empty
    assert isinstance(data["access_token"], str)
    assert len(data["access_token"]) > 0
    assert isinstance(data["refresh_token"], str)
    assert len(data["refresh_token"]) > 0
    assert data["access_token"] != data["refresh_token"]
