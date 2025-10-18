"""
Pydantic schemas for ContentItem API.

Request and response models for course content operations.
"""
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional

from src.models.content_item import ContentType


class ContentItemBase(BaseModel):
    """Base content item schema with common fields."""
    title: str = Field(..., min_length=2, max_length=200, description="Content title")
    description: Optional[str] = Field(None, description="Content description")
    content_type: ContentType = Field(..., description="Type of content")
    text_content: Optional[str] = Field(None, description="Text content (for text type)")
    duration_seconds: Optional[int] = Field(None, ge=0, description="Duration in seconds (for video)")
    order_index: int = Field(..., ge=0, description="Position within module/course")
    is_required: bool = Field(default=True, description="Whether content counts toward completion")


class ContentItemCreate(ContentItemBase):
    """Schema for creating a new content item."""
    course_id: str = Field(..., description="Course ID this content belongs to")
    module_id: Optional[str] = Field(None, description="Module ID (optional)")

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        """Validate title is not just whitespace."""
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace")
        return v.strip()

    @model_validator(mode='after')
    def validate_content_fields(self):
        """Validate required fields based on content type."""
        if self.content_type == ContentType.TEXT and not self.text_content:
            raise ValueError("text_content is required for TEXT content type")
        return self


class ContentItemUpdate(BaseModel):
    """Schema for updating an existing content item."""
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    text_content: Optional[str] = None
    duration_seconds: Optional[int] = Field(None, ge=0)
    order_index: Optional[int] = Field(None, ge=0)
    is_required: Optional[bool] = None


class ContentItemResponse(ContentItemBase):
    """Schema for content item response."""
    id: str
    course_id: str
    module_id: Optional[str]
    file_url: Optional[str] = Field(None, description="File URL (for video/document)")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="MIME type of file")
    created_at: datetime
    updated_at: datetime

    # Computed fields
    is_file_based: bool = Field(description="Whether content requires file upload")
    is_text_based: bool = Field(description="Whether content is text-based")

    model_config = {"from_attributes": True}


class ContentItemUploadResponse(BaseModel):
    """Schema for content upload response."""
    content_item: ContentItemResponse
    upload_url: Optional[str] = Field(None, description="Pre-signed upload URL (if applicable)")

    model_config = {"from_attributes": True}
