"""
Integration test for content access control based on enrollment

Tests that:
- Enrolled students can access course content
- Non-enrolled students cannot access content (403 Forbidden)
- Instructors can access their own course content
- Content access is properly enforced across different scenarios
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.content_item import ContentItem
from backend.src.models.course import Course
from backend.src.models.enrollment import Enrollment
from backend.src.models.module import Module
from backend.src.models.user import User, UserRole


@pytest.mark.asyncio
class TestContentAccessControl:
    """Integration tests for enrollment-based content access control"""

    async def test_enrolled_student_can_access_content(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        GIVEN: Student enrolled in course with content
        WHEN: Student requests content item
        THEN: Returns 200 with content details
        """
        from backend.src.core.security import get_password_hash

        # Create instructor, student, and course
        instructor = User(
            email="instructor@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.INSTRUCTOR,
            first_name="Instructor",
            last_name="Test",
            email_verified=True,
            is_active=True,
        )
        student = User(
            email="student@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.STUDENT,
            first_name="Student",
            last_name="Test",
            email_verified=True,
            is_active=True,
        )
        db_session.add(instructor)
        db_session.add(student)
        await db_session.commit()

        course = Course(
            instructor_id=instructor.id,
            title="Test Course",
            description="Test Description",
            category="TECHNOLOGY",
            visibility="PUBLISHED",
            enrollment_capacity=50,
        )
        db_session.add(course)
        await db_session.commit()

        # Create module and content item
        module = Module(
            course_id=course.id,
            title="Module 1",
            description="First Module",
            order_index=1,
        )
        db_session.add(module)
        await db_session.commit()

        content_item = ContentItem(
            course_id=course.id,
            module_id=module.id,
            title="Lesson 1",
            description="First Lesson",
            content_type="VIDEO",
            file_url="/storage/videos/lesson1.mp4",
            file_size=1024000,
            mime_type="video/mp4",
            duration_seconds=300,
            order_index=1,
            is_required=True,
        )
        db_session.add(content_item)
        await db_session.commit()

        # Enroll student in course
        enrollment = Enrollment(
            student_id=student.id,
            course_id=course.id,
            completion_percentage=0,
            is_completed=False,
            is_active=True,
        )
        db_session.add(enrollment)
        await db_session.commit()

        # Login as student
        login = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "student@test.com", "password": "password123"},
        )
        student_token = login.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # Access content
        response = await async_client.get(
            f"/api/v1/content/{content_item.id}",
            headers=student_headers,
        )

        assert response.status_code == 200
        content_data = response.json()
        assert content_data["id"] == str(content_item.id)
        assert content_data["title"] == "Lesson 1"

    async def test_non_enrolled_student_cannot_access_content(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        GIVEN: Student NOT enrolled in course
        WHEN: Student attempts to access content from that course
        THEN: Returns 403 Forbidden
        """
        from backend.src.core.security import get_password_hash

        # Create instructor, student, and course
        instructor = User(
            email="instructor@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.INSTRUCTOR,
            first_name="Instructor",
            last_name="Test",
            email_verified=True,
            is_active=True,
        )
        student = User(
            email="student@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.STUDENT,
            first_name="Student",
            last_name="Test",
            email_verified=True,
            is_active=True,
        )
        db_session.add(instructor)
        db_session.add(student)
        await db_session.commit()

        course = Course(
            instructor_id=instructor.id,
            title="Test Course",
            description="Test Description",
            category="TECHNOLOGY",
            visibility="PUBLISHED",
            enrollment_capacity=50,
        )
        db_session.add(course)
        await db_session.commit()

        # Create module and content item
        module = Module(
            course_id=course.id,
            title="Module 1",
            description="First Module",
            order_index=1,
        )
        db_session.add(module)
        await db_session.commit()

        content_item = ContentItem(
            course_id=course.id,
            module_id=module.id,
            title="Lesson 1",
            description="First Lesson",
            content_type="VIDEO",
            file_url="/storage/videos/lesson1.mp4",
            file_size=1024000,
            mime_type="video/mp4",
            duration_seconds=300,
            order_index=1,
            is_required=True,
        )
        db_session.add(content_item)
        await db_session.commit()

        # Student is NOT enrolled

        # Login as student
        login = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "student@test.com", "password": "password123"},
        )
        student_token = login.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # Attempt to access content should fail
        response = await async_client.get(
            f"/api/v1/content/{content_item.id}",
            headers=student_headers,
        )

        assert response.status_code == 403
        assert "not enrolled" in response.json()["detail"].lower()

    async def test_instructor_can_access_own_course_content(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        GIVEN: Instructor who owns the course
        WHEN: Instructor accesses content from their course
        THEN: Returns 200 (no enrollment required for course owner)
        """
        from backend.src.core.security import get_password_hash

        # Create instructor
        instructor = User(
            email="instructor@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.INSTRUCTOR,
            first_name="Instructor",
            last_name="Test",
            email_verified=True,
            is_active=True,
        )
        db_session.add(instructor)
        await db_session.commit()

        course = Course(
            instructor_id=instructor.id,
            title="Test Course",
            description="Test Description",
            category="TECHNOLOGY",
            visibility="PUBLISHED",
            enrollment_capacity=50,
        )
        db_session.add(course)
        await db_session.commit()

        # Create module and content item
        module = Module(
            course_id=course.id,
            title="Module 1",
            description="First Module",
            order_index=1,
        )
        db_session.add(module)
        await db_session.commit()

        content_item = ContentItem(
            course_id=course.id,
            module_id=module.id,
            title="Lesson 1",
            description="First Lesson",
            content_type="VIDEO",
            file_url="/storage/videos/lesson1.mp4",
            file_size=1024000,
            mime_type="video/mp4",
            duration_seconds=300,
            order_index=1,
            is_required=True,
        )
        db_session.add(content_item)
        await db_session.commit()

        # Login as instructor (course owner)
        login = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "instructor@test.com", "password": "password123"},
        )
        instructor_token = login.json()["access_token"]
        instructor_headers = {"Authorization": f"Bearer {instructor_token}"}

        # Instructor should be able to access their own course content
        response = await async_client.get(
            f"/api/v1/content/{content_item.id}",
            headers=instructor_headers,
        )

        assert response.status_code == 200
        content_data = response.json()
        assert content_data["id"] == str(content_item.id)

    async def test_unenrolled_student_loses_access(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        GIVEN: Student previously enrolled, then unenrolls
        WHEN: Student attempts to access content after unenrollment
        THEN: Returns 403 Forbidden
        """
        from backend.src.core.security import get_password_hash

        # Create instructor, student, and course
        instructor = User(
            email="instructor@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.INSTRUCTOR,
            first_name="Instructor",
            last_name="Test",
            email_verified=True,
            is_active=True,
        )
        student = User(
            email="student@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.STUDENT,
            first_name="Student",
            last_name="Test",
            email_verified=True,
            is_active=True,
        )
        db_session.add(instructor)
        db_session.add(student)
        await db_session.commit()

        course = Course(
            instructor_id=instructor.id,
            title="Test Course",
            description="Test Description",
            category="TECHNOLOGY",
            visibility="PUBLISHED",
            enrollment_capacity=50,
        )
        db_session.add(course)
        await db_session.commit()

        # Create module and content item
        module = Module(
            course_id=course.id,
            title="Module 1",
            description="First Module",
            order_index=1,
        )
        db_session.add(module)
        await db_session.commit()

        content_item = ContentItem(
            course_id=course.id,
            module_id=module.id,
            title="Lesson 1",
            description="First Lesson",
            content_type="VIDEO",
            file_url="/storage/videos/lesson1.mp4",
            file_size=1024000,
            mime_type="video/mp4",
            duration_seconds=300,
            order_index=1,
            is_required=True,
        )
        db_session.add(content_item)
        await db_session.commit()

        # Enroll student
        enrollment = Enrollment(
            student_id=student.id,
            course_id=course.id,
            completion_percentage=0,
            is_completed=False,
            is_active=True,
        )
        db_session.add(enrollment)
        await db_session.commit()

        # Login as student
        login = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "student@test.com", "password": "password123"},
        )
        student_token = login.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # Student can access content while enrolled
        response1 = await async_client.get(
            f"/api/v1/content/{content_item.id}",
            headers=student_headers,
        )
        assert response1.status_code == 200

        # Student unenrolls
        unenroll = await async_client.delete(
            f"/api/v1/enrollments/{enrollment.id}",
            headers=student_headers,
        )
        assert unenroll.status_code == 200

        # Student can no longer access content
        response2 = await async_client.get(
            f"/api/v1/content/{content_item.id}",
            headers=student_headers,
        )
        assert response2.status_code == 403

    async def test_admin_can_access_any_content(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        GIVEN: Admin user (not enrolled)
        WHEN: Admin accesses any course content
        THEN: Returns 200 (admins have access to all content)
        """
        from backend.src.core.security import get_password_hash

        # Create instructor and admin
        instructor = User(
            email="instructor@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.INSTRUCTOR,
            first_name="Instructor",
            last_name="Test",
            email_verified=True,
            is_active=True,
        )
        admin = User(
            email="admin@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.ADMIN,
            first_name="Admin",
            last_name="Test",
            email_verified=True,
            is_active=True,
        )
        db_session.add(instructor)
        db_session.add(admin)
        await db_session.commit()

        course = Course(
            instructor_id=instructor.id,
            title="Test Course",
            description="Test Description",
            category="TECHNOLOGY",
            visibility="PUBLISHED",
            enrollment_capacity=50,
        )
        db_session.add(course)
        await db_session.commit()

        # Create module and content item
        module = Module(
            course_id=course.id,
            title="Module 1",
            description="First Module",
            order_index=1,
        )
        db_session.add(module)
        await db_session.commit()

        content_item = ContentItem(
            course_id=course.id,
            module_id=module.id,
            title="Lesson 1",
            description="First Lesson",
            content_type="VIDEO",
            file_url="/storage/videos/lesson1.mp4",
            file_size=1024000,
            mime_type="video/mp4",
            duration_seconds=300,
            order_index=1,
            is_required=True,
        )
        db_session.add(content_item)
        await db_session.commit()

        # Login as admin
        login = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "admin@test.com", "password": "password123"},
        )
        admin_token = login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Admin should be able to access content without enrollment
        response = await async_client.get(
            f"/api/v1/content/{content_item.id}",
            headers=admin_headers,
        )

        assert response.status_code == 200
        content_data = response.json()
        assert content_data["id"] == str(content_item.id)
