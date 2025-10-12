"""
Middleware components for request processing.

Includes rate limiting, CORS handling, and request/response logging.
"""
import time
from collections import defaultdict
from typing import Callable, Dict, Tuple

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent abuse of authentication endpoints.

    Implements a simple in-memory rate limiter based on IP address.
    For production, consider using Redis for distributed rate limiting.
    """

    def __init__(
        self,
        app,
        max_requests: int = 5,
        window_seconds: int = 900,  # 15 minutes
        paths: list[str] | None = None,
    ):
        """
        Initialize rate limiter.

        Args:
            app: FastAPI application instance
            max_requests: Maximum number of requests allowed in the time window
            window_seconds: Time window in seconds (default: 900 = 15 minutes)
            paths: List of path prefixes to apply rate limiting to (default: ["/api/v1/auth"])
        """
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.paths = paths or ["/api/v1/auth"]

        # In-memory storage: {ip_address: [(timestamp, count), ...]}
        # Each entry is a tuple of (timestamp, remaining_requests)
        self.request_counts: Dict[str, list[Tuple[float, int]]] = defaultdict(list)

    def _should_rate_limit(self, path: str) -> bool:
        """Check if the request path should be rate limited."""
        return any(path.startswith(prefix) for prefix in self.paths)

    def _clean_old_requests(self, ip: str, current_time: float) -> None:
        """Remove request records outside the current time window."""
        cutoff_time = current_time - self.window_seconds
        self.request_counts[ip] = [
            (ts, count) for ts, count in self.request_counts[ip] if ts > cutoff_time
        ]

    def _get_request_count(self, ip: str, current_time: float) -> int:
        """Get the number of requests made by this IP in the current window."""
        self._clean_old_requests(ip, current_time)
        return sum(count for _, count in self.request_counts[ip])

    def _add_request(self, ip: str, current_time: float) -> None:
        """Record a new request from this IP."""
        self.request_counts[ip].append((current_time, 1))

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process the request and apply rate limiting.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware or route handler

        Returns:
            Response from the route handler or a 429 Too Many Requests response
        """
        # Only apply rate limiting to specified paths
        if not self._should_rate_limit(request.url.path):
            return await call_next(request)

        # Get client IP address
        # Check X-Forwarded-For header first (for proxied requests)
        client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        if not client_ip:
            client_ip = request.client.host if request.client else "unknown"

        current_time = time.time()

        # Check rate limit
        request_count = self._get_request_count(client_ip, current_time)

        if request_count >= self.max_requests:
            # Rate limit exceeded
            # Note: CORS middleware runs before this, so headers should already be set
            headers = {
                "Retry-After": str(self.window_seconds),
                "X-RateLimit-Limit": str(self.max_requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(current_time + self.window_seconds)),
            }

            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "retry_after": self.window_seconds,
                },
                headers=headers,
            )

        # Record this request
        self._add_request(client_ip, current_time)

        # Process the request
        response = await call_next(request)

        # Add rate limit headers to response
        remaining = self.max_requests - self._get_request_count(client_ip, current_time)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(
            int(current_time + self.window_seconds)
        )

        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging request and response information.

    Logs request method, path, status code, and processing time.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Log request details and processing time.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware or route handler

        Returns:
            Response from the route handler
        """
        start_time = time.time()

        # Process request
        response = await call_next(request)

        # Calculate processing time
        process_time = time.time() - start_time

        # Add processing time header
        response.headers["X-Process-Time"] = f"{process_time:.4f}"

        # Log request info (could be extended to use proper logging)
        print(
            f"{request.method} {request.url.path} "
            f"- {response.status_code} - {process_time:.4f}s"
        )

        return response
