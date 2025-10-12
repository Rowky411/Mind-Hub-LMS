"""
Pagination utilities for list endpoints.

Provides consistent pagination across all API list responses.
"""
from typing import Generic, List, TypeVar, Optional
from math import ceil

from pydantic import BaseModel, Field


T = TypeVar("T")


class PaginationParams(BaseModel):
    """Query parameters for pagination."""

    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")

    @property
    def offset(self) -> int:
        """Calculate database offset from page number."""
        return (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        """Get limit for database query."""
        return self.per_page


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response model.

    Attributes:
        items: List of items for current page
        total: Total number of items across all pages
        page: Current page number
        per_page: Items per page
        total_pages: Total number of pages
        has_next: Whether there is a next page
        has_prev: Whether there is a previous page
    """

    items: List[T]
    total: int
    page: int
    per_page: int

    @property
    def total_pages(self) -> int:
        """Calculate total pages from total items."""
        return ceil(self.total / self.per_page) if self.total > 0 else 0

    @property
    def has_next(self) -> bool:
        """Check if there is a next page."""
        return self.page < self.total_pages

    @property
    def has_prev(self) -> bool:
        """Check if there is a previous page."""
        return self.page > 1

    model_config = {
        "json_schema_extra": {
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "per_page": 20,
            }
        }
    }


def paginate(
    items: List[T],
    total: int,
    page: int,
    per_page: int,
) -> PaginatedResponse[T]:
    """
    Create a paginated response from query results.

    Args:
        items: List of items for current page
        total: Total count of all items
        page: Current page number
        per_page: Items per page

    Returns:
        PaginatedResponse[T]: Paginated response with metadata
    """
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
    )
