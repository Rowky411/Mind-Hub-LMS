"""
Contract tests for POST /api/v1/enrollments endpoint

Tests API contract compliance for enrollment creation:
- Request/response schema validation
- HTTP status codes
- Authentication requirements
- Business rule validation (capacity, duplicate enrollment)
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.course import Course
from backend.src.models.user import User, UserRole


@pytest.mark.asyncio
class TestEnrollmentCreateContract:
    """Contract tests for enrollment creation endpoint"""

    async def test_create_enrollment_success(
        self,
        async_client: AsyncClient,
        test_student: User,
        test_course: Course,
        student_auth_headers: dict,
    ):
        """
        GIVEN: Authenticated student and available course
        WHEN: POST /api/v1/enrollments with valid course_id
        THEN: Returns 201 with enrollment object matching schema
        """
        payload = {"course_id": str(test_course.id)}

        response = await async_client.post(
            "/api/v1/enrollments",
            json=payload,
            headers=student_auth_headers,
        )

        assert response.status_code == 201
        data = response.json()

        # Validate response schema
        assert "id" in data
        assert "student_id" in data
        assert "course_id" in data
        assert "enrollment_date" in data
        assert "completion_percentage" in data
        assert "is_completed" in data
        assert "is_active" in data

        # Validate data types and values
        assert data["student_id"] == str(test_student.id)
        assert data["course_id"] == str(test_course.id)
        assert data["completion_percentage"] == 0
        assert data["is_completed"] is False
        assert data["is_active"] is True

    async def test_create_enrollment_unauthenticated(
        self,
        async_client: AsyncClient,
        test_course: Course,
    ):
        """
        GIVEN: No authentication token
        WHEN: POST /api/v1/enrollments
        THEN: Returns 401 Unauthorized
        """
        payload = {"course_id": str(test_course.id)}

        response = await async_client.post(
            "/api/v1/enrollments",
            json=payload,
        )

        assert response.status_code == 401

    async def test_create_enrollment_missing_course_id(
        self,
        async_client: AsyncClient,
        student_auth_headers: dict,
    ):
        """
        GIVEN: Authenticated student
        WHEN: POST /api/v1/enrollments without course_id
        THEN: Returns 422 Unprocessable Entity
        """
        payload = {}

        response = await async_client.post(
            "/api/v1/enrollments",
            json=payload,
            headers=student_auth_headers,
        )

        assert response.status_code == 422

    async def test_create_enrollment_invalid_course_id(
        self,
        async_client: AsyncClient,
        student_auth_headers: dict,
    ):
        """
        GIVEN: Authenticated student
        WHEN: POST /api/v1/enrollments with non-existent course_id
        THEN: Returns 404 Not Found
        """
        payload = {"course_id": "00000000-0000-0000-0000-000000000000"}

        response = await async_client.post(
            "/api/v1/enrollments",
            json=payload,
            headers=student_auth_headers,
        )

        assert response.status_code == 404

    async def test_create_enrollment_duplicate(
        self,
        async_client: AsyncClient,
        test_student: User,
        test_course: Course,
        student_auth_headers: dict,
    ):
        """
        GIVEN: Student already enrolled in course
        WHEN: POST /api/v1/enrollments again with same course_id
        THEN: Returns 409 Conflict
        """
        # First enrollment
        payload = {"course_id": str(test_course.id)}
        await async_client.post(
            "/api/v1/enrollments",
            json=payload,
            headers=student_auth_headers,
        )

        # Duplicate enrollment attempt
        response = await async_client.post(
            "/api/v1/enrollments",
            json=payload,
            headers=student_auth_headers,
        )

        assert response.status_code == 409
        assert "already enrolled" in response.json()["detail"].lower()

    async def test_create_enrollment_course_full(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_course: Course,
        student_auth_headers: dict,
    ):
        """
        GIVEN: Course at enrollment capacity
        WHEN: POST /api/v1/enrollments
        THEN: Returns 400 Bad Request
        """
        # Set course capacity to 0
        test_course.enrollment_capacity = 0
        await db_session.commit()

        payload = {"course_id": str(test_course.id)}

        response = await async_client.post(
            "/api/v1/enrollments",
            json=payload,
            headers=student_auth_headers,
        )

        assert response.status_code == 400
        assert "capacity" in response.json()["detail"].lower()

    async def test_create_enrollment_non_student_role(
        self,
        async_client: AsyncClient,
        test_instructor: User,
        test_course: Course,
        instructor_auth_headers: dict,
    ):
        """
        GIVEN: Authenticated user with instructor role
        WHEN: POST /api/v1/enrollments
        THEN: Returns 403 Forbidden (students only)
        """
        payload = {"course_id": str(test_course.id)}

        response = await async_client.post(
            "/api/v1/enrollments",
            json=payload,
            headers=instructor_auth_headers,
        )

        assert response.status_code == 403

    async def test_create_enrollment_draft_course(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_course: Course,
        student_auth_headers: dict,
    ):
        """
        GIVEN: Course with visibility = DRAFT
        WHEN: POST /api/v1/enrollments
        THEN: Returns 400 Bad Request (only published courses)
        """
        # Set course to draft
        test_course.visibility = "DRAFT"
        await db_session.commit()

        payload = {"course_id": str(test_course.id)}

        response = await async_client.post(
            "/api/v1/enrollments",
            json=payload,
            headers=student_auth_headers,
        )

        assert response.status_code == 400
        assert "published" in response.json()["detail"].lower()
