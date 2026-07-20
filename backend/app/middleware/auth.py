"""
Authentication middleware.

Provides middleware for JWT token validation and user authentication.
Note: Business logic not implemented yet - structure only.
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Authentication middleware.

    Validates JWT tokens for protected routes.
    Can be applied globally or to specific routes.
    """

    async def dispatch(self, request: Request, call_next):
        """
        Process request and validate authentication.

        TODO: Implement authentication middleware
        - Extract token from Authorization header
        - Validate token
        - Attach user to request state
        - Handle invalid/expired tokens

        Args:
            request: Incoming request
            call_next: Next middleware/route handler

        Returns:
            Response from next handler

        Raises:
            HTTPException: If authentication fails
        """
        # Skip authentication for public routes
        if request.url.path in ["/api/v1/health/", "/api/v1/auth/login", "/api/v1/auth/register"]:
            return await call_next(request)

        # TODO: Implement token validation
        # For now, just pass through
        return await call_next(request)
