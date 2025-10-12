"""
FastAPI application factory for Mind Hub LMS.

Entry point for the backend API with middleware and exception handlers.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from src.core.config import settings
from src.core.exceptions import AppException, create_error_response
from src.core.logging import setup_logging, get_logger
from src.core.database import init_db, close_db
from src.core.middleware import RateLimitMiddleware, RequestLoggingMiddleware
from src.api import api_router


# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Application lifespan events.

    Handles startup and shutdown tasks.
    """
    # Startup
    logger.info("Starting Mind Hub LMS backend...")
    if settings.DEBUG:
        logger.info("Debug mode enabled")
        # await init_db()  # Uncomment for dev, use Alembic in production
    logger.info("Application started successfully")

    yield

    # Shutdown
    logger.info("Shutting down application...")
    await close_db()
    logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Mind Hub LMS API",
    description="Learning Management System Backend API",
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware (for auth endpoints)
app.add_middleware(
    RateLimitMiddleware,
    max_requests=100,  # Increased for development
    window_seconds=900,  # 15 minutes
    paths=["/api/v1/auth"],
)

# Request logging middleware
if settings.DEBUG:
    app.add_middleware(RequestLoggingMiddleware)


# Exception handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application-specific exceptions."""
    logger.error(
        f"Application error: {exc.message}",
        extra={"status_code": exc.status_code, "details": exc.details},
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(
            code=exc.__class__.__name__.upper(),
            message=exc.message,
            details=exc.details,
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    errors = exc.errors()
    logger.warning(f"Validation error: {errors}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=create_error_response(
            code="VALIDATION_ERROR",
            message="Request validation failed",
            details={"errors": errors},
        ),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.exception("Unexpected error occurred", exc_info=exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=create_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred",
        ),
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """
    Health check endpoint.

    Returns:
        dict: Application health status
    """
    return {
        "status": "healthy",
        "app": "Mind Hub LMS",
        "version": "0.1.0",
        "environment": settings.APP_ENV,
    }


# Include API routes
app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
