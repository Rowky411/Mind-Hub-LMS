"""
Pytest configuration and fixtures for Mind Hub Backend tests.
"""
import asyncio
import os
from typing import AsyncGenerator, Generator
import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from src.main import app
from src.core.database import Base, get_session
from src.models.user import User
from src.core.security import hash_password


# Test database URL (use in-memory SQLite for fast tests or separate test DB)
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://mindhub:mindhub_dev_password@localhost:5432/mindhub_test_db"
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Test engine with separate database
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a test database session.

    Creates tables before each test and drops them after.
    """
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async with TestSessionLocal() as session:
        yield session

    # Drop all tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create HTTP client for API testing.

    Overrides the default database session dependency.
    """
    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def sample_user_data():
    """Sample user data for tests."""
    return {
        "email": "test@example.com",
        "password": "SecurePass123!",
        "role": "student",
        "first_name": "Test",
        "last_name": "User"
    }


@pytest.fixture
def sample_instructor_data():
    """Sample instructor user data for tests."""
    return {
        "email": "instructor@example.com",
        "password": "InstructorPass123!",
        "role": "instructor",
        "first_name": "John",
        "last_name": "Instructor"
    }


@pytest.fixture
def sample_course_data():
    """Sample course data for tests."""
    return {
        "title": "Introduction to Python Programming",
        "description": "Learn Python from scratch",
        "category": "Programming",
        "visibility": "public",
        "enrollment_capacity": 100
    }


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession, sample_user_data: dict) -> User:
    """Create a test user in the database."""
    user = User(
        id=str(uuid.uuid4()),
        email=sample_user_data["email"],
        password_hash=hash_password(sample_user_data["password"]),
        role=sample_user_data["role"],
        first_name=sample_user_data["first_name"],
        last_name=sample_user_data["last_name"],
        is_active=True,
        email_verified=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_instructor(db_session: AsyncSession, sample_instructor_data: dict) -> User:
    """Create a test instructor in the database."""
    instructor = User(
        id=str(uuid.uuid4()),
        email=sample_instructor_data["email"],
        password_hash=hash_password(sample_instructor_data["password"]),
        role=sample_instructor_data["role"],
        first_name=sample_instructor_data["first_name"],
        last_name=sample_instructor_data["last_name"],
        is_active=True,
        email_verified=True
    )
    db_session.add(instructor)
    await db_session.commit()
    await db_session.refresh(instructor)
    return instructor


@pytest_asyncio.fixture
async def auth_headers_student(client: AsyncClient, sample_user_data: dict) -> dict:
    """Get authentication headers for a student user."""
    # Login to get token
    response = await client.post("/api/v1/auth/login", json={
        "email": sample_user_data["email"],
        "password": sample_user_data["password"]
    })
    data = response.json()
    return {"Authorization": f"Bearer {data['access_token']}"}


@pytest_asyncio.fixture
async def auth_headers_instructor(client: AsyncClient, sample_instructor_data: dict) -> dict:
    """Get authentication headers for an instructor user."""
    # Login to get token
    response = await client.post("/api/v1/auth/login", json={
        "email": sample_instructor_data["email"],
        "password": sample_instructor_data["password"]
    })
    data = response.json()
    return {"Authorization": f"Bearer {data['access_token']}"}
