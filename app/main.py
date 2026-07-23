"""
St. Augustine TimeQuest — FastAPI Application Factory

Wires together all routers, middleware, and startup/shutdown hooks.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Routers
from app.api import (
    auth,
    adventures,
    stops,
    challenges,
    sessions as game_sessions,
    teams,
    characters,
    badges,
    submissions,
    account,
    gps_checkin,
    admin_audit,
)

# Middleware
from app.middleware.rate_limit import setup_rate_limiting
from app.middleware.sanitize import SanitizeMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    yield
    # Shutdown — close DB connections etc.
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="St. Augustine TimeQuest API",
        description="Backend for the TimeQuest location-based adventure PWA",
        version="1.0.0",
        docs_url="/api/docs" if settings.DEBUG else None,
        redoc_url="/api/redoc" if settings.DEBUG else None,
        openapi_url="/api/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Security headers ──────────────────────────────────────────────────────
    app.add_middleware(SecurityHeadersMiddleware)

    # ── Input sanitization ────────────────────────────────────────────────────
    app.add_middleware(SanitizeMiddleware)

    # ── Rate limiting (slowapi) ───────────────────────────────────────────────
    setup_rate_limiting(app)

    # ── Routers ───────────────────────────────────────────────────────────────
    API_PREFIX = "/api/v1"

    app.include_router(auth.router,         prefix=f"{API_PREFIX}/auth",        tags=["auth"])
    app.include_router(adventures.router,   prefix=f"{API_PREFIX}/adventures",  tags=["adventures"])
    app.include_router(stops.router,        prefix=f"{API_PREFIX}/stops",       tags=["stops"])
    app.include_router(challenges.router,   prefix=f"{API_PREFIX}/challenges",  tags=["challenges"])
    app.include_router(game_sessions.router,prefix=f"{API_PREFIX}/sessions",    tags=["sessions"])
    app.include_router(teams.router,        prefix=f"{API_PREFIX}/teams",       tags=["teams"])
    app.include_router(characters.router,   prefix=f"{API_PREFIX}/characters",  tags=["ai-characters"])
    app.include_router(badges.router,       prefix=f"{API_PREFIX}/badges",      tags=["badges"])
    app.include_router(submissions.router,  prefix=f"{API_PREFIX}/submissions", tags=["submissions"])
    app.include_router(account.router,      prefix=f"{API_PREFIX}/account",     tags=["account"])
    app.include_router(gps_checkin.router,  prefix=f"{API_PREFIX}/gps",         tags=["gps"])
    app.include_router(admin_audit.router,  prefix=f"{API_PREFIX}/admin/audit", tags=["admin"])

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/api/health", tags=["health"])
    async def health():
        return {"status": "ok", "version": "1.0.0"}

    return app


app = create_app()
