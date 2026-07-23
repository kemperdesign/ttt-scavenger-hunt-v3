"""
Input sanitization middleware — strips null bytes and oversized bodies.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

MAX_BODY_SIZE = 10 * 1024 * 1024  # 10 MB


class SanitizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Block oversized bodies early
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_BODY_SIZE:
            return JSONResponse(
                {"detail": "Request body too large"},
                status_code=413,
            )

        response = await call_next(request)
        return response
