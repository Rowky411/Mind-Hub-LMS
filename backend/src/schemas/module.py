"""
Pydantic schemas for Module API.

Request and response models for course module operations.
"""
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class ModuleBase(BaseModel):
    """Base module schema with common fields."""
    title: str = Field(..., min_length=2, max_length=200, description="Module title")
    description: Optional[str] = Field(None, description="Module description")
    order_index: int = Field(..., ge=0, description="Position within course")


class ModuleCreate(ModuleBase):
    """Schema for creating a new module."""
    course_id: str = Field(..., description="Course ID this module belongs to")

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        """Validate title is not just whitespace."""
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace")
        return v.strip()


class ModuleUpdate(BaseModel):
    """Schema for updating an existing module."""
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=0)


class ModuleResponse(ModuleBase):
    """Schema for module response."""
    id: str
    course_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ModuleWithContent(ModuleResponse):
    """Schema for module response with content items."""
    content_count: int = Field(description="Number of content items in module")

    model_config = {"from_attributes": True}
