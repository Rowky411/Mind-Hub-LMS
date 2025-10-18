"""
Course service for Mind Hub LMS.

Business logic for course management operations.
"""
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID

from src.models.course import Course, CourseVisibility
from src.models.user import User
from src.schemas.course import CourseCreate, CourseUpdate
from src.core.exceptions import AppException
from src.core.logging import get_logger

logger = get_logger(__name__)


class CourseService:
    """Service for course operations."""

    def __init__(self, db: AsyncSession):
        """
        Initialize course service.

        Args:
            db: Database session
        """
        self.db = db

    async def create_course(
        self,
        course_data: CourseCreate,
        instructor_id: str
    ) -> Course:
        """
        Create a new course.

        Args:
            course_data: Course creation data
            instructor_id: ID of the instructor creating the course

        Returns:
            Course: Created course

        Raises:
            AppException: If instructor not found or not authorized
        """
        # Verify instructor exists and has permission
        result = await self.db.execute(
            select(User).where(User.id == instructor_id)
        )
        instructor = result.scalar_one_or_none()

        if not instructor:
            raise AppException(
                status_code=404,
                message="Instructor not found",
                details={"instructor_id": instructor_id}
            )

        if not instructor.can_teach():
            raise AppException(
                status_code=403,
                message="User does not have permission to create courses",
                details={"role": instructor.role.value}
            )

        # Create course
        course = Course(
            instructor_id=instructor_id,
            **course_data.model_dump()
        )

        self.db.add(course)
        await self.db.commit()
        await self.db.refresh(course)

        logger.info(
            f"Course created: {course.id}",
            extra={
                "course_id": course.id,
                "instructor_id": instructor_id,
                "title": course.title
            }
        )

        return course

    async def get_course_by_id(
        self,
        course_id: str,
        include_deleted: bool = False
    ) -> Optional[Course]:
        """
        Get course by ID.

        Args:
            course_id: Course ID
            include_deleted: Whether to include soft-deleted courses

        Returns:
            Course or None if not found
        """
        query = select(Course).where(Course.id == course_id)

        if not include_deleted:
            query = query.where(Course.deleted_at.is_(None))

        query = query.options(selectinload(Course.instructor))

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_course(
        self,
        course_id: str,
        course_data: CourseUpdate,
        user_id: str
    ) -> Course:
        """
        Update an existing course.

        Args:
            course_id: Course ID to update
            course_data: Updated course data
            user_id: ID of user performing the update

        Returns:
            Course: Updated course

        Raises:
            AppException: If course not found or user not authorized
        """
        course = await self.get_course_by_id(course_id)

        if not course:
            raise AppException(
                status_code=404,
                message="Course not found",
                details={"course_id": course_id}
            )

        # Check authorization (course owner or admin)
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise AppException(status_code=404, message="User not found")

        if course.instructor_id != user_id and not user.is_admin:
            raise AppException(
                status_code=403,
                message="Not authorized to update this course"
            )

        # Update course fields
        update_data = course_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(course, field, value)

        await self.db.commit()
        await self.db.refresh(course)

        logger.info(
            f"Course updated: {course.id}",
            extra={"course_id": course.id, "updated_by": user_id}
        )

        return course

    async def delete_course(
        self,
        course_id: str,
        user_id: str
    ) -> None:
        """
        Soft delete a course.

        Args:
            course_id: Course ID to delete
            user_id: ID of user performing the deletion

        Raises:
            AppException: If course not found or user not authorized
        """
        course = await self.get_course_by_id(course_id)

        if not course:
            raise AppException(
                status_code=404,
                message="Course not found"
            )

        # Check authorization
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise AppException(status_code=404, message="User not found")

        if course.instructor_id != user_id and not user.is_admin:
            raise AppException(
                status_code=403,
                message="Not authorized to delete this course"
            )

        # Soft delete
        from datetime import datetime
        course.deleted_at = datetime.utcnow()

        await self.db.commit()

        logger.info(
            f"Course deleted: {course.id}",
            extra={"course_id": course.id, "deleted_by": user_id}
        )

    async def list_courses(
        self,
        page: int = 1,
        per_page: int = 20,
        category: Optional[str] = None,
        visibility: Optional[CourseVisibility] = None,
        instructor_id: Optional[str] = None,
        is_featured: Optional[bool] = None
    ) -> tuple[list[Course], int]:
        """
        List courses with pagination and filters.

        Args:
            page: Page number (1-indexed)
            per_page: Items per page
            category: Filter by category
            visibility: Filter by visibility
            instructor_id: Filter by instructor
            is_featured: Filter by featured status

        Returns:
            tuple: (courses list, total count)
        """
        # Build query
        query = select(Course).where(Course.deleted_at.is_(None))

        # Apply filters
        if category:
            query = query.where(Course.category == category)

        if visibility:
            query = query.where(Course.visibility == visibility)

        if instructor_id:
            query = query.where(Course.instructor_id == instructor_id)

        if is_featured is not None:
            query = query.where(Course.is_featured == is_featured)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        # Order by featured first, then by created_at descending
        query = query.order_by(
            Course.is_featured.desc(),
            Course.created_at.desc()
        )

        # Execute query
        query = query.options(selectinload(Course.instructor))
        result = await self.db.execute(query)
        courses = list(result.scalars().all())

        return courses, total
