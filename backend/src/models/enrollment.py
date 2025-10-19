"""
Enrollment model for student course enrollments

Represents a student's enrollment in a course with progress tracking.
Includes soft deletion support via is_active flag for unenrollment.
"""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base

if TYPE_CHECKING:
    from src.models.course import Course
    from src.models.user import User


class Enrollment(Base):
    """
    Enrollment model representing student course enrollments

    Attributes:
        id: UUID primary key
        student_id: Foreign key to User (student)
        course_id: Foreign key to Course
        enrollment_date: When student enrolled
        completion_percentage: Progress through course (0-100)
        is_completed: Whether student completed course (100%)
        completion_date: When student completed course
        unenrollment_date: When student unenrolled (soft delete)
        is_active: Whether enrollment is currently active
        created_at: Record creation timestamp
        updated_at: Record last update timestamp
        deleted_at: Soft deletion timestamp
    """

    __tablename__ = "enrollments"

    # Foreign keys
    student_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id: Mapped[UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Enrollment metadata
    enrollment_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )

    # Progress tracking
    completion_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )
    is_completed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    completion_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Unenrollment support (soft delete)
    unenrollment_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    # Relationships
    student: Mapped["User"] = relationship(
        "User",
        foreign_keys=[student_id],
        back_populates="enrollments",
    )
    course: Mapped["Course"] = relationship(
        "Course",
        foreign_keys=[course_id],
        back_populates="enrollments",
    )

    # Table constraints
    __table_args__ = (
        # Unique constraint: one active enrollment per student per course
        UniqueConstraint(
            "student_id",
            "course_id",
            name="uq_student_course_enrollment",
        ),
        # Index for common queries
        {"extend_existing": True},
    )

    def __repr__(self) -> str:
        return (
            f"<Enrollment(id={self.id}, "
            f"student_id={self.student_id}, "
            f"course_id={self.course_id}, "
            f"completion={self.completion_percentage}%, "
            f"active={self.is_active})>"
        )
