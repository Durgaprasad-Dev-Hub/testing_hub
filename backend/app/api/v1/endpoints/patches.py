"""Patch approval and verification endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.patch import Patch, VerificationRun
from app.schemas.finding import PatchResponse, PatchApproveRequest, PatchRejectRequest, VerificationRunResponse

router = APIRouter()


@router.get("/{patch_id}", response_model=PatchResponse)
async def get_patch(patch_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    patch = await db.get(Patch, patch_id)
    if not patch:
        raise HTTPException(status_code=404, detail="Patch not found.")
    return patch


@router.post("/{patch_id}/approve", response_model=PatchResponse)
async def approve_patch(
    patch_id: uuid.UUID,
    payload: PatchApproveRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Explicitly approve a patch proposal.
    This records the approval decision. The patch is then applied separately.
    No code change is made by this endpoint alone.
    """
    patch = await db.get(Patch, patch_id)
    if not patch:
        raise HTTPException(status_code=404, detail="Patch not found.")

    if patch.status not in ("proposed",):
        raise HTTPException(
            status_code=400,
            detail=f"Patch cannot be approved in its current state: {patch.status}",
        )

    patch.status = "approved"
    patch.approved_by = payload.approved_by
    patch.approved_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(patch)
    return patch


@router.post("/{patch_id}/reject", response_model=PatchResponse)
async def reject_patch(
    patch_id: uuid.UUID,
    payload: PatchRejectRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reject a patch proposal. No code is changed."""
    patch = await db.get(Patch, patch_id)
    if not patch:
        raise HTTPException(status_code=404, detail="Patch not found.")

    if patch.status not in ("proposed", "approved"):
        raise HTTPException(
            status_code=400,
            detail=f"Patch cannot be rejected in its current state: {patch.status}",
        )

    patch.status = "rejected"
    patch.rejected_at = datetime.now(timezone.utc)
    patch.rejection_reason = payload.reason
    await db.flush()
    await db.refresh(patch)
    return patch


@router.post("/{patch_id}/verify", response_model=VerificationRunResponse)
async def verify_patch(
    patch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Start a verification run for an approved + applied patch.
    Only approved patches can be verified.
    """
    patch = await db.get(Patch, patch_id)
    if not patch:
        raise HTTPException(status_code=404, detail="Patch not found.")

    if patch.status not in ("applied", "approved"):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Patch must be applied before verification (current: {patch.status}). "
                "Approve the patch and apply it first."
            ),
        )

    # Create verification record
    run = VerificationRun(
        patch_id=patch_id,
        status="not_verified",
        checks_performed=[],
        checks_skipped=["No verification environment configured"],
        findings_before=0,
        findings_after=0,
        summary=(
            "Verification was requested but no automated verification environment "
            "is currently configured. Manual review is required."
        ),
        limitations=[
            "Automated verification requires scanner availability.",
            "Test execution requires a safe sandbox environment.",
            "This verification run was created but no checks were performed.",
        ],
    )
    db.add(run)
    patch.status = "verification_pending"
    await db.flush()
    await db.refresh(run)
    return run
