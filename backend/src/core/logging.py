"""
Structured JSON logging configuration with correlation IDs.

Provides consistent logging format across the application for observability.
"""
import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict
import uuid

from src.core.config import settings


class JSONFormatter(logging.Formatter):
    """Format log records as JSON with structured data."""

    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record as JSON string.

        Args:
            record: Log record to format

        Returns:
            str: JSON-formatted log message
        """
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add correlation ID if present
        if hasattr(record, "correlation_id"):
            log_data["correlation_id"] = record.correlation_id

        # Add user ID if present
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, "extra_data"):
            log_data["extra"] = record.extra_data

        return json.dumps(log_data)


def setup_logging() -> None:
    """Configure application logging with JSON formatter."""
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    root_logger.addHandler(handler)

    # Reduce noise from third-party loggers
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for the given module.

    Args:
        name: Logger name (usually __name__)

    Returns:
        logging.Logger: Configured logger instance
    """
    return logging.getLogger(name)


class CorrelationIDFilter(logging.Filter):
    """Add correlation ID to log records for request tracing."""

    def filter(self, record: logging.LogRecord) -> bool:
        """
        Add correlation ID to record if not present.

        Args:
            record: Log record to filter

        Returns:
            bool: Always True (don't filter out records)
        """
        if not hasattr(record, "correlation_id"):
            record.correlation_id = str(uuid.uuid4())
        return True
