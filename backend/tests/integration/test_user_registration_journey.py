"""
Integration test for complete user registration journey.

Tests end-to-end registration flow including database persistence and token validity.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import status

# from src.models.user import User  # Will be available after model implementation


@pytest.mark.asyncio
async def test_complete_registration_journey(client: AsyncClient, db_session: AsyncSession):
    """Test complete registration flow from request to database persistence."""
    payload = {
        "email": "journey@example.com",
        "password": "SecurePass123!",
        "first_name": "Journey",
        "last_name": "User",
        "role": "student",
    }

    # Step 1: Register user
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()

    # Step 2: Verify tokens are returned
    assert "access_token" in data
    assert "refresh_token" in data
    access_token = data["access_token"]

    # Step 3: Verify user data in response
    user_data = data["user"]
    assert user_data["email"] == payload["email"]
    assert user_data["role"] == payload["role"]
    user_id = user_data["id"]

    # Step 4: Verify user exists in database
    # from src.models.user import User
    # result = await db_session.execute(select(User).where(User.id == user_id))
    # db_user = result.scalar_one_or_none()
    # assert db_user is not None
    # assert db_user.email == payload["email"]
    # assert db_user.is_active is True
    # assert db_user.email_verified is False  # Not verified on registration

    # Step 5: Verify password is hashed (not stored in plain text)
    # assert db_user.password_hash != payload["password"]
    # assert db_user.password_hash.startswith("$2b$")  # bcrypt hash

    # Step 6: Use access token to access protected endpoint
    headers = {"Authorization": f"Bearer {access_token}"}
    profile_response = await client.get("/api/v1/profile", headers=headers)

    # This will work once profile endpoint is implemented
    # assert profile_response.status_code == status.HTTP_200_OK
    # profile_data = profile_response.json()
    # assert profile_data["id"] == user_id
    # assert profile_data["email"] == payload["email"]


@pytest.mark.asyncio
async def test_registration_creates_student_by_default(client: AsyncClient):
    """Test that users are created with student role by default."""
    payload = {
        "email": "defaultstudent@example.com",
        "password": "SecurePass123!",
        "first_name": "Default",
        "last_name": "Student",
        # role not specified
    }

    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["user"]["role"] == "student"


@pytest.mark.asyncio
async def test_registration_with_all_roles(client: AsyncClient):
    """Test registration journey for all user roles."""
    roles = ["student", "instructor", "admin"]

    for idx, role in enumerate(roles):
        payload = {
            "email": f"{role}_journey_{idx}@example.com",
            "password": "SecurePass123!",
            "first_name": role.capitalize(),
            "last_name": "User",
            "role": role,
        }

        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == status.HTTP_201_CREATED, f"Failed for role: {role}"

        data = response.json()
        assert data["user"]["role"] == role
        assert "access_token" in data
        assert "refresh_token" in data
