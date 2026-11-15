"""Patch, PatchApproval, and VerificationRun models."""

import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, func, Integer, JSON, ForeignKey, Boolean, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Patch(Base):
    __tablename__ = "patches"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    finding_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("findings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    scan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("scans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # The proposed change (AI-generated, clearly labeled)
    original_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    proposed_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    unified_diff: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # AI-generated metadata
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_effect: Mapped[str | None] = mapped_column(Text, nullable=True)
    potential_side_effects: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_provider: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(50), default="proposed", nullable=False, index=True)
    # status: proposed | approved | rejected | applied | verification_pending | verified | verification_failed

    # Approval (requires explicit human action)
    approved_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rejected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Application
    applied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    applied_diff: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    finding: Mapped["Finding"] = relationship("Finding", back_populates="patches")
    verification_runs: Mapped[list["VerificationRun"]] = relationship(
        "VerificationRun", back_populates="patch", cascade="all, delete-orphan"
    )


class VerificationRun(Base):
    __tablename__ = "verification_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    patch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Overall result
    status: Mapped[str] = mapped_column(String(50), default="running", nullable=False, index=True)
    # status: running | verified | partially_verified | verification_failed | not_verified

    # Checks performed
    checks_performed: Mapped[list] = mapped_column(JSON, default=list)
    checks_skipped: Mapped[list] = mapped_column(JSON, default=list)
    findings_before: Mapped[int] = mapped_column(Integer, default=0)
    findings_after: Mapped[int] = mapped_column(Integer, default=0)
    new_findings: Mapped[int] = mapped_column(Integer, default=0)
    resolved_findings: Mapped[int] = mapped_column(Integer, default=0)

    # Summary and limitations
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    limitations: Mapped[list] = mapped_column(JSON, default=list)
    raw_results: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    patch: Mapped["Patch"] = relationship("Patch", back_populates="verification_runs")
