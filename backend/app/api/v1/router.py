"""Main API v1 router — aggregates all endpoint modules."""

from fastapi import APIRouter

from app.api.v1.endpoints import health, projects, scans, findings, patches

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(scans.router, prefix="", tags=["Scans"])
api_router.include_router(findings.router, prefix="", tags=["Findings"])
api_router.include_router(patches.router, prefix="/patches", tags=["Patches"])
