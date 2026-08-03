"""
FastAPI application entry point.

Configures and initializes the FastAPI application with all routes,
middleware, and dependencies.
"""
import asyncio
import sys

# ── Windows event-loop fix for psycopg async ──────────────────────────
# psycopg (v3) cannot run in async mode on Windows' default
# ProactorEventLoop.  Switch to SelectorEventLoop BEFORE any async
# engine / connection is created.  This is harmless on Linux / macOS
# (where SelectorEventLoop is already the default).
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.middleware.logging import LoggingMiddleware
from app.utils.logger import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Handles startup and shutdown events.
    """
    # Startup
    setup_logging()
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"Environment: {settings.APP_ENV}")
    print(f"Debug mode: {settings.APP_DEBUG}")

    # Create database tables asynchronously in background to ensure fast server cold start.
    from app.db.session import init_db

    async def _bg_init():
        try:
            await init_db()
            print("Database tables initialized successfully in background.")
        except Exception as e:
            print(f"WARNING: Database initialization skipped or failed: {e}")

    asyncio.create_task(_bg_init())

    yield

    # Shutdown
    print("Shutting down application...")
    # TODO: Close database connections
    # TODO: Close Redis connection
    # TODO: Cleanup other resources


def create_application() -> FastAPI:
    """
    Create and configure FastAPI application.

    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Aarambh AI - Adaptive Learning Platform Backend API",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Add custom logging middleware first so that CORS (added last) wraps it as
    # the OUTERMOST middleware. Starlette runs the most-recently-added middleware
    # first, so CORS must be added last to guarantee it handles the preflight
    # OPTIONS request (and stamps CORS headers on every response, including auth
    # errors) before any custom middleware can intercept it.
    app.add_middleware(LoggingMiddleware)

    # Add CORS middleware (outermost).
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=settings.CORS_ORIGIN_REGEX,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )

    # Include API routers
    app.include_router(api_router, prefix="/api/v1")

    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        import traceback
        print(f"UNHANDLED EXCEPTION on {request.method} {request.url}: {exc}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(exc)}"}
        )

    # Root endpoint
    @app.get("/")
    async def root() -> dict[str, str]:
        """Root endpoint with API information."""
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "running",
            "docs": "/docs",
        }

    # Health check endpoint
    @app.get("/health")
    async def health() -> dict[str, str]:
        """Health check endpoint."""
        return {"status": "healthy"}

    return app


# Create application instance
app = create_application()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.APP_DEBUG,
        workers=settings.WORKERS if not settings.APP_DEBUG else 1,
    )
