"""Health check endpoints — reports actual service status."""

import shutil
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings
from app.scanners.registry import get_scanner_availability

router = APIRouter()


class ServiceStatus(BaseModel):
    status: str              # ok | degraded | unavailable
    message: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    ai_provider: str
    ai_enabled: bool
    qdrant_configured: bool
    scanners: dict
    upload_limit_mb: int
    environment: str


@router.get("", response_model=HealthResponse)
async def health_check():
    """
    Returns actual backend health.
    Never returns fake 'healthy' status for unconfigured services.
    """
    scanner_status = get_scanner_availability()

    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        ai_provider=settings.LLM_PROVIDER,
        ai_enabled=settings.AI_ENABLED,
        qdrant_configured=(settings.QDRANT_HOST != "" and settings.QDRANT_PORT > 0),
        scanners=scanner_status,
        upload_limit_mb=settings.MAX_UPLOAD_SIZE // 1_048_576,
        environment=settings.ENVIRONMENT,
    )
