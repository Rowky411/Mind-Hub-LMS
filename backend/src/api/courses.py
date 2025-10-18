"""
Course API endpoints.

Handles course CRUD operations, listing, and filtering.
"""
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import math

from src.core.database import get_session
from src.core.dependencies import get_current_user
from src.models.user import User
from src.models.course import CourseVisibility
from src.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseWithInstructor,
    CourseListResponse
)
from src.services.course_service import CourseService
from src.core.exceptions import AppException

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new course.

    Requires instructor or admin role.

    Args:
        course_data: Course creation data
        current_user: Authenticated user
        db: Database session

    Returns:
        CourseResponse: Created course

    Raises:
        403: User not authorized to create courses
    """
    # Check authorization
    if not current_user.can_teach():
        raise AppException(
            status_code=403,
            message="Only instructors and admins can create courses"
        )

    service = CourseService(db)
    course = await service.create_course(course_data, current_user.id)

    return CourseResponse.model_validate(course)


@router.get("", response_model=CourseListResponse)
async def list_courses(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    visibility: Optional[CourseVisibility] = Query(None, description="Filter by visibility"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    db: AsyncSession = Depends(get_session),
):
    """
    List published courses with pagination and filtering.

    Public endpoint - no authentication required.

    Args:
        page: Page number (1-indexed)
        per_page: Items per page
        category: Optional category filter
        visibility: Optional visibility filter (defaults to PUBLIC only)
        is_featured: Optional featured filter
        db: Database session

    Returns:
        CourseListResponse: Paginated course list
    """
    service = CourseService(db)

    # Default to public courses only for unauthenticated access
    if visibility is None:
        visibility = CourseVisibility.PUBLIC

    courses, total = await service.list_courses(
        page=page,
        per_page=per_page,
        category=category,
        visibility=visibility,
        is_featured=is_featured
    )

    total_pages = math.ceil(total / per_page) if total > 0 else 0

    return CourseListResponse(
        courses=[CourseResponse.model_validate(c) for c in courses],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/my-courses", response_model=CourseListResponse)
async def list_my_courses(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List courses created by the current instructor.

    Requires authentication.

    Args:
        page: Page number
        per_page: Items per page
        current_user: Authenticated user
        db: Database session

    Returns:
        CourseListResponse: Instructor's courses

    Raises:
        403: User is not an instructor
    """
    if not current_user.can_teach():
        raise AppException(
            status_code=403,
            message="Only instructors can view their courses"
        )

    service = CourseService(db)
    courses, total = await service.list_courses(
        page=page,
        per_page=per_page,
        instructor_id=current_user.id
    )

    total_pages = math.ceil(total / per_page) if total > 0 else 0

    return CourseListResponse(
        courses=[CourseResponse.model_validate(c) for c in courses],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/{course_id}", response_model=CourseWithInstructor)
async def get_course(
    course_id: str,
    db: AsyncSession = Depends(get_session),
):
    """
    Get course details by ID.

    Public endpoint for published courses.

    Args:
        course_id: Course ID
        db: Database session

    Returns:
        CourseWithInstructor: Course details with instructor info

    Raises:
        404: Course not found
    """
    service = CourseService(db)
    course = await service.get_course_by_id(course_id)

    if not course:
        raise AppException(
            status_code=404,
            message="Course not found",
            details={"course_id": course_id}
        )

    # Build response with instructor details
    response_data = CourseResponse.model_validate(course).model_dump()
    response_data["instructor_name"] = course.instructor.full_name
    response_data["instructor_email"] = course.instructor.email

    return CourseWithInstructor(**response_data)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    course_data: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an existing course.

    Requires course ownership or admin role.

    Args:
        course_id: Course ID to update
        course_data: Updated course data
        current_user: Authenticated user
        db: Database session

    Returns:
        CourseResponse: Updated course

    Raises:
        404: Course not found
        403: Not authorized to update course
    """
    service = CourseService(db)
    course = await service.update_course(course_id, course_data, current_user.id)

    return CourseResponse.model_validate(course)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Delete a course (soft delete).

    Requires course ownership or admin role.

    Args:
        course_id: Course ID to delete
        current_user: Authenticated user
        db: Database session

    Raises:
        404: Course not found
        403: Not authorized to delete course
    """
    service = CourseService(db)
    await service.delete_course(course_id, current_user.id)

    return None
