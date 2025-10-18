"""
Module model for Mind Hub LMS.

Represents organizational grouping of content items within a course.
"""
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from src.models.base import Base

if TYPE_CHECKING:
    from src.models.course import Course
    from src.models.content_item import ContentItem


class Module(Base):
    """
    Module entity for organizing course content.

    Attributes:
        course_id: Foreign key to Course
        title: Module title
        description: Optional module description
        order_index: Position within course (for ordering)
    """
    __tablename__ = "modules"

    course_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="modules")
    content_items: Mapped[list["ContentItem"]] = relationship(
        "ContentItem",
        back_populates="module",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation of Module."""
        return f"<Module(id={self.id}, title={self.title}, order_index={self.order_index})>"
