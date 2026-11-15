"""Pydantic schemas for Scan."""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ScanCreate(BaseModel):
    scanners: List[str] = Field(
        default_factory=list,
        description="Scanner IDs to run. Empty = run all available.",
    )
    ai_investigation: bool = Field(
        default=False,
        description="Whether to run AI-assisted investigation (requires LLM provider).",
    )


class ScanEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    scan_id: uuid.UUID
    stage: str
    message: str
    level: str
    extra: Optional[dict]
    created_at: datetime


class ScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    status: str
    scanners_requested: list
    scanners_available: list
    scanners_run: list
    scanners_failed: list
    ai_investigation: bool
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    dependency_alerts: int
    secret_detections: int
    error_message: Optional[str]
    languages_detected: list
    manifests_detected: list
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime


class ScanStatusResponse(BaseModel):
    scan_id: uuid.UUID
    status: str
    progress_stage: Optional[str]
    total_findings: int
    error_message: Optional[str]
    events: List[ScanEventResponse]
