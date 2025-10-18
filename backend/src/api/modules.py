"""
Modules API endpoints.

Handles module creation, retrieval, update, and deletion.
"""
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.core.database import get_session
from src.core.dependencies import get_current_user
from src.models.user import User
from src.schemas.module import (
    ModuleCreate,
    ModuleUpdate,
    ModuleResponse,
    ModuleWithContent
)
from src.services.module_service import ModuleService
from src.core.exceptions import AppException

router = APIRouter(prefix="/modules", tags=["Modules"])


@router.post(
    "",
    response_model=ModuleResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_module(
    module_data: ModuleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new module.

    Requires instructor or admin role and course ownership.

    Args:
        module_data: Module creation data
        current_user: Authenticated user
        db: Database session

    Returns:
        ModuleResponse: Created module

    Raises:
        403: User not authorized
        404: Course not found
    """
    service = ModuleService(db)
    module = await service.create_module(
        module_data=module_data,
        user_id=current_user.id
    )

    return ModuleResponse.model_validate(module)


@router.get(
    "",
    response_model=List[ModuleResponse]
)
async def get_course_modules(
    course_id: str = Query(..., description="Course ID to fetch modules for"),
    db: AsyncSession = Depends(get_session),
):
    """
    Get all modules for a course.

    Args:
        course_id: Course ID
        db: Database session

    Returns:
        List[ModuleResponse]: List of modules ordered by order_index
    """
    service = ModuleService(db)
    modules = await service.get_course_modules(course_id)

    return [ModuleResponse.model_validate(m) for m in modules]


@router.get(
    "/{module_id}",
    response_model=ModuleResponse
)
async def get_module(
    module_id: str,
    db: AsyncSession = Depends(get_session),
):
    """
    Get module by ID.

    Args:
        module_id: Module ID
        db: Database session

    Returns:
        ModuleResponse: Module details

    Raises:
        404: Module not found
    """
    service = ModuleService(db)
    module = await service.get_module_by_id(module_id)

    if not module:
        raise AppException(
            status_code=404,
            message="Module not found",
            details={"module_id": module_id}
        )

    return ModuleResponse.model_validate(module)


@router.put(
    "/{module_id}",
    response_model=ModuleResponse
)
async def update_module(
    module_id: str,
    module_data: ModuleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an existing module.

    Requires course ownership or admin role.

    Args:
        module_id: Module ID
        module_data: Updated module data
        current_user: Authenticated user
        db: Database session

    Returns:
        ModuleResponse: Updated module

    Raises:
        404: Module not found
        403: Not authorized
    """
    service = ModuleService(db)
    module = await service.update_module(
        module_id=module_id,
        module_data=module_data,
        user_id=current_user.id
    )

    return ModuleResponse.model_validate(module)


@router.delete(
    "/{module_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_module(
    module_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Delete a module.

    Requires course ownership or admin role.

    Args:
        module_id: Module ID
        current_user: Authenticated user
        db: Database session

    Raises:
        404: Module not found
        403: Not authorized
    """
    service = ModuleService(db)
    await service.delete_module(
        module_id=module_id,
        user_id=current_user.id
    )

    return None
