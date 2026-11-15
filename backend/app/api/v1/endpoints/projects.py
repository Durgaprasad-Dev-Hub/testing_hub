"""Project endpoints — CRUD, upload, and scan triggering."""

from __future__ import annotations

import asyncio
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.project import Project, Upload
from app.models.scan import Scan
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectListResponse,
    UploadResponse,
)
from app.schemas.scan import ScanCreate, ScanResponse
from app.services.upload_service import save_upload, extract_zip_safely
from app.services.scan_service import run_scan
from app.scanners.registry import get_scanner_availability

router = APIRouter()


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    project = Project(**payload.model_dump())
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=200),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Project)
    if search:
        q = q.where(Project.name.ilike(f"%{search}%"))
    if status:
        q = q.where(Project.status == status)

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    q = q.order_by(desc(Project.created_at)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    projects = result.scalars().all()

    return ProjectListResponse(
        items=list(projects),
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    await db.delete(project)
    await db.flush()


@router.post("/{project_id}/upload", response_model=UploadResponse, status_code=201)
async def upload_source(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a ZIP archive of source code for a project.
    The archive is extracted safely with path traversal protection.
    """
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Save the uploaded file
    project.status = "uploading"
    await db.flush()

    saved_path, file_size = await save_upload(project_id, file)

    # Extract safely
    workspace, file_count = extract_zip_safely(saved_path, project_id)

    # Record the upload
    upload = Upload(
        project_id=project_id,
        filename=saved_path.name,
        original_filename=file.filename or "upload.zip",
        file_size=file_size,
        file_path=str(saved_path),
        workspace_path=str(workspace),
        file_count=file_count,
        status="extracted",
    )
    db.add(upload)

    project.status = "uploaded"
    await db.flush()
    await db.refresh(upload)
    return upload


@router.post("/{project_id}/scan", response_model=ScanResponse, status_code=201)
async def start_scan(
    project_id: uuid.UUID,
    payload: ScanCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Start a security scan for a project.
    Requires a previously uploaded source archive.
    """
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Find the most recent extracted upload
    upload_q = (
        select(Upload)
        .where(Upload.project_id == project_id, Upload.status == "extracted")
        .order_by(desc(Upload.created_at))
        .limit(1)
    )
    result = await db.execute(upload_q)
    upload = result.scalar_one_or_none()

    if not upload or not upload.workspace_path:
        raise HTTPException(
            status_code=400,
            detail="No extracted source found for this project. Upload a ZIP first.",
        )

    # Create the scan record
    scan = Scan(
        project_id=project_id,
        upload_id=upload.id,
        status="pending",
        scanners_requested=payload.scanners,
        ai_investigation=payload.ai_investigation,
        workspace_path=upload.workspace_path,
    )
    db.add(scan)
    project.status = "scanning"
    await db.flush()
    await db.refresh(scan)

    # Run the scan in the background (not blocking the HTTP response)
    workspace_path = upload.workspace_path

    async def _bg_scan():
        """Background scan task — uses a fresh DB session."""
        from app.database.session import AsyncSessionLocal
        from pathlib import Path

        async with AsyncSessionLocal() as bg_session:
            bg_scan = await bg_session.get(Scan, scan.id)
            bg_project = await bg_session.get(Project, project_id)
            if bg_scan and bg_project:
                await run_scan(bg_session, bg_scan, Path(workspace_path), bg_project)
                await bg_session.commit()

    background_tasks.add_task(_bg_scan)

    return scan


@router.get("/{project_id}/scans", response_model=list[ScanResponse])
async def list_project_scans(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    q = select(Scan).where(Scan.project_id == project_id).order_by(desc(Scan.created_at))
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{project_id}/report")
async def get_project_report(
    project_id: uuid.UUID,
    format: str = Query("json", pattern="^(json|csv)$"),
    db: AsyncSession = Depends(get_db),
):
    """Generate a report from actual stored scan data."""
    from app.models.finding import Finding
    from sqlalchemy import and_

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Get all scans
    scan_q = select(Scan).where(Scan.project_id == project_id).order_by(desc(Scan.created_at))
    scan_result = await db.execute(scan_q)
    scans = scan_result.scalars().all()

    # Get all findings
    finding_q = (
        select(Finding)
        .where(Finding.project_id == project_id)
        .order_by(Finding.severity, Finding.created_at)
    )
    finding_result = await db.execute(finding_q)
    findings = finding_result.scalars().all()

    if format == "csv":
        import csv
        import io
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "id", "title", "severity", "category", "scanner",
            "file_path", "line_start", "rule_id", "status", "created_at",
        ])
        writer.writeheader()
        for f in findings:
            writer.writerow({
                "id": str(f.id),
                "title": f.title,
                "severity": f.severity,
                "category": f.category,
                "scanner": f.scanner,
                "file_path": f.file_path or "",
                "line_start": f.line_start or "",
                "rule_id": f.rule_id or "",
                "status": f.status,
                "created_at": f.created_at.isoformat(),
            })
        from fastapi.responses import Response
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="report_{project_id}.csv"'},
        )

    # JSON report
    report = {
        "report_type": "vibe_shield_security_report",
        "generated_by": "Vibe Shield AI",
        "disclaimer": (
            "This report reflects the findings from the scanners that were run. "
            "A clean scan is not proof of complete security. "
            "AI-generated content is clearly marked."
        ),
        "project": {
            "id": str(project.id),
            "name": project.name,
            "description": project.description,
            "status": project.status,
        },
        "scans": [
            {
                "id": str(s.id),
                "status": s.status,
                "scanners_run": s.scanners_run,
                "scanners_failed": s.scanners_failed,
                "total_findings": s.total_findings,
                "started_at": s.started_at.isoformat() if s.started_at else None,
                "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            }
            for s in scans
        ],
        "summary": {
            "total_findings": project.total_findings,
            "critical": project.critical_findings,
            "high": project.high_findings,
            "medium": project.medium_findings,
            "low": project.low_findings,
        },
        "findings": [
            {
                "id": str(f.id),
                "title": f.title,
                "severity": f.severity,
                "category": f.category,
                "scanner": f.scanner,
                "file_path": f.file_path,
                "line_start": f.line_start,
                "rule_id": f.rule_id,
                "cwe_ids": f.cwe_ids,
                "cve_ids": f.cve_ids,
                "status": f.status,
                "verification_status": f.verification_status,
                "ai_summary": f.ai_summary,
                "ai_explanation_source": f.ai_explanation_source,
                "created_at": f.created_at.isoformat(),
            }
            for f in findings
        ],
        "known_limitations": [
            "Only scanners that were installed and ran are reflected in this report.",
            "AI-generated summaries are marked with 'ai_explanation_source' and may contain errors.",
            "A finding being marked 'verified' only covers the checks that were actually performed.",
            "This report does not constitute a professional security audit.",
        ],
    }

    return report
