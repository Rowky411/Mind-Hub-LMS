"""
Pydantic schemas for Course API.

Request and response models for course operations.
"""
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional

from src.models.course import CourseVisibility


class CourseBase(BaseModel):
    """Base course schema with common fields."""
    title: str = Field(..., min_length=3, max_length=200, description="Course title")
    description: str = Field(..., min_length=10, description="Course description")
    category: str = Field(..., min_length=2, max_length=100, description="Course category")
    visibility: CourseVisibility = Field(default=CourseVisibility.DRAFT, description="Course visibility")
    enrollment_capacity: Optional[int] = Field(None, ge=1, description="Maximum enrollment (null = unlimited)")
    thumbnail_url: Optional[str] = Field(None, max_length=500, description="Course thumbnail URL")
    is_featured: bool = Field(default=False, description="Whether course is featured")


class CourseCreate(CourseBase):
    """Schema for creating a new course."""

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        """Validate title is not just whitespace."""
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace")
        return v.strip()

    @field_validator('description')
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        """Validate description is not just whitespace."""
        if not v.strip():
            raise ValueError("Description cannot be empty or whitespace")
        return v.strip()


class CourseUpdate(BaseModel):
    """Schema for updating an existing course."""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    visibility: Optional[CourseVisibility] = None
    enrollment_capacity: Optional[int] = Field(None, ge=1)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    is_featured: Optional[bool] = None


class CourseResponse(CourseBase):
    """Schema for course response."""
    id: str
    instructor_id: str
    created_at: datetime
    updated_at: datetime

    # Computed fields
    is_published: bool = Field(description="Whether course is published")
    is_public: bool = Field(description="Whether course is publicly accessible")

    model_config = {"from_attributes": True}


class CourseWithInstructor(CourseResponse):
    """Schema for course response with instructor details."""
    instructor_name: str = Field(description="Instructor full name")
    instructor_email: str = Field(description="Instructor email")

    model_config = {"from_attributes": True}


class CourseListResponse(BaseModel):
    """Schema for paginated course list response."""
    courses: list[CourseResponse]
    total: int = Field(description="Total number of courses")
    page: int = Field(description="Current page number")
    per_page: int = Field(description="Items per page")
    total_pages: int = Field(description="Total number of pages")

    model_config = {"from_attributes": True}
