"""
Scan execution service.
Orchestrates scanner runs, persists events and findings.
All results come from actual scanner output — never fabricated.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.scan import Scan, ScanEvent
from app.models.finding import Finding, FindingEvidence
from app.models.project import Project
from app.scanners.registry import (
    get_available_adapters,
    ScannerResult,
    ScannerFinding,
)

logger = structlog.get_logger(__name__)


async def _add_event(
    session: AsyncSession,
    scan_id: uuid.UUID,
    stage: str,
    message: str,
    level: str = "info",
    extra: dict | None = None,
):
    event = ScanEvent(
        scan_id=scan_id,
        stage=stage,
        message=message,
        level=level,
        extra=extra,
    )
    session.add(event)
    await session.flush()


def _detect_languages(workspace: Path) -> list[str]:
    """Detect programming languages present in the workspace."""
    ext_map = {
        ".py": "Python",
        ".js": "JavaScript",
        ".ts": "TypeScript",
        ".jsx": "JavaScript (React)",
        ".tsx": "TypeScript (React)",
        ".java": "Java",
        ".go": "Go",
        ".rs": "Rust",
        ".rb": "Ruby",
        ".php": "PHP",
        ".cs": "C#",
        ".cpp": "C++",
        ".c": "C",
    }
    found = set()
    for path in workspace.rglob("*"):
        if path.is_file():
            lang = ext_map.get(path.suffix.lower())
            if lang:
                found.add(lang)
    return sorted(found)


def _detect_manifests(workspace: Path) -> list[str]:
    """Detect dependency manifests present in the workspace."""
    manifest_names = [
        "package.json", "package-lock.json", "yarn.lock",
        "requirements.txt", "pyproject.toml", "Pipfile",
        "Gemfile", "go.mod", "Cargo.toml", "pom.xml",
        "build.gradle",
    ]
    found = []
    for name in manifest_names:
        if list(workspace.rglob(name)):
            found.append(name)
    return found


async def run_scan(
    session: AsyncSession,
    scan: Scan,
    workspace: Path,
    project: Project,
) -> None:
    """
    Execute all requested scanners against the workspace.
    Updates the Scan record in-place throughout execution.
    """
    scan.started_at = datetime.now(timezone.utc)
    scan.status = "running"
    await session.flush()

    try:
        # Stage 1: Prepare
        await _add_event(session, scan.id, "prepare", "Preparing workspace for analysis.")

        # Stage 2: Discover files
        await _add_event(session, scan.id, "discover", "Discovering files and project structure.")
        languages = _detect_languages(workspace)
        manifests = _detect_manifests(workspace)
        scan.languages_detected = languages
        scan.manifests_detected = manifests
        await _add_event(
            session, scan.id, "discover",
            f"Detected languages: {', '.join(languages) or 'none'}. Manifests: {', '.join(manifests) or 'none'}.",
            extra={"languages": languages, "manifests": manifests},
        )

        # Stage 3: Get adapters
        requested = scan.scanners_requested or []
        adapters = get_available_adapters(requested if requested else None)
        available_names = [a.name for a in adapters]
        scan.scanners_available = available_names

        await _add_event(
            session, scan.id, "scanners",
            f"Available scanners: {', '.join(available_names) or 'none'}.",
            extra={"available": available_names},
        )

        if not available_names:
            await _add_event(
                session, scan.id, "scanners",
                "No scanners are currently installed. Install Semgrep, Bandit, Gitleaks, or OSV-Scanner to enable scanning.",
                level="warning",
            )

        # Stage 4: Run scanners
        all_findings: list[Finding] = []
        scanners_run = []
        scanners_failed = []

        for adapter in adapters:
            await _add_event(
                session, scan.id, "scanning",
                f"Running {adapter.display_name}…",
                extra={"scanner": adapter.name},
            )
            result: ScannerResult = await adapter.run(workspace)

            if not result.ran:
                await _add_event(
                    session, scan.id, "scanning",
                    f"{adapter.display_name} was skipped: {result.error or 'not applicable'}",
                    level="warning",
                    extra={"scanner": adapter.name},
                )
                continue

            if result.error and not result.findings:
                scanners_failed.append(adapter.name)
                await _add_event(
                    session, scan.id, "scanning",
                    f"{adapter.display_name} failed: {result.error}",
                    level="error",
                    extra={"scanner": adapter.name},
                )
                continue

            scanners_run.append(adapter.name)
            count = len(result.findings)
            await _add_event(
                session, scan.id, "scanning",
                f"{adapter.display_name} completed: {count} finding(s).",
                level="success",
                extra={"scanner": adapter.name, "count": count},
            )

            # Persist findings
            for raw_finding in result.findings:
                db_finding = _scanner_finding_to_model(raw_finding, scan, project)
                session.add(db_finding)
                all_findings.append(db_finding)

        await session.flush()

        # Update scan summary
        scan.scanners_run = scanners_run
        scan.scanners_failed = scanners_failed
        scan.total_findings = len(all_findings)
        scan.critical_count = sum(1 for f in all_findings if f.severity == "critical")
        scan.high_count = sum(1 for f in all_findings if f.severity == "high")
        scan.medium_count = sum(1 for f in all_findings if f.severity == "medium")
        scan.low_count = sum(1 for f in all_findings if f.severity == "low")
        scan.info_count = sum(1 for f in all_findings if f.severity == "info")
        scan.dependency_alerts = sum(1 for f in all_findings if f.category == "dependency")
        scan.secret_detections = sum(1 for f in all_findings if f.category == "secret")

        # Update project counts
        project.total_findings = scan.total_findings
        project.critical_findings = scan.critical_count
        project.high_findings = scan.high_count
        project.medium_findings = scan.medium_count
        project.low_findings = scan.low_count

        # Stage 5: Complete
        scan.status = "completed"
        scan.completed_at = datetime.now(timezone.utc)
        project.status = "scanned"

        await _add_event(
            session, scan.id, "complete",
            f"Scan complete. {len(all_findings)} finding(s) found across {len(scanners_run)} scanner(s).",
            level="success",
        )

        if not scanners_run:
            await _add_event(
                session, scan.id, "complete",
                "No scanners ran. Results reflect zero scanner coverage. Install scanners for meaningful results.",
                level="warning",
            )

    except Exception as exc:
        logger.error("Scan execution failed", scan_id=str(scan.id), error=str(exc))
        scan.status = "failed"
        scan.error_message = str(exc)[:1000]
        scan.completed_at = datetime.now(timezone.utc)
        await _add_event(
            session, scan.id, "error",
            f"Scan failed unexpectedly: {str(exc)[:500]}",
            level="error",
        )

    await session.flush()


def _scanner_finding_to_model(
    raw: ScannerFinding,
    scan: Scan,
    project: Project,
) -> Finding:
    """Convert a ScannerFinding dataclass to a Finding ORM model."""
    return Finding(
        project_id=project.id,
        scan_id=scan.id,
        title=raw.title,
        category=raw.category,
        scanner=raw.scanner,
        severity=raw.severity,
        confidence=raw.confidence,
        file_path=raw.file_path,
        line_start=raw.line_start,
        line_end=raw.line_end,
        code_snippet=raw.code_snippet,
        rule_id=raw.rule_id,
        cwe_ids=raw.cwe_ids or [],
        cve_ids=raw.cve_ids or [],
        advisory_ids=raw.advisory_ids or [],
        package_name=raw.package_name,
        installed_version=raw.installed_version,
        fixed_version=raw.fixed_version,
        affected_versions=raw.affected_versions,
        raw_output=raw.raw_output,
        secret_redacted=raw.secret_redacted,
        status="open",
        verification_status="not_verified",
    )
