"""
API router registration for Mind Hub LMS.

Aggregates all endpoint routers and provides versioned API structure.
"""
from fastapi import APIRouter

# Create main API router
api_router = APIRouter()

# Import routers
from src.api.auth import router as auth_router
from src.api.courses import router as courses_router
from src.api.content import router as content_router
from src.api.modules import router as modules_router

# TODO: Import additional routers as they are implemented
# from src.api.enrollments import router as enrollments_router
# from src.api.progress import router as progress_router
# from src.api.assignments import router as assignments_router
# from src.api.certificates import router as certificates_router
# from src.api.users import router as users_router

# Include routers
api_router.include_router(auth_router)
api_router.include_router(courses_router)
api_router.include_router(content_router)
api_router.include_router(modules_router)

# TODO: Include additional routers with appropriate prefixes and tags
# api_router.include_router(users_router, prefix="/users", tags=["Users"])
# api_router.include_router(courses_router, prefix="/courses", tags=["Courses"])
# api_router.include_router(lessons_router, prefix="/lessons", tags=["Lessons"])
# api_router.include_router(enrollments_router, prefix="/enrollments", tags=["Enrollments"])
# api_router.include_router(progress_router, prefix="/progress", tags=["Progress"])
# api_router.include_router(assignments_router, prefix="/assignments", tags=["Assignments"])
# api_router.include_router(certificates_router, prefix="/certificates", tags=["Certificates"])


@api_router.get("/")
async def api_root() -> dict:
    """
    API root endpoint.

    Returns:
        dict: API metadata and version information
    """
    return {
        "message": "Mind Hub LMS API",
        "version": "v1",
        "documentation": "/docs",
        "status": "operational",
    }
