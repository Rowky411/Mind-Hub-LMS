"""
File storage service interface.

Provides abstraction for local filesystem storage with migration path to cloud storage.
"""
import os
import uuid
from pathlib import Path
from typing import Optional, BinaryIO
import aiofiles

from src.core.config import settings
from src.core.exceptions import ValidationError


class StorageService:
    """
    File storage service for handling uploads and retrieval.

    Supports local filesystem with clear migration path to S3/Azure Blob/GCS.
    """

    def __init__(self, storage_path: str = settings.STORAGE_PATH):
        """
        Initialize storage service.

        Args:
            storage_path: Base path for file storage
        """
        self.storage_path = Path(storage_path)
        self._ensure_directories()

    def _ensure_directories(self) -> None:
        """Ensure storage directories exist."""
        for subdir in ["videos", "documents", "avatars", "certificates"]:
            dir_path = self.storage_path / subdir
            dir_path.mkdir(parents=True, exist_ok=True)

    def _validate_file_size(self, file_size: int) -> None:
        """
        Validate file size doesn't exceed maximum.

        Args:
            file_size: File size in bytes

        Raises:
            ValidationError: If file is too large
        """
        max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024  # Convert MB to bytes
        if file_size > max_size:
            raise ValidationError(
                f"File size exceeds maximum of {settings.MAX_FILE_SIZE_MB}MB",
                details={"max_size_mb": settings.MAX_FILE_SIZE_MB},
            )

    def _validate_file_type(self, filename: str, allowed_types: list[str]) -> None:
        """
        Validate file type against whitelist.

        Args:
            filename: Name of file being uploaded
            allowed_types: List of allowed file extensions

        Raises:
            ValidationError: If file type not allowed
        """
        file_ext = Path(filename).suffix.lower()
        if file_ext not in allowed_types:
            raise ValidationError(
                f"File type {file_ext} not allowed",
                details={"allowed_types": allowed_types},
            )

    def _generate_unique_filename(self, original_filename: str) -> str:
        """
        Generate unique filename to prevent collisions.

        Args:
            original_filename: Original filename from upload

        Returns:
            str: Unique filename with UUID prefix
        """
        file_ext = Path(original_filename).suffix
        unique_id = str(uuid.uuid4())
        return f"{unique_id}{file_ext}"

    async def save_file(
        self,
        file_data: BinaryIO,
        filename: str,
        category: str,
        allowed_types: Optional[list[str]] = None,
    ) -> tuple[str, int]:
        """
        Save uploaded file to storage.

        Args:
            file_data: Binary file data
            filename: Original filename
            category: Storage category (videos, documents, avatars, certificates)
            allowed_types: Optional list of allowed file extensions

        Returns:
            tuple[str, int]: (file_path, file_size)

        Raises:
            ValidationError: If file validation fails
        """
        # Validate file type if whitelist provided
        if allowed_types:
            self._validate_file_type(filename, allowed_types)

        # Read file data and validate size
        content = file_data.read()
        file_size = len(content)
        self._validate_file_size(file_size)

        # Generate unique filename and full path
        unique_filename = self._generate_unique_filename(filename)
        file_path = self.storage_path / category / unique_filename
        relative_path = f"{category}/{unique_filename}"

        # Save file asynchronously
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        return relative_path, file_size

    async def delete_file(self, file_path: str) -> bool:
        """
        Delete file from storage.

        Args:
            file_path: Relative path to file

        Returns:
            bool: True if deleted successfully
        """
        full_path = self.storage_path / file_path

        if full_path.exists():
            full_path.unlink()
            return True

        return False

    def get_file_url(self, file_path: str) -> str:
        """
        Get URL for accessing file.

        In local storage, this returns a relative path.
        For cloud storage, this would return a signed URL.

        Args:
            file_path: Relative path to file

        Returns:
            str: URL or path to access file
        """
        # For local development, return relative path
        # For production with cloud storage, generate signed URL
        return f"/storage/{file_path}"


# Global storage service instance
storage_service = StorageService()
