"""Scan endpoints."""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.scan import Scan, ScanEvent
from app.schemas.scan import ScanResponse, ScanStatusResponse, ScanEventResponse

router = APIRouter()


@router.get("/scans/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    scan = await db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return scan


@router.get("/scans/{scan_id}/status", response_model=ScanStatusResponse)
async def get_scan_status(scan_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Poll scan status and events. Use this for live progress updates.
    Returns actual events recorded during scan execution.
    """
    scan = await db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")

    event_q = (
        select(ScanEvent)
        .where(ScanEvent.scan_id == scan_id)
        .order_by(ScanEvent.created_at)
    )
    result = await db.execute(event_q)
    events = result.scalars().all()

    last_stage = events[-1].stage if events else None

    return ScanStatusResponse(
        scan_id=scan.id,
        status=scan.status,
        progress_stage=last_stage,
        total_findings=scan.total_findings,
        error_message=scan.error_message,
        events=list(events),
    )
