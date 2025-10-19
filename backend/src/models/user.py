"""
User model for Mind Hub LMS.

Represents platform users with role-based access control (Student/Instructor/Admin).
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, Boolean, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from src.models.base import Base

if TYPE_CHECKING:
    from src.models.course import Course
    from src.models.enrollment import Enrollment


class UserRole(str, PyEnum):
    """User role enumeration."""
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"


class User(Base):
    """
    User entity representing all platform users.

    Attributes:
        email: Unique email address for authentication
        password_hash: Bcrypt hashed password
        role: User role (student, instructor, admin)
        first_name: User's first name
        last_name: User's last name
        bio: Optional biography/description
        avatar_url: Optional profile picture path
        email_verified: Whether email has been verified
        is_active: Whether user account is active (not suspended)
        last_login: Timestamp of last successful login
    """
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=UserRole.STUDENT,
        index=True
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    courses: Mapped[list["Course"]] = relationship(
        "Course",
        back_populates="instructor",
        cascade="all, delete-orphan"
    )
    enrollments: Mapped[list["Enrollment"]] = relationship(
        "Enrollment",
        foreign_keys="[Enrollment.student_id]",
        back_populates="student",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation of User."""
        return f"<User(id={self.id}, email={self.email}, role={self.role.value})>"

    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_student(self) -> bool:
        """Check if user is a student."""
        return self.role == UserRole.STUDENT

    @property
    def is_instructor(self) -> bool:
        """Check if user is an instructor."""
        return self.role == UserRole.INSTRUCTOR

    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN

    def can_teach(self) -> bool:
        """Check if user can create and manage courses."""
        return self.role in [UserRole.INSTRUCTOR, UserRole.ADMIN]

    def can_administrate(self) -> bool:
        """Check if user has admin privileges."""
        return self.role == UserRole.ADMIN
