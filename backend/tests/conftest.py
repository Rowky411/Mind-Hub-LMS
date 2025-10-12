"""
Pytest configuration and fixtures for Mind Hub Backend tests.
"""
import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# TODO: Import FastAPI app and database dependencies when implemented
# from src.main import app
# from src.core.database import Base, get_session


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# @pytest_asyncio.fixture(scope="function")
# async def db_session() -> AsyncGenerator[AsyncSession, None]:
#     """
#     Create a test database session.
#     Uses in-memory SQLite for fast tests.
#     """
#     # TODO: Implement database session fixture
#     pass


# @pytest_asyncio.fixture(scope="function")
# async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
#     """
#     Create HTTP client for API testing.
#     """
#     # TODO: Implement test client fixture
#     pass


# @pytest.fixture
# def sample_user_data():
#     """Sample user data for tests."""
#     return {
#         "email": "test@example.com",
#         "password": "SecurePass123!",
#         "role": "student",
#         "first_name": "Test",
#         "last_name": "User"
#     }
