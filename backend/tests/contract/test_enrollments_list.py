"""
Contract tests for GET /api/v1/enrollments/my-courses endpoint

Tests API contract compliance for retrieving student's enrollments:
- Request/response schema validation
- HTTP status codes
- Authentication requirements
- Filtering and data inclusion
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.course import Course
from backend.src.models.enrollment import Enrollment
from backend.src.models.user import User


@pytest.mark.asyncio
class TestEnrollmentsListContract:
    """Contract tests for my courses list endpoint"""

    async def test_get_my_courses_success(
        self,
        async_client: AsyncClient,
        test_student: User,
        test_course: Course,
        student_auth_headers: dict,
        db_session: AsyncSession,
    ):
        """
        GIVEN: Student with one active enrollment
        WHEN: GET /api/v1/enrollments/my-courses
        THEN: Returns 200 with array of enrollments including course details
        """
        # Create enrollment
        enrollment = Enrollment(
            student_id=test_student.id,
            course_id=test_course.id,
            completion_percentage=25,
            is_completed=False,
            is_active=True,
        )
        db_session.add(enrollment)
        await db_session.commit()

        response = await async_client.get(
            "/api/v1/enrollments/my-courses",
            headers=student_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        # Validate response is array
        assert isinstance(data, list)
        assert len(data) == 1

        # Validate enrollment schema
        enrollment_data = data[0]
        assert "id" in enrollment_data
        assert "student_id" in enrollment_data
        assert "course_id" in enrollment_data
        assert "enrollment_date" in enrollment_data
        assert "completion_percentage" in enrollment_data
        assert "is_completed" in enrollment_data
        assert "is_active" in enrollment_data

        # Validate course details are included
        assert "course" in enrollment_data
        course_data = enrollment_data["course"]
        assert "id" in course_data
        assert "title" in course_data
        assert "description" in course_data
        assert "instructor_id" in course_data
        assert "category" in course_data
        assert "thumbnail_url" in course_data

        # Validate values
        assert enrollment_data["student_id"] == str(test_student.id)
        assert enrollment_data["course_id"] == str(test_course.id)
        assert enrollment_data["completion_percentage"] == 25
        assert course_data["id"] == str(test_course.id)
        assert course_data["title"] == test_course.title

    async def test_get_my_courses_empty_list(
        self,
        async_client: AsyncClient,
        student_auth_headers: dict,
    ):
        """
        GIVEN: Student with no enrollments
        WHEN: GET /api/v1/enrollments/my-courses
        THEN: Returns 200 with empty array
        """
        response = await async_client.get(
            "/api/v1/enrollments/my-courses",
            headers=student_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    async def test_get_my_courses_multiple_enrollments(
        self,
        async_client: AsyncClient,
        test_student: User,
        db_session: AsyncSession,
        student_auth_headers: dict,
    ):
        """
        GIVEN: Student with multiple enrollments
        WHEN: GET /api/v1/enrollments/my-courses
        THEN: Returns all enrollments with correct count
        """
        # Create two courses and enrollments
        from backend.src.models.course import Course

        course1 = Course(
            instructor_id=test_student.id,
            title="Course 1",
            description="Description 1",
            category="TECHNOLOGY",
            visibility="PUBLISHED",
        )
        course2 = Course(
            instructor_id=test_student.id,
            title="Course 2",
            description="Description 2",
            category="BUSINESS",
            visibility="PUBLISHED",
        )
        db_session.add(course1)
        db_session.add(course2)
        await db_session.commit()

        enrollment1 = Enrollment(
            student_id=test_student.id,
            course_id=course1.id,
            completion_percentage=50,
            is_completed=False,
            is_active=True,
        )
        enrollment2 = Enrollment(
            student_id=test_student.id,
            course_id=course2.id,
            completion_percentage=100,
            is_completed=True,
            is_active=True,
        )
        db_session.add(enrollment1)
        db_session.add(enrollment2)
        await db_session.commit()

        response = await async_client.get(
            "/api/v1/enrollments/my-courses",
            headers=student_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # Verify both courses are present
        course_ids = {item["course"]["id"] for item in data}
        assert str(course1.id) in course_ids
        assert str(course2.id) in course_ids

    async def test_get_my_courses_unauthenticated(
        self,
        async_client: AsyncClient,
    ):
        """
        GIVEN: No authentication token
        WHEN: GET /api/v1/enrollments/my-courses
        THEN: Returns 401 Unauthorized
        """
        response = await async_client.get("/api/v1/enrollments/my-courses")

        assert response.status_code == 401

    async def test_get_my_courses_excludes_inactive_enrollments(
        self,
        async_client: AsyncClient,
        test_student: User,
        test_course: Course,
        student_auth_headers: dict,
        db_session: AsyncSession,
    ):
        """
        GIVEN: Student with both active and inactive enrollments
        WHEN: GET /api/v1/enrollments/my-courses
        THEN: Returns only active enrollments (is_active=True)
        """
        # Create active enrollment
        enrollment_active = Enrollment(
            student_id=test_student.id,
            course_id=test_course.id,
            completion_percentage=50,
            is_completed=False,
            is_active=True,
        )
        db_session.add(enrollment_active)

        # Create another course for inactive enrollment
        from backend.src.models.course import Course

        course2 = Course(
            instructor_id=test_student.id,
            title="Course 2",
            description="Description 2",
            category="TECHNOLOGY",
            visibility="PUBLISHED",
        )
        db_session.add(course2)
        await db_session.commit()

        # Create inactive enrollment (unenrolled)
        enrollment_inactive = Enrollment(
            student_id=test_student.id,
            course_id=course2.id,
            completion_percentage=10,
            is_completed=False,
            is_active=False,
        )
        db_session.add(enrollment_inactive)
        await db_session.commit()

        response = await async_client.get(
            "/api/v1/enrollments/my-courses",
            headers=student_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        # Should only return the active enrollment
        assert len(data) == 1
        assert data[0]["course_id"] == str(test_course.id)
        assert data[0]["is_active"] is True

    async def test_get_my_courses_only_returns_own_enrollments(
        self,
        async_client: AsyncClient,
        test_student: User,
        test_course: Course,
        student_auth_headers: dict,
        db_session: AsyncSession,
    ):
        """
        GIVEN: Multiple students with enrollments
        WHEN: GET /api/v1/enrollments/my-courses
        THEN: Returns only authenticated user's enrollments
        """
        # Create enrollment for test_student
        enrollment1 = Enrollment(
            student_id=test_student.id,
            course_id=test_course.id,
            completion_percentage=50,
            is_completed=False,
            is_active=True,
        )
        db_session.add(enrollment1)

        # Create another student and their enrollment
        from backend.src.models.user import User, UserRole

        other_student = User(
            email="other@example.com",
            password_hash="hashed",
            role=UserRole.STUDENT,
            first_name="Other",
            last_name="Student",
        )
        db_session.add(other_student)
        await db_session.commit()

        enrollment2 = Enrollment(
            student_id=other_student.id,
            course_id=test_course.id,
            completion_percentage=75,
            is_completed=False,
            is_active=True,
        )
        db_session.add(enrollment2)
        await db_session.commit()

        response = await async_client.get(
            "/api/v1/enrollments/my-courses",
            headers=student_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        # Should only return test_student's enrollment
        assert len(data) == 1
        assert data[0]["student_id"] == str(test_student.id)
