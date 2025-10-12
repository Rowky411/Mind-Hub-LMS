"""
Celery configuration for background task processing.

Handles asynchronous tasks like video processing, email sending, and certificate generation.
"""
from celery import Celery

from src.core.config import settings


# Create Celery application
celery_app = Celery(
    "mind_hub",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)


# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3300,  # 55 minutes soft limit
    worker_prefetch_multiplier=1,  # One task at a time per worker
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks
)


# Task routing configuration
celery_app.conf.task_routes = {
    "src.tasks.email.*": {"queue": "email"},
    "src.tasks.video.*": {"queue": "video"},
    "src.tasks.certificates.*": {"queue": "certificates"},
}


# Auto-discover tasks
celery_app.autodiscover_tasks(["src.tasks"])


# Example task (remove in production)
@celery_app.task(name="test_task")
def test_task(x: int, y: int) -> int:
    """
    Test task for Celery verification.

    Args:
        x: First number
        y: Second number

    Returns:
        int: Sum of x and y
    """
    return x + y


if __name__ == "__main__":
    celery_app.start()
