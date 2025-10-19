"""
Integration test for complete student enrollment journey

Tests the end-to-end flow:
1. Student browses published courses
2. Student enrolls in a course
3. Student views their enrolled courses
4. Student unenrolls from a course
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.course import Course
from backend.src.models.user import User, UserRole


@pytest.mark.asyncio
class TestStudentEnrollmentJourney:
    """Integration test for student enrollment workflow"""

    async def test_complete_enrollment_journey(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        Test complete enrollment journey:
        - Create student and instructor
        - Instructor creates published course
        - Student browses courses and finds the course
        - Student enrolls in course
        - Student views enrolled courses
        - Student unenrolls from course
        """
        # Step 1: Create instructor and student
        from backend.src.core.security import get_password_hash

        instructor = User(
            email="instructor@example.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.INSTRUCTOR,
            first_name="John",
            last_name="Instructor",
            email_verified=True,
            is_active=True,
        )
        student = User(
            email="student@example.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.STUDENT,
            first_name="Jane",
            last_name="Student",
            email_verified=True,
            is_active=True,
        )
        db_session.add(instructor)
        db_session.add(student)
        await db_session.commit()

        # Step 2: Login as instructor and create course
        instructor_login = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "instructor@example.com", "password": "password123"},
        )
        assert instructor_login.status_code == 200
        instructor_token = instructor_login.json()["access_token"]
        instructor_headers = {"Authorization": f"Bearer {instructor_token}"}

        course_data = {
            "title": "Python for Beginners",
            "description": "Learn Python programming from scratch",
            "category": "TECHNOLOGY",
            "visibility": "PUBLISHED",
            "enrollment_capacity": 50,
        }
        create_course_response = await async_client.post(
            "/api/v1/courses",
            json=course_data,
            headers=instructor_headers,
        )
        assert create_course_response.status_code == 201
        course = create_course_response.json()
        course_id = course["id"]

        # Step 3: Login as student
        student_login = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "student@example.com", "password": "password123"},
        )
        assert student_login.status_code == 200
        student_token = student_login.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # Step 4: Student browses published courses
        browse_response = await async_client.get("/api/v1/courses")
        assert browse_response.status_code == 200
        courses = browse_response.json()
        assert len(courses) >= 1

        # Find the created course
        found_course = next(
            (c for c in courses if c["id"] == course_id),
            None
        )
        assert found_course is not None
        assert found_course["title"] == "Python for Beginners"
        assert found_course["visibility"] == "PUBLISHED"

        # Step 5: Student enrolls in course
        enroll_response = await async_client.post(
            "/api/v1/enrollments",
            json={"course_id": course_id},
            headers=student_headers,
        )
        assert enroll_response.status_code == 201
        enrollment = enroll_response.json()
        enrollment_id = enrollment["id"]

        # Verify enrollment details
        assert enrollment["student_id"] == str(student.id)
        assert enrollment["course_id"] == course_id
        assert enrollment["completion_percentage"] == 0
        assert enrollment["is_completed"] is False
        assert enrollment["is_active"] is True

        # Step 6: Student views their enrolled courses
        my_courses_response = await async_client.get(
            "/api/v1/enrollments/my-courses",
            headers=student_headers,
        )
        assert my_courses_response.status_code == 200
        my_courses = my_courses_response.json()

        # Verify student is enrolled in exactly one course
        assert len(my_courses) == 1
        assert my_courses[0]["id"] == enrollment_id
        assert my_courses[0]["course"]["id"] == course_id
        assert my_courses[0]["course"]["title"] == "Python for Beginners"
        assert my_courses[0]["completion_percentage"] == 0

        # Step 7: Verify student cannot enroll again (duplicate enrollment)
        duplicate_enroll = await async_client.post(
            "/api/v1/enrollments",
            json={"course_id": course_id},
            headers=student_headers,
        )
        assert duplicate_enroll.status_code == 409

        # Step 8: Student unenrolls from course
        unenroll_response = await async_client.delete(
            f"/api/v1/enrollments/{enrollment_id}",
            headers=student_headers,
        )
        assert unenroll_response.status_code == 200

        # Step 9: Verify student no longer has active enrollments
        my_courses_after = await async_client.get(
            "/api/v1/enrollments/my-courses",
            headers=student_headers,
        )
        assert my_courses_after.status_code == 200
        assert len(my_courses_after.json()) == 0

        # Step 10: Student can re-enroll after unenrolling
        re_enroll_response = await async_client.post(
            "/api/v1/enrollments",
            json={"course_id": course_id},
            headers=student_headers,
        )
        assert re_enroll_response.status_code == 201

    async def test_enrollment_capacity_enforcement(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        Test that enrollment capacity is enforced:
        - Create course with capacity of 1
        - First student enrolls successfully
        - Second student enrollment is rejected
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

        # Create course with capacity of 1
        course = Course(
            instructor_id=instructor.id,
            title="Limited Course",
            description="Course with limited enrollment",
            category="TECHNOLOGY",
            visibility="PUBLISHED",
            enrollment_capacity=1,
        )
        db_session.add(course)
        await db_session.commit()

        # Create two students
        student1 = User(
            email="student1@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.STUDENT,
            first_name="Student",
            last_name="One",
            email_verified=True,
            is_active=True,
        )
        student2 = User(
            email="student2@test.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.STUDENT,
            first_name="Student",
            last_name="Two",
            email_verified=True,
            is_active=True,
        )
        db_session.add(student1)
        db_session.add(student2)
        await db_session.commit()

        # Login as student1
        login1 = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "student1@test.com", "password": "password123"},
        )
        student1_token = login1.json()["access_token"]
        student1_headers = {"Authorization": f"Bearer {student1_token}"}

        # Student1 enrolls successfully
        enroll1 = await async_client.post(
            "/api/v1/enrollments",
            json={"course_id": str(course.id)},
            headers=student1_headers,
        )
        assert enroll1.status_code == 201

        # Login as student2
        login2 = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "student2@test.com", "password": "password123"},
        )
        student2_token = login2.json()["access_token"]
        student2_headers = {"Authorization": f"Bearer {student2_token}"}

        # Student2 enrollment should fail (capacity reached)
        enroll2 = await async_client.post(
            "/api/v1/enrollments",
            json={"course_id": str(course.id)},
            headers=student2_headers,
        )
        assert enroll2.status_code == 400
        assert "capacity" in enroll2.json()["detail"].lower()

    async def test_cannot_enroll_in_draft_course(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """
        Test that students cannot enroll in draft courses
        """
        from backend.src.core.security import get_password_hash

        # Create instructor and student
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

        # Create draft course
        course = Course(
            instructor_id=instructor.id,
            title="Draft Course",
            description="Course in draft mode",
            category="TECHNOLOGY",
            visibility="DRAFT",
            enrollment_capacity=50,
        )
        db_session.add(course)
        await db_session.commit()

        # Login as student
        login = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "student@test.com", "password": "password123"},
        )
        student_token = login.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # Attempt to enroll should fail
        enroll = await async_client.post(
            "/api/v1/enrollments",
            json={"course_id": str(course.id)},
            headers=student_headers,
        )
        assert enroll.status_code == 400
        assert "published" in enroll.json()["detail"].lower()
