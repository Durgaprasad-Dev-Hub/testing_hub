"""Pydantic schemas for Findings and Patches."""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# ── Finding Evidence ──────────────────────────────────────────────────────────

class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    evidence_type: str
    title: str
    content: str
    source_url: Optional[str]
    source_name: Optional[str]
    relevance_score: Optional[float]
    created_at: datetime


# ── Findings ──────────────────────────────────────────────────────────────────

class FindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    scan_id: uuid.UUID
    title: str
    category: str
    scanner: str
    severity: str
    confidence: Optional[str]
    file_path: Optional[str]
    line_start: Optional[int]
    line_end: Optional[int]
    code_snippet: Optional[str]
    rule_id: Optional[str]
    cwe_ids: list
    cve_ids: list
    advisory_ids: list
    package_name: Optional[str]
    installed_version: Optional[str]
    fixed_version: Optional[str]
    affected_versions: Optional[str]

    # Clearly marked as AI-generated
    ai_summary: Optional[str]
    ai_impact: Optional[str]
    ai_remediation: Optional[str]
    ai_explanation_source: Optional[str]
    ai_investigated_at: Optional[datetime]

    status: str
    verification_status: str
    secret_redacted: bool
    created_at: datetime
    updated_at: datetime


class FindingDetailResponse(FindingResponse):
    evidence: List[EvidenceResponse] = []


class FindingListResponse(BaseModel):
    items: List[FindingResponse]
    total: int
    page: int
    page_size: int


# ── Patch / Fix Proposal ──────────────────────────────────────────────────────

class PatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    finding_id: uuid.UUID
    scan_id: uuid.UUID
    original_code: Optional[str]
    proposed_code: Optional[str]
    unified_diff: Optional[str]
    file_path: Optional[str]
    explanation: Optional[str]
    expected_effect: Optional[str]
    potential_side_effects: Optional[str]
    ai_provider: Optional[str]
    status: str
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    rejected_at: Optional[datetime]
    rejection_reason: Optional[str]
    applied_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class PatchApproveRequest(BaseModel):
    approved_by: str = Field(default="user", max_length=255)


class PatchRejectRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=2000)


# ── Verification ──────────────────────────────────────────────────────────────

class VerificationRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patch_id: uuid.UUID
    status: str
    checks_performed: list
    checks_skipped: list
    findings_before: int
    findings_after: int
    new_findings: int
    resolved_findings: int
    summary: Optional[str]
    limitations: list
    started_at: datetime
    completed_at: Optional[datetime]
