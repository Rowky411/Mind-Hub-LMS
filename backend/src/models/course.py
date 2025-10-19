"""
Course model for Mind Hub LMS.

Represents educational content containers managed by instructors.
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, Boolean, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from src.models.base import Base

if TYPE_CHECKING:
    from src.models.user import User
    from src.models.module import Module
    from src.models.content_item import ContentItem
    from src.models.enrollment import Enrollment


class CourseVisibility(str, PyEnum):
    """Course visibility enumeration."""
    PUBLIC = "public"
    PRIVATE = "private"
    DRAFT = "draft"


class Course(Base):
    """
    Course entity representing educational content container.

    Attributes:
        instructor_id: Foreign key to User (instructor who created the course)
        title: Course title
        description: Detailed course description
        category: Course category for organization
        visibility: Course visibility (public, private, draft)
        enrollment_capacity: Maximum number of students (NULL = unlimited)
        thumbnail_url: Optional course thumbnail/cover image path
        is_featured: Whether course is featured on homepage
    """
    __tablename__ = "courses"

    instructor_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    visibility: Mapped[CourseVisibility] = mapped_column(
        Enum(CourseVisibility, name="course_visibility", native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=CourseVisibility.DRAFT,
        index=True
    )
    enrollment_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    # Relationships
    instructor: Mapped["User"] = relationship("User", back_populates="courses")
    modules: Mapped[list["Module"]] = relationship(
        "Module",
        back_populates="course",
        cascade="all, delete-orphan"
    )
    content_items: Mapped[list["ContentItem"]] = relationship(
        "ContentItem",
        back_populates="course",
        cascade="all, delete-orphan"
    )
    enrollments: Mapped[list["Enrollment"]] = relationship(
        "Enrollment",
        foreign_keys="[Enrollment.course_id]",
        back_populates="course",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation of Course."""
        return f"<Course(id={self.id}, title={self.title}, visibility={self.visibility.value})>"

    @property
    def is_published(self) -> bool:
        """Check if course is published (public or private)."""
        return self.visibility in [CourseVisibility.PUBLIC, CourseVisibility.PRIVATE]

    @property
    def is_public(self) -> bool:
        """Check if course is publicly accessible."""
        return self.visibility == CourseVisibility.PUBLIC

    @property
    def has_capacity(self) -> bool:
        """Check if course has unlimited capacity."""
        return self.enrollment_capacity is None

    def can_enroll(self, current_enrollment_count: int) -> bool:
        """
        Check if new students can enroll based on capacity.

        Args:
            current_enrollment_count: Current number of enrolled students

        Returns:
            bool: True if enrollment is allowed
        """
        if self.enrollment_capacity is None:
            return True
        return current_enrollment_count < self.enrollment_capacity
