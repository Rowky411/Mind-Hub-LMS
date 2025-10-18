"""
Content service for Mind Hub LMS.

Business logic for content upload and management operations.
"""
import os
import aiofiles
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from fastapi import UploadFile

from src.models.content_item import ContentItem, ContentType
from src.models.course import Course
from src.schemas.content_item import ContentItemCreate
from src.core.exceptions import AppException
from src.core.logging import get_logger
from src.core.config import settings

logger = get_logger(__name__)


class ContentService:
    """Service for content operations."""

    # File type whitelist
    ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo"}
    ALLOWED_DOCUMENT_TYPES = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
    ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi"}
    ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx"}

    MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024  # 2GB in bytes

    def __init__(self, db: AsyncSession):
        """
        Initialize content service.

        Args:
            db: Database session
        """
        self.db = db

    async def upload_content(
        self,
        file: UploadFile,
        content_data: ContentItemCreate,
        course_id: str,
        user_id: str
    ) -> ContentItem:
        """
        Upload and create content item.

        Args:
            file: Uploaded file
            content_data: Content metadata
            course_id: Course ID
            user_id: User ID performing the upload

        Returns:
            ContentItem: Created content item

        Raises:
            AppException: If validation fails or upload errors
        """
        # Verify course exists and user has permission
        result = await self.db.execute(
            select(Course).where(Course.id == course_id)
        )
        course = result.scalar_one_or_none()

        if not course:
            raise AppException(
                status_code=404,
                message="Course not found",
                details={"course_id": course_id}
            )

        if course.instructor_id != user_id:
            raise AppException(
                status_code=403,
                message="Not authorized to upload content to this course"
            )

        # Validate file
        await self._validate_file(file, content_data.content_type)

        # Save file
        file_path, file_size = await self._save_file(file, course_id)

        # Create content item
        content_item = ContentItem(
            course_id=course_id,
            module_id=content_data.module_id,
            title=content_data.title,
            description=content_data.description,
            content_type=content_data.content_type,
            file_url=file_path,
            file_size=file_size,
            mime_type=file.content_type,
            text_content=content_data.text_content,
            duration_seconds=content_data.duration_seconds,
            order_index=content_data.order_index,
            is_required=content_data.is_required
        )

        # Validate content
        is_valid, error_msg = content_item.validate_content()
        if not is_valid:
            raise AppException(
                status_code=400,
                message="Content validation failed",
                details={"error": error_msg}
            )

        self.db.add(content_item)
        await self.db.commit()
        await self.db.refresh(content_item)

        logger.info(
            f"Content uploaded: {content_item.id}",
            extra={
                "content_id": content_item.id,
                "course_id": course_id,
                "type": content_data.content_type.value
            }
        )

        return content_item

    async def get_content_by_id(
        self,
        content_id: str,
        include_deleted: bool = False
    ) -> Optional[ContentItem]:
        """
        Get content item by ID.

        Args:
            content_id: Content item ID
            include_deleted: Whether to include soft-deleted items

        Returns:
            ContentItem or None if not found
        """
        query = select(ContentItem).where(ContentItem.id == content_id)

        if not include_deleted:
            query = query.where(ContentItem.deleted_at.is_(None))

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def delete_content(
        self,
        content_id: str,
        user_id: str
    ) -> None:
        """
        Soft delete a content item.

        Args:
            content_id: Content item ID to delete
            user_id: User ID performing the deletion

        Raises:
            AppException: If content not found or user not authorized
        """
        content = await self.get_content_by_id(content_id)

        if not content:
            raise AppException(
                status_code=404,
                message="Content item not found"
            )

        # Verify authorization
        result = await self.db.execute(
            select(Course).where(Course.id == content.course_id)
        )
        course = result.scalar_one_or_none()

        if not course or course.instructor_id != user_id:
            raise AppException(
                status_code=403,
                message="Not authorized to delete this content"
            )

        # Soft delete
        from datetime import datetime
        content.deleted_at = datetime.utcnow()

        await self.db.commit()

        logger.info(
            f"Content deleted: {content_id}",
            extra={"content_id": content_id, "deleted_by": user_id}
        )

    async def _validate_file(
        self,
        file: UploadFile,
        content_type: ContentType
    ) -> None:
        """
        Validate uploaded file.

        Args:
            file: Uploaded file
            content_type: Expected content type

        Raises:
            AppException: If file validation fails
        """
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning

        if file_size > self.MAX_FILE_SIZE:
            raise AppException(
                status_code=400,
                message="File size exceeds 2GB limit",
                details={"size_bytes": file_size, "max_bytes": self.MAX_FILE_SIZE}
            )

        # Check file extension and MIME type
        file_ext = Path(file.filename).suffix.lower()

        if content_type == ContentType.VIDEO:
            if file_ext not in self.ALLOWED_VIDEO_EXTENSIONS:
                raise AppException(
                    status_code=400,
                    message="Invalid video file extension",
                    details={
                        "extension": file_ext,
                        "allowed": list(self.ALLOWED_VIDEO_EXTENSIONS)
                    }
                )
            if file.content_type not in self.ALLOWED_VIDEO_TYPES:
                raise AppException(
                    status_code=400,
                    message="Invalid video MIME type",
                    details={
                        "mime_type": file.content_type,
                        "allowed": list(self.ALLOWED_VIDEO_TYPES)
                    }
                )

        elif content_type == ContentType.DOCUMENT:
            if file_ext not in self.ALLOWED_DOCUMENT_EXTENSIONS:
                raise AppException(
                    status_code=400,
                    message="Invalid document file extension",
                    details={
                        "extension": file_ext,
                        "allowed": list(self.ALLOWED_DOCUMENT_EXTENSIONS)
                    }
                )
            if file.content_type not in self.ALLOWED_DOCUMENT_TYPES:
                raise AppException(
                    status_code=400,
                    message="Invalid document MIME type",
                    details={
                        "mime_type": file.content_type,
                        "allowed": list(self.ALLOWED_DOCUMENT_TYPES)
                    }
                )

    async def _save_file(
        self,
        file: UploadFile,
        course_id: str
    ) -> tuple[str, int]:
        """
        Save uploaded file to storage.

        Args:
            file: Uploaded file
            course_id: Course ID for organization

        Returns:
            tuple: (file_path, file_size)
        """
        # Determine storage directory based on content type
        if "video" in file.content_type:
            storage_dir = Path("storage/videos") / course_id
        else:
            storage_dir = Path("storage/documents") / course_id

        # Create directory if it doesn't exist
        storage_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        import uuid
        file_ext = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = storage_dir / unique_filename

        # Save file
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)

        file_size = len(content)

        logger.info(
            f"File saved: {file_path}",
            extra={"file_path": str(file_path), "size_bytes": file_size}
        )

        return str(file_path), file_size

    def generate_signed_url(
        self,
        file_path: str,
        expiration_seconds: int = 3600
    ) -> str:
        """
        Generate signed URL for content access.

        Args:
            file_path: Path to content file
            expiration_seconds: URL expiration time

        Returns:
            str: Signed URL

        Note:
            For MVP with local storage, this returns the file path.
            In production with cloud storage (S3, Azure Blob), this would
            generate a pre-signed URL.
        """
        # For local storage, return relative path
        # In production, generate pre-signed URL from cloud storage
        return f"/content/files/{file_path}"
