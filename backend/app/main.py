"""
Vibe Shield AI — FastAPI Backend
Main application entry point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import structlog

from app.core.config import settings
from app.core.logging import configure_logging
from app.database.session import engine, create_tables
from app.api.v1.router import api_router

configure_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("Starting Vibe Shield AI backend", version=settings.APP_VERSION)
    try:
        await create_tables()
        logger.info("Database tables verified")
    except Exception as e:
        logger.error("Database initialization failed", error=str(e))
    yield
    logger.info("Shutting down Vibe Shield AI backend")


app = FastAPI(
    title="Vibe Shield AI",
    description=(
        "An Agentic AI Platform for Security Analysis and Verification "
        "of AI-Generated Software. API documentation for the backend services."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Vibe Shield AI",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "health": "/api/v1/health",
    }
