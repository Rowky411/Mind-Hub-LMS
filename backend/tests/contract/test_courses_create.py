"""
Contract test for POST /api/v1/courses endpoint.

Tests API contract compliance for course creation endpoint.
Validates request/response structure, status codes, and error handling.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User


@pytest.mark.asyncio
class TestCreateCourseContract:
    """Contract tests for POST /api/v1/courses endpoint."""

    async def test_create_course_success(
        self,
        client: AsyncClient,
        test_instructor: User,
        auth_headers_instructor: dict,
        sample_course_data: dict
    ):
        """
        Test successful course creation returns 201 and correct response structure.

        Expected response:
        - Status: 201 Created
        - Body: Course object with all required fields
        """
        response = await client.post(
            "/api/v1/courses",
            json=sample_course_data,
            headers=auth_headers_instructor
        )

        # Assert status code
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"

        # Assert response structure
        data = response.json()
        assert "id" in data
        assert "title" in data
        assert "description" in data
        assert "category" in data
        assert "visibility" in data
        assert "enrollment_capacity" in data
        assert "instructor_id" in data
        assert "created_at" in data
        assert "updated_at" in data

        # Assert response values match request
        assert data["title"] == sample_course_data["title"]
        assert data["description"] == sample_course_data["description"]
        assert data["category"] == sample_course_data["category"]
        assert data["visibility"] == sample_course_data["visibility"]
        assert data["enrollment_capacity"] == sample_course_data["enrollment_capacity"]
        assert data["instructor_id"] == str(test_instructor.id)

    async def test_create_course_requires_authentication(
        self,
        client: AsyncClient,
        sample_course_data: dict
    ):
        """
        Test course creation without authentication returns 401.

        Expected response:
        - Status: 401 Unauthorized
        """
        response = await client.post(
            "/api/v1/courses",
            json=sample_course_data
        )

        assert response.status_code == 401

    async def test_create_course_requires_instructor_role(
        self,
        client: AsyncClient,
        test_user: User,
        auth_headers_student: dict,
        sample_course_data: dict
    ):
        """
        Test course creation with student role returns 403.

        Expected response:
        - Status: 403 Forbidden
        """
        response = await client.post(
            "/api/v1/courses",
            json=sample_course_data,
            headers=auth_headers_student
        )

        assert response.status_code == 403

    async def test_create_course_validates_required_fields(
        self,
        client: AsyncClient,
        test_instructor: User,
        auth_headers_instructor: dict
    ):
        """
        Test course creation without required fields returns 422.

        Expected response:
        - Status: 422 Unprocessable Entity
        - Body: Validation error details
        """
        # Missing required fields
        invalid_data = {
            "title": "Test Course"
            # Missing description, category, visibility
        }

        response = await client.post(
            "/api/v1/courses",
            json=invalid_data,
            headers=auth_headers_instructor
        )

        assert response.status_code == 422

        # Check error response structure
        data = response.json()
        assert "detail" in data

    async def test_create_course_validates_visibility_enum(
        self,
        client: AsyncClient,
        test_instructor: User,
        auth_headers_instructor: dict,
        sample_course_data: dict
    ):
        """
        Test course creation with invalid visibility value returns 422.

        Expected response:
        - Status: 422 Unprocessable Entity
        """
        invalid_data = sample_course_data.copy()
        invalid_data["visibility"] = "invalid_visibility"

        response = await client.post(
            "/api/v1/courses",
            json=invalid_data,
            headers=auth_headers_instructor
        )

        assert response.status_code == 422

    async def test_create_course_with_null_enrollment_capacity(
        self,
        client: AsyncClient,
        test_instructor: User,
        auth_headers_instructor: dict,
        sample_course_data: dict
    ):
        """
        Test course creation with null enrollment_capacity (unlimited) succeeds.

        Expected response:
        - Status: 201 Created
        - enrollment_capacity: null
        """
        data_with_null_capacity = sample_course_data.copy()
        data_with_null_capacity["enrollment_capacity"] = None

        response = await client.post(
            "/api/v1/courses",
            json=data_with_null_capacity,
            headers=auth_headers_instructor
        )

        assert response.status_code == 201

        data = response.json()
        assert data["enrollment_capacity"] is None

    async def test_create_course_validates_positive_capacity(
        self,
        client: AsyncClient,
        test_instructor: User,
        auth_headers_instructor: dict,
        sample_course_data: dict
    ):
        """
        Test course creation with negative capacity returns 422.

        Expected response:
        - Status: 422 Unprocessable Entity
        """
        invalid_data = sample_course_data.copy()
        invalid_data["enrollment_capacity"] = -1

        response = await client.post(
            "/api/v1/courses",
            json=invalid_data,
            headers=auth_headers_instructor
        )

        assert response.status_code == 422

    async def test_create_course_defaults_to_draft(
        self,
        client: AsyncClient,
        test_instructor: User,
        auth_headers_instructor: dict
    ):
        """
        Test course creation without visibility defaults to draft.

        Expected response:
        - Status: 201 Created
        - visibility: "draft"
        """
        minimal_data = {
            "title": "Test Course",
            "description": "Test Description",
            "category": "Test Category"
        }

        response = await client.post(
            "/api/v1/courses",
            json=minimal_data,
            headers=auth_headers_instructor
        )

        assert response.status_code == 201

        data = response.json()
        assert data["visibility"] == "draft"

    async def test_create_course_response_includes_timestamps(
        self,
        client: AsyncClient,
        test_instructor: User,
        auth_headers_instructor: dict,
        sample_course_data: dict
    ):
        """
        Test course creation response includes timestamp fields.

        Expected response:
        - created_at: ISO 8601 timestamp
        - updated_at: ISO 8601 timestamp
        """
        response = await client.post(
            "/api/v1/courses",
            json=sample_course_data,
            headers=auth_headers_instructor
        )

        assert response.status_code == 201

        data = response.json()
        assert "created_at" in data
        assert "updated_at" in data

        # Validate timestamp format (basic check)
        from datetime import datetime
        datetime.fromisoformat(data["created_at"].replace('Z', '+00:00'))
        datetime.fromisoformat(data["updated_at"].replace('Z', '+00:00'))
