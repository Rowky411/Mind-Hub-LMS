"""
Enrollment service for managing student course enrollments

Business logic for:
- Creating enrollments with validation
- Checking enrollment capacity
- Managing unenrollment
- Querying student enrollments
"""

from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.course import Course, CourseVisibility
from src.models.enrollment import Enrollment
from src.models.user import User


class EnrollmentService:
    """Service for managing course enrollments"""

    @staticmethod
    async def enroll_student(
        db: AsyncSession,
        student_id: UUID,
        course_id: UUID,
    ) -> Enrollment:
        """
        Enroll a student in a course with validations

        Args:
            db: Database session
            student_id: UUID of the student
            course_id: UUID of the course

        Returns:
            Created enrollment record

        Raises:
            HTTPException: If validation fails
        """
        # 1. Verify course exists
        # Convert UUID to string for comparison (id is stored as String(36))
        course_id_str = str(course_id)
        course_query = select(Course).where(Course.id == course_id_str)
        result = await db.execute(course_query)
        course = result.scalar_one_or_none()

        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with ID {course_id} not found"
            )

        # 2. Verify course is published
        if course.visibility not in [CourseVisibility.PUBLIC, CourseVisibility.PRIVATE]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only enroll in published courses"
            )

        # 3. Check for existing enrollment
        existing_enrollment = await EnrollmentService.get_active_enrollment(
            db, student_id, course_id
        )

        if existing_enrollment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Student is already enrolled in this course"
            )

        # 4. Check enrollment capacity
        if not await EnrollmentService.check_enrollment_capacity(db, course_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course has reached its enrollment capacity"
            )

        # 5. Create enrollment
        # Convert UUIDs to strings for storage (ids are stored as String(36))
        enrollment = Enrollment(
            student_id=str(student_id),
            course_id=str(course_id),
            enrollment_date=datetime.utcnow(),
            completion_percentage=0.0,
            is_completed=False,
            is_active=True,
        )

        db.add(enrollment)
        await db.commit()
        await db.refresh(enrollment)

        return enrollment

    @staticmethod
    async def unenroll_student(
        db: AsyncSession,
        enrollment_id: UUID,
        student_id: UUID,
    ) -> None:
        """
        Unenroll a student from a course (soft delete)

        Args:
            db: Database session
            enrollment_id: UUID of the enrollment
            student_id: UUID of the student (for authorization)

        Raises:
            HTTPException: If enrollment not found or unauthorized
        """
        # Convert UUIDs to strings for comparison (ids are stored as String(36))
        enrollment_id_str = str(enrollment_id)
        student_id_str = str(student_id)

        # Get enrollment
        query = select(Enrollment).where(
            and_(
                Enrollment.id == enrollment_id_str,
                Enrollment.student_id == student_id_str,
                Enrollment.is_active == True
            )
        )
        result = await db.execute(query)
        enrollment = result.scalar_one_or_none()

        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enrollment not found or already inactive"
            )

        # Soft delete - set is_active to False
        enrollment.is_active = False
        enrollment.unenrollment_date = datetime.utcnow()

        await db.commit()

    @staticmethod
    async def get_student_enrollments(
        db: AsyncSession,
        student_id: UUID,
        include_inactive: bool = False,
    ) -> list[Enrollment]:
        """
        Get all enrollments for a student

        Args:
            db: Database session
            student_id: UUID of the student
            include_inactive: Whether to include unenrolled courses

        Returns:
            List of enrollments with course details loaded
        """
        # Convert UUID to string for comparison (id is stored as String(36))
        student_id_str = str(student_id)

        query = select(Enrollment).where(
            Enrollment.student_id == student_id_str
        )

        if not include_inactive:
            query = query.where(Enrollment.is_active == True)

        # Eager load course relationship
        query = query.options(selectinload(Enrollment.course))

        # Order by enrollment date descending (most recent first)
        query = query.order_by(Enrollment.enrollment_date.desc())

        result = await db.execute(query)
        enrollments = result.scalars().all()

        return list(enrollments)

    @staticmethod
    async def get_active_enrollment(
        db: AsyncSession,
        student_id: UUID,
        course_id: UUID,
    ) -> Enrollment | None:
        """
        Get active enrollment for student in a specific course

        Args:
            db: Database session
            student_id: UUID of the student
            course_id: UUID of the course

        Returns:
            Enrollment if exists and active, None otherwise
        """
        # Convert UUIDs to strings for comparison (ids are stored as String(36))
        student_id_str = str(student_id)
        course_id_str = str(course_id)

        query = select(Enrollment).where(
            and_(
                Enrollment.student_id == student_id_str,
                Enrollment.course_id == course_id_str,
                Enrollment.is_active == True
            )
        )

        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def is_student_enrolled(
        db: AsyncSession,
        student_id: UUID,
        course_id: UUID,
    ) -> bool:
        """
        Check if student is actively enrolled in a course

        Args:
            db: Database session
            student_id: UUID of the student
            course_id: UUID of the course

        Returns:
            True if student is enrolled and active, False otherwise
        """
        enrollment = await EnrollmentService.get_active_enrollment(
            db, student_id, course_id
        )
        return enrollment is not None

    @staticmethod
    async def check_enrollment_capacity(
        db: AsyncSession,
        course_id: UUID,
    ) -> bool:
        """
        Check if course has capacity for new enrollments

        Args:
            db: Database session
            course_id: UUID of the course

        Returns:
            True if course can accept new enrollments, False otherwise
        """
        # Convert UUID to string for comparison (id is stored as String(36))
        course_id_str = str(course_id)

        # Get course with enrollment capacity
        course_query = select(Course).where(Course.id == course_id_str)
        result = await db.execute(course_query)
        course = result.scalar_one_or_none()

        if not course:
            return False

        # If no capacity limit, always return True
        if course.enrollment_capacity is None:
            return True

        # Count active enrollments
        count_query = select(func.count(Enrollment.id)).where(
            and_(
                Enrollment.course_id == course_id_str,
                Enrollment.is_active == True
            )
        )
        count_result = await db.execute(count_query)
        current_enrollments = count_result.scalar()

        # Check if under capacity
        return current_enrollments < course.enrollment_capacity

    @staticmethod
    async def get_course_roster(
        db: AsyncSession,
        course_id: UUID,
    ) -> list[Enrollment]:
        """
        Get all active enrollments for a course (roster)

        Args:
            db: Database session
            course_id: UUID of the course

        Returns:
            List of enrollments with student details loaded
        """
        # Convert UUID to string for comparison (id is stored as String(36))
        course_id_str = str(course_id)

        query = select(Enrollment).where(
            and_(
                Enrollment.course_id == course_id_str,
                Enrollment.is_active == True
            )
        ).options(
            selectinload(Enrollment.student)
        ).order_by(
            Enrollment.enrollment_date.asc()
        )

        result = await db.execute(query)
        enrollments = result.scalars().all()

        return list(enrollments)
