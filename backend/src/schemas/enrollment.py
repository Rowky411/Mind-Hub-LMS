"""
Pydantic schemas for Enrollment model

Defines request/response schemas for enrollment endpoints.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from src.schemas.course import CourseResponse


class EnrollmentCreate(BaseModel):
    """Schema for creating a new enrollment"""

    course_id: UUID = Field(
        ...,
        description="ID of the course to enroll in"
    )


class EnrollmentResponse(BaseModel):
    """Schema for enrollment response"""

    id: UUID
    student_id: UUID
    course_id: UUID
    enrollment_date: datetime
    completion_percentage: float = Field(
        ge=0.0,
        le=100.0,
        description="Progress through course (0-100)"
    )
    is_completed: bool
    completion_date: datetime | None = None
    unenrollment_date: datetime | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EnrollmentWithCourse(EnrollmentResponse):
    """
    Schema for enrollment response with nested course details

    Used in my-courses endpoint to include full course information
    with each enrollment.
    """

    course: CourseResponse = Field(
        ...,
        description="Full course details for this enrollment"
    )

    class Config:
        from_attributes = True


class EnrollmentUpdate(BaseModel):
    """Schema for updating enrollment (internal use)"""

    completion_percentage: float | None = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Updated completion percentage"
    )
    is_completed: bool | None = None
    completion_date: datetime | None = None

    @field_validator('completion_percentage')
    @classmethod
    def validate_completion_percentage(cls, v: float | None) -> float | None:
        """Ensure completion percentage is within valid range"""
        if v is not None and not (0.0 <= v <= 100.0):
            raise ValueError('Completion percentage must be between 0 and 100')
        return v


class EnrollmentStats(BaseModel):
    """Schema for enrollment statistics (for course roster)"""

    student_id: UUID
    student_name: str
    student_email: str
    enrollment_date: datetime
    completion_percentage: float
    is_completed: bool
    last_activity: datetime | None = None

    class Config:
        from_attributes = True
