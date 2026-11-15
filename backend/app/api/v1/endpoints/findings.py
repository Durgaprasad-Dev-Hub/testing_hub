"""Finding endpoints — list, detail, AI investigation."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.models.finding import Finding, FindingEvidence
from app.schemas.finding import FindingResponse, FindingDetailResponse, FindingListResponse
from app.core.config import settings

router = APIRouter()


@router.get("/projects/{project_id}/findings", response_model=FindingListResponse)
async def list_project_findings(
    project_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    scanner: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None, max_length=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(Finding).where(Finding.project_id == project_id)

    if severity:
        q = q.where(Finding.severity == severity)
    if category:
        q = q.where(Finding.category == category)
    if scanner:
        q = q.where(Finding.scanner == scanner)
    if status:
        q = q.where(Finding.status == status)
    if search:
        q = q.where(Finding.title.ilike(f"%{search}%"))

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    q = q.order_by(
        desc(Finding.severity == "critical"),
        desc(Finding.severity == "high"),
        desc(Finding.created_at),
    ).offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(q)
    findings = result.scalars().all()

    return FindingListResponse(items=list(findings), total=total, page=page, page_size=page_size)


@router.get("/findings/{finding_id}", response_model=FindingDetailResponse)
async def get_finding(
    finding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Finding)
        .where(Finding.id == finding_id)
        .options(selectinload(Finding.evidence))
    )
    result = await db.execute(q)
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")
    return finding


@router.post("/findings/{finding_id}/explain")
async def explain_finding(
    finding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Request an AI explanation for a finding.
    Requires a configured LLM provider.
    The explanation is generated from actual finding data and optionally RAG context.
    """
    finding = await db.get(Finding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")

    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=503,
            detail=(
                "AI investigation requires a configured LLM provider. "
                "Set LLM_PROVIDER and the corresponding API key in your .env file. "
                "See .env.example for details."
            ),
        )

    # Placeholder for LangGraph agent invocation
    # When AI is configured, this calls the investigation agent
    return {
        "message": "AI investigation not yet implemented with the current provider.",
        "finding_id": str(finding_id),
        "ai_provider": settings.LLM_PROVIDER,
    }


@router.post("/findings/{finding_id}/generate-fix")
async def generate_fix(
    finding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Request an AI-generated fix proposal for a finding.
    Requires LLM provider. The proposal is NOT applied automatically.
    Explicit human approval is required before any change is made.
    """
    finding = await db.get(Finding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")

    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=503,
            detail=(
                "Fix generation requires a configured LLM provider. "
                "Set LLM_PROVIDER and the corresponding API key in your .env file."
            ),
        )

    return {
        "message": "Fix generation not yet implemented with the current provider.",
        "finding_id": str(finding_id),
        "note": "Fixes are proposals only and require explicit human approval before application.",
    }
