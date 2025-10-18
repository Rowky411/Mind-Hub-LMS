"""
Module service for Mind Hub LMS.

Business logic for course module management operations.
"""
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from uuid import UUID

from src.models.module import Module
from src.models.course import Course
from src.models.user import User
from src.schemas.module import ModuleCreate, ModuleUpdate
from src.core.exceptions import AppException
from src.core.logging import get_logger

logger = get_logger(__name__)


class ModuleService:
    """Service for module operations."""

    def __init__(self, db: AsyncSession):
        """
        Initialize module service.

        Args:
            db: Database session
        """
        self.db = db

    async def create_module(
        self,
        module_data: ModuleCreate,
        user_id: str
    ) -> Module:
        """
        Create a new module.

        Args:
            module_data: Module creation data
            user_id: ID of the user creating the module

        Returns:
            Module: Created module

        Raises:
            AppException: If course not found or user not authorized
        """
        # Verify course exists
        result = await self.db.execute(
            select(Course).where(Course.id == module_data.course_id)
        )
        course = result.scalar_one_or_none()

        if not course:
            raise AppException(
                status_code=404,
                message="Course not found",
                details={"course_id": module_data.course_id}
            )

        # Verify user has permission to modify this course
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise AppException(
                status_code=404,
                message="User not found",
                details={"user_id": user_id}
            )

        # Check if user is the instructor or an admin
        if course.instructor_id != user_id and not user.is_admin():
            raise AppException(
                status_code=403,
                message="You do not have permission to modify this course",
                details={"course_id": module_data.course_id}
            )

        # Create module
        module = Module(
            **module_data.model_dump()
        )

        self.db.add(module)
        await self.db.commit()
        await self.db.refresh(module)

        logger.info(
            f"Module created: {module.id}",
            extra={
                "module_id": module.id,
                "course_id": module_data.course_id,
                "title": module.title
            }
        )

        return module

    async def get_module_by_id(
        self,
        module_id: str
    ) -> Optional[Module]:
        """
        Get module by ID.

        Args:
            module_id: Module ID

        Returns:
            Module if found, None otherwise
        """
        result = await self.db.execute(
            select(Module).where(Module.id == module_id)
        )
        return result.scalar_one_or_none()

    async def get_course_modules(
        self,
        course_id: str
    ) -> List[Module]:
        """
        Get all modules for a course, ordered by order_index.

        Args:
            course_id: Course ID

        Returns:
            List of modules
        """
        result = await self.db.execute(
            select(Module)
            .where(Module.course_id == course_id)
            .order_by(Module.order_index)
        )
        return list(result.scalars().all())

    async def update_module(
        self,
        module_id: str,
        module_data: ModuleUpdate,
        user_id: str
    ) -> Module:
        """
        Update an existing module.

        Args:
            module_id: Module ID
            module_data: Updated module data
            user_id: ID of user performing update

        Returns:
            Updated module

        Raises:
            AppException: If module not found or user not authorized
        """
        # Get module
        module = await self.get_module_by_id(module_id)
        if not module:
            raise AppException(
                status_code=404,
                message="Module not found",
                details={"module_id": module_id}
            )

        # Get course to check ownership
        result = await self.db.execute(
            select(Course).where(Course.id == module.course_id)
        )
        course = result.scalar_one_or_none()

        if not course:
            raise AppException(
                status_code=404,
                message="Course not found",
                details={"course_id": module.course_id}
            )

        # Verify user has permission
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise AppException(
                status_code=404,
                message="User not found",
                details={"user_id": user_id}
            )

        if course.instructor_id != user_id and not user.is_admin():
            raise AppException(
                status_code=403,
                message="You do not have permission to modify this module",
                details={"module_id": module_id}
            )

        # Update module fields
        update_dict = module_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(module, key, value)

        await self.db.commit()
        await self.db.refresh(module)

        logger.info(
            f"Module updated: {module.id}",
            extra={"module_id": module.id, "updated_fields": list(update_dict.keys())}
        )

        return module

    async def delete_module(
        self,
        module_id: str,
        user_id: str
    ) -> None:
        """
        Delete a module.

        Args:
            module_id: Module ID
            user_id: ID of user performing deletion

        Raises:
            AppException: If module not found or user not authorized
        """
        # Get module
        module = await self.get_module_by_id(module_id)
        if not module:
            raise AppException(
                status_code=404,
                message="Module not found",
                details={"module_id": module_id}
            )

        # Get course to check ownership
        result = await self.db.execute(
            select(Course).where(Course.id == module.course_id)
        )
        course = result.scalar_one_or_none()

        if not course:
            raise AppException(
                status_code=404,
                message="Course not found",
                details={"course_id": module.course_id}
            )

        # Verify user has permission
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise AppException(
                status_code=404,
                message="User not found",
                details={"user_id": user_id}
            )

        if course.instructor_id != user_id and not user.is_admin():
            raise AppException(
                status_code=403,
                message="You do not have permission to delete this module",
                details={"module_id": module_id}
            )

        # Delete module (hard delete for now, can implement soft delete later)
        await self.db.delete(module)
        await self.db.commit()

        logger.info(
            f"Module deleted: {module_id}",
            extra={"module_id": module_id, "course_id": module.course_id}
        )
