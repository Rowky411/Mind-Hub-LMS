"""
Base SQLAlchemy model with common fields for all entities.

Provides UUID primary key, timestamps, and soft delete support.
"""
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.

    Provides:
    - UUID primary key
    - created_at timestamp
    - updated_at timestamp
    - deleted_at timestamp (soft delete support)
    """

    # Type annotation for declarative base
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        default=None,
    )

    def dict(self) -> dict[str, Any]:
        """Convert model to dictionary."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def soft_delete(self) -> None:
        """Mark record as deleted without removing from database."""
        self.deleted_at = datetime.utcnow()

    def restore(self) -> None:
        """Restore soft-deleted record."""
        self.deleted_at = None

    @property
    def is_deleted(self) -> bool:
        """Check if record is soft-deleted."""
        return self.deleted_at is not None

    def __repr__(self) -> str:
        """String representation of model."""
        return f"<{self.__class__.__name__}(id={self.id})>"
