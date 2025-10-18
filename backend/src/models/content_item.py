"""
ContentItem model for Mind Hub LMS.

Represents individual learning materials within a course.
"""
from enum import Enum as PyEnum
from sqlalchemy import String, Integer, BigInteger, Boolean, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from src.models.base import Base

if TYPE_CHECKING:
    from src.models.course import Course
    from src.models.module import Module


class ContentType(str, PyEnum):
    """Content type enumeration."""
    VIDEO = "video"
    DOCUMENT = "document"
    TEXT = "text"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"


class ContentItem(Base):
    """
    ContentItem entity representing individual learning materials.

    Attributes:
        course_id: Foreign key to Course
        module_id: Optional foreign key to Module (for organization)
        title: Content item title
        description: Optional content description
        content_type: Type of content (video, document, text, quiz, assignment)
        file_url: Path to uploaded file (for video/document types)
        file_size: File size in bytes
        mime_type: MIME type of uploaded file
        text_content: Text content (for text type)
        duration_seconds: Duration in seconds (for video type)
        order_index: Position within module or course
        is_required: Whether content counts toward completion
    """
    __tablename__ = "content_items"

    course_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    module_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("modules.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    content_type: Mapped[ContentType] = mapped_column(
        Enum(ContentType, name="content_type", native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        index=True
    )
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_size: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    text_content: Mapped[str | None] = mapped_column(String, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="content_items")
    module: Mapped["Module | None"] = relationship("Module", back_populates="content_items")

    def __repr__(self) -> str:
        """String representation of ContentItem."""
        return f"<ContentItem(id={self.id}, title={self.title}, type={self.content_type.value})>"

    @property
    def is_file_based(self) -> bool:
        """Check if content requires a file upload."""
        return self.content_type in [ContentType.VIDEO, ContentType.DOCUMENT]

    @property
    def is_text_based(self) -> bool:
        """Check if content is text-based."""
        return self.content_type == ContentType.TEXT

    def validate_content(self) -> tuple[bool, str | None]:
        """
        Validate content item has required fields based on type.

        Returns:
            tuple: (is_valid, error_message)
        """
        if self.is_file_based and not self.file_url:
            return False, f"{self.content_type.value} content requires file_url"

        if self.is_text_based and not self.text_content:
            return False, "Text content requires text_content field"

        if self.file_size and self.file_size > 2147483648:  # 2GB in bytes
            return False, "File size exceeds 2GB limit"

        return True, None
