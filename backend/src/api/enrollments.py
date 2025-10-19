"""
Enrollment API endpoints

Endpoints for student course enrollment management:
- POST /enrollments - Enroll in a course
- GET /enrollments/my-courses - Get student's enrollments
- DELETE /enrollments/{enrollment_id} - Unenroll from a course
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_user, require_role
from src.models.user import User, UserRole
from src.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentWithCourse,
)
from src.services.enrollment_service import EnrollmentService

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.post(
    "",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enroll in a course",
    description="Enroll the current student in a course. Validates course exists, is published, has capacity, and student isn't already enrolled.",
)
async def create_enrollment(
    enrollment_data: EnrollmentCreate,
    current_user: User = Depends(require_role([UserRole.STUDENT])),
    db: AsyncSession = Depends(get_session),
) -> EnrollmentResponse:
    """
    Enroll student in a course

    Requirements:
    - User must have STUDENT role
    - Course must exist and be published
    - Course must have available capacity
    - Student must not already be enrolled

    Returns:
        EnrollmentResponse: Created enrollment details
    """
    enrollment = await EnrollmentService.enroll_student(
        db=db,
        student_id=current_user.id,
        course_id=enrollment_data.course_id,
    )

    return EnrollmentResponse.model_validate(enrollment)


@router.get(
    "/my-courses",
    response_model=list[EnrollmentWithCourse],
    summary="Get my enrollments",
    description="Get all active course enrollments for the current student with full course details",
)
async def get_my_enrollments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> list[EnrollmentWithCourse]:
    """
    Get current user's active course enrollments

    Returns enrollments with nested course details for display
    in "My Courses" page.

    Returns:
        List[EnrollmentWithCourse]: Enrollments with course details
    """
    enrollments = await EnrollmentService.get_student_enrollments(
        db=db,
        student_id=current_user.id,
        include_inactive=False,
    )

    # Convert to response schema with course details
    return [
        EnrollmentWithCourse.model_validate(enrollment)
        for enrollment in enrollments
    ]


@router.delete(
    "/{enrollment_id}",
    status_code=status.HTTP_200_OK,
    summary="Unenroll from a course",
    description="Unenroll the current student from a course (soft delete - sets is_active=False)",
)
async def delete_enrollment(
    enrollment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """
    Unenroll student from a course

    This is a soft delete - the enrollment record is kept but marked
    as inactive. Student can re-enroll later.

    Args:
        enrollment_id: UUID of the enrollment to delete

    Returns:
        Success message
    """
    await EnrollmentService.unenroll_student(
        db=db,
        enrollment_id=enrollment_id,
        student_id=current_user.id,
    )

    return {"message": "Successfully unenrolled from course"}
