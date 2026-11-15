"""Finding and FindingEvidence models."""

import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, func, Integer, JSON, ForeignKey, Boolean, Float, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    scan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("scans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Core identification
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # category: sast | dependency | secret | code_quality | other
    scanner: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # scanner: semgrep | bandit | gitleaks | osv-scanner | npm-audit | manual

    # Severity
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    # severity: critical | high | medium | low | info
    confidence: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # confidence: high | medium | low

    # Location
    file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    line_start: Mapped[int | None] = mapped_column(Integer, nullable=True)
    line_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    code_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Scanner metadata
    rule_id: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cwe_ids: Mapped[list] = mapped_column(JSON, default=list)
    cve_ids: Mapped[list] = mapped_column(JSON, default=list)
    advisory_ids: Mapped[list] = mapped_column(JSON, default=list)

    # Dependency-specific
    package_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    installed_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fixed_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    affected_versions: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Scanner raw output (actual tool output — never AI-generated)
    raw_output: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # AI-generated fields (clearly separated)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_impact: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_remediation: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_explanation_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Marks what generated the explanation: "llm_openai" | "llm_anthropic" | etc.
    ai_investigated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Status
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False, index=True)
    # status: open | in_review | fixed | false_positive | accepted_risk
    verification_status: Mapped[str] = mapped_column(
        String(50), default="not_verified", nullable=False, index=True
    )
    # verification_status: not_verified | verified | partially_verified | verification_failed

    # Secret-specific (redacted)
    secret_redacted: Mapped[bool] = mapped_column(Boolean, default=False)

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
    project: Mapped["Project"] = relationship("Project", back_populates="findings")
    scan: Mapped["Scan"] = relationship("Scan", back_populates="findings")
    evidence: Mapped[list["FindingEvidence"]] = relationship(
        "FindingEvidence", back_populates="finding", cascade="all, delete-orphan"
    )
    patches: Mapped[list["Patch"]] = relationship(
        "Patch", back_populates="finding", cascade="all, delete-orphan"
    )


class FindingEvidence(Base):
    __tablename__ = "finding_evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    finding_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("findings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    evidence_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # type: scanner_output | code_context | documentation | rag_retrieved
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    source_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Only populated if actually retrieved — never invented
    relevance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    finding: Mapped["Finding"] = relationship("Finding", back_populates="evidence")
