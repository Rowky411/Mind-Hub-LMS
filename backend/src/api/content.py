"""
Content API endpoints.

Handles content upload, retrieval, and management.
"""
from fastapi import APIRouter, Depends, status, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from src.core.database import get_session
from src.core.dependencies import get_current_user
from src.models.user import User
from src.models.content_item import ContentType
from src.schemas.content_item import (
    ContentItemCreate,
    ContentItemResponse,
    ContentItemUploadResponse
)
from src.services.content_service import ContentService
from src.core.exceptions import AppException

router = APIRouter(prefix="/content", tags=["Content"])


@router.post(
    "",
    response_model=ContentItemUploadResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_content(
    file: UploadFile = File(...),
    course_id: str = Form(...),
    title: str = Form(...),
    content_type: ContentType = Form(...),
    order_index: int = Form(...),
    description: Optional[str] = Form(None),
    module_id: Optional[str] = Form(None),
    text_content: Optional[str] = Form(None),
    duration_seconds: Optional[int] = Form(None),
    is_required: bool = Form(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Upload content item (video or document).

    Requires instructor or admin role and course ownership.

    Args:
        file: Uploaded file
        course_id: Course ID
        title: Content title
        content_type: Type of content
        order_index: Position in course/module
        description: Optional description
        module_id: Optional module ID
        text_content: Text content (for TEXT type)
        duration_seconds: Duration (for VIDEO type)
        is_required: Whether content is required
        current_user: Authenticated user
        db: Database session

    Returns:
        ContentItemUploadResponse: Created content item

    Raises:
        403: User not authorized
        400: Invalid file or validation error
    """
    # Build content data
    content_data = ContentItemCreate(
        course_id=course_id,
        module_id=module_id,
        title=title,
        description=description,
        content_type=content_type,
        text_content=text_content,
        duration_seconds=duration_seconds,
        order_index=order_index,
        is_required=is_required
    )

    service = ContentService(db)
    content_item = await service.upload_content(
        file=file,
        content_data=content_data,
        course_id=course_id,
        user_id=current_user.id
    )

    return ContentItemUploadResponse(
        content_item=ContentItemResponse.model_validate(content_item),
        upload_url=None  # For local storage, no pre-signed URL needed
    )


@router.get("/{content_id}", response_model=ContentItemResponse)
async def get_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get content item by ID.

    Requires enrollment in the course (will be enforced in Phase 5).
    For now, requires authentication.

    Args:
        content_id: Content item ID
        current_user: Authenticated user
        db: Database session

    Returns:
        ContentItemResponse: Content item details

    Raises:
        404: Content not found
    """
    service = ContentService(db)
    content = await service.get_content_by_id(content_id)

    if not content:
        raise AppException(
            status_code=404,
            message="Content not found",
            details={"content_id": content_id}
        )

    # TODO: In Phase 5 (Enrollment), add enrollment check here
    # For now, just return the content

    return ContentItemResponse.model_validate(content)


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Delete a content item (soft delete).

    Requires course ownership or admin role.

    Args:
        content_id: Content item ID
        current_user: Authenticated user
        db: Database session

    Raises:
        404: Content not found
        403: Not authorized
    """
    service = ContentService(db)
    await service.delete_content(content_id, current_user.id)

    return None
