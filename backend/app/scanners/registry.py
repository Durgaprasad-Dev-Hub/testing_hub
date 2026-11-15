"""
Scanner registry — detects installed security tools and provides
a unified interface for running them.

All adapters report scanner availability honestly.
Results are never invented — only actual tool output is recorded.
"""

from __future__ import annotations

import asyncio
import json
import shutil
import subprocess
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


@dataclass
class ScannerFinding:
    """Normalized finding from any scanner. Contains only actual tool output."""
    title: str
    severity: str            # critical | high | medium | low | info
    category: str            # sast | dependency | secret | code_quality
    scanner: str             # tool name
    file_path: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    code_snippet: str | None = None
    rule_id: str | None = None
    cwe_ids: list = field(default_factory=list)
    cve_ids: list = field(default_factory=list)
    advisory_ids: list = field(default_factory=list)
    package_name: str | None = None
    installed_version: str | None = None
    fixed_version: str | None = None
    affected_versions: str | None = None
    confidence: str | None = None
    raw_output: dict | None = None
    secret_redacted: bool = False


@dataclass
class ScannerResult:
    """Result from a single scanner run."""
    scanner: str
    available: bool
    ran: bool
    findings: list[ScannerFinding] = field(default_factory=list)
    error: str | None = None
    raw_stdout: str = ""
    raw_stderr: str = ""
    exit_code: int | None = None


class BaseScannerAdapter(ABC):
    name: str = "unknown"
    display_name: str = "Unknown Scanner"

    @classmethod
    def is_available(cls) -> bool:
        """Check whether the scanner binary is on PATH or configured path."""
        raise NotImplementedError

    @abstractmethod
    async def run(self, workspace: Path) -> ScannerResult:
        """Run the scanner against the workspace directory."""
        raise NotImplementedError

    async def _run_process(
        self,
        args: list[str],
        cwd: Path | None = None,
        timeout: int | None = None,
    ) -> tuple[int, str, str]:
        """Run a subprocess asynchronously and return (exit_code, stdout, stderr)."""
        t = timeout or settings.SCANNER_TIMEOUT
        try:
            proc = await asyncio.create_subprocess_exec(
                *args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(cwd) if cwd else None,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=t)
            return proc.returncode, stdout.decode("utf-8", errors="replace"), stderr.decode("utf-8", errors="replace")
        except asyncio.TimeoutError:
            logger.warning("Scanner timed out", scanner=self.name, timeout=t)
            try:
                proc.kill()
            except Exception:
                pass
            return -1, "", f"Scanner timed out after {t} seconds"
        except FileNotFoundError:
            return -1, "", f"Scanner binary not found: {args[0]}"
        except Exception as exc:
            return -1, "", str(exc)


# ── Semgrep ───────────────────────────────────────────────────────────────────

class SemgrepAdapter(BaseScannerAdapter):
    name = "semgrep"
    display_name = "Semgrep (SAST)"

    @classmethod
    def is_available(cls) -> bool:
        return shutil.which(settings.SEMGREP_PATH) is not None

    async def run(self, workspace: Path) -> ScannerResult:
        if not self.is_available():
            return ScannerResult(scanner=self.name, available=False, ran=False)

        args = [
            settings.SEMGREP_PATH,
            "scan",
            "--config", "auto",
            "--json",
            "--no-rewrite-rule-ids",
            "--quiet",
            str(workspace),
        ]

        exit_code, stdout, stderr = await self._run_process(args)

        if exit_code not in (0, 1):
            return ScannerResult(
                scanner=self.name, available=True, ran=True,
                error=stderr[:2000], exit_code=exit_code,
                raw_stderr=stderr,
            )

        findings = []
        try:
            data = json.loads(stdout) if stdout.strip() else {}
            for r in data.get("results", []):
                sev_map = {"ERROR": "high", "WARNING": "medium", "INFO": "low"}
                sev = sev_map.get(r.get("extra", {}).get("severity", ""), "info")
                meta = r.get("extra", {}).get("metadata", {})
                findings.append(ScannerFinding(
                    title=r.get("check_id", "Semgrep finding"),
                    severity=sev,
                    category="sast",
                    scanner=self.name,
                    file_path=r.get("path"),
                    line_start=r.get("start", {}).get("line"),
                    line_end=r.get("end", {}).get("line"),
                    code_snippet=r.get("extra", {}).get("lines", "")[:500],
                    rule_id=r.get("check_id"),
                    cwe_ids=meta.get("cwe", []) if isinstance(meta.get("cwe"), list) else ([meta["cwe"]] if meta.get("cwe") else []),
                    confidence="high",
                    raw_output=r,
                ))
        except json.JSONDecodeError:
            return ScannerResult(
                scanner=self.name, available=True, ran=True,
                error="Failed to parse Semgrep JSON output",
                raw_stdout=stdout[:5000], raw_stderr=stderr[:2000],
            )

        return ScannerResult(
            scanner=self.name, available=True, ran=True,
            findings=findings, exit_code=exit_code,
            raw_stdout=stdout[:5000], raw_stderr=stderr[:2000],
        )


# ── Bandit ────────────────────────────────────────────────────────────────────

class BanditAdapter(BaseScannerAdapter):
    name = "bandit"
    display_name = "Bandit (Python Security)"

    @classmethod
    def is_available(cls) -> bool:
        return shutil.which(settings.BANDIT_PATH) is not None

    async def run(self, workspace: Path) -> ScannerResult:
        if not self.is_available():
            return ScannerResult(scanner=self.name, available=False, ran=False)

        # Only run on directories containing Python files
        py_files = list(workspace.rglob("*.py"))
        if not py_files:
            return ScannerResult(
                scanner=self.name, available=True, ran=False,
                error="No Python files found — Bandit not applicable",
            )

        args = [
            settings.BANDIT_PATH,
            "-r", str(workspace),
            "-f", "json",
            "-q",
        ]

        exit_code, stdout, stderr = await self._run_process(args)

        findings = []
        try:
            data = json.loads(stdout) if stdout.strip() else {}
            sev_map = {"HIGH": "high", "MEDIUM": "medium", "LOW": "low"}
            for r in data.get("results", []):
                findings.append(ScannerFinding(
                    title=r.get("test_name", "Bandit finding"),
                    severity=sev_map.get(r.get("issue_severity", "LOW"), "low"),
                    category="sast",
                    scanner=self.name,
                    file_path=r.get("filename"),
                    line_start=r.get("line_number"),
                    code_snippet=r.get("code", "")[:500],
                    rule_id=r.get("test_id"),
                    cwe_ids=[f"CWE-{r['issue_cwe']['id']}"] if r.get("issue_cwe") else [],
                    confidence=r.get("issue_confidence", "").lower() or None,
                    raw_output=r,
                ))
        except json.JSONDecodeError:
            return ScannerResult(
                scanner=self.name, available=True, ran=True,
                error="Failed to parse Bandit JSON output",
                raw_stdout=stdout[:5000], raw_stderr=stderr[:2000],
            )

        return ScannerResult(
            scanner=self.name, available=True, ran=True,
            findings=findings, exit_code=exit_code,
            raw_stdout=stdout[:5000], raw_stderr=stderr[:2000],
        )


# ── Gitleaks ──────────────────────────────────────────────────────────────────

class GitleaksAdapter(BaseScannerAdapter):
    name = "gitleaks"
    display_name = "Gitleaks (Secret Detection)"

    @classmethod
    def is_available(cls) -> bool:
        return shutil.which(settings.GITLEAKS_PATH) is not None

    async def run(self, workspace: Path) -> ScannerResult:
        if not self.is_available():
            return ScannerResult(scanner=self.name, available=False, ran=False)

        report_path = workspace.parent / f"gitleaks_report_{workspace.name}.json"
        args = [
            settings.GITLEAKS_PATH,
            "detect",
            "--source", str(workspace),
            "--report-format", "json",
            "--report-path", str(report_path),
            "--no-git",
            "--exit-code", "0",
        ]

        exit_code, stdout, stderr = await self._run_process(args)

        findings = []
        try:
            if report_path.exists():
                with open(report_path) as f:
                    leaks = json.load(f)
                report_path.unlink(missing_ok=True)

                for leak in (leaks or []):
                    # Redact the actual secret value
                    findings.append(ScannerFinding(
                        title=f"Secret detected: {leak.get('RuleID', 'unknown')}",
                        severity="high",
                        category="secret",
                        scanner=self.name,
                        file_path=leak.get("File"),
                        line_start=leak.get("StartLine"),
                        line_end=leak.get("EndLine"),
                        code_snippet="[REDACTED — secret value not shown]",
                        rule_id=leak.get("RuleID"),
                        secret_redacted=True,
                        raw_output={
                            k: v for k, v in leak.items()
                            if k not in ("Secret", "Match")  # Never store the actual secret
                        },
                    ))
        except Exception as exc:
            return ScannerResult(
                scanner=self.name, available=True, ran=True,
                error=str(exc)[:2000],
            )

        return ScannerResult(
            scanner=self.name, available=True, ran=True,
            findings=findings, exit_code=exit_code,
            raw_stderr=stderr[:2000],
        )


# ── OSV-Scanner ───────────────────────────────────────────────────────────────

class OSVScannerAdapter(BaseScannerAdapter):
    name = "osv-scanner"
    display_name = "OSV-Scanner (Dependencies)"

    @classmethod
    def is_available(cls) -> bool:
        return shutil.which(settings.OSV_SCANNER_PATH) is not None

    async def run(self, workspace: Path) -> ScannerResult:
        if not self.is_available():
            return ScannerResult(scanner=self.name, available=False, ran=False)

        args = [
            settings.OSV_SCANNER_PATH,
            "--recursive",
            "--format", "json",
            str(workspace),
        ]

        exit_code, stdout, stderr = await self._run_process(args)

        findings = []
        try:
            data = json.loads(stdout) if stdout.strip() else {}
            for result in data.get("results", []):
                for pkg in result.get("packages", []):
                    for vuln in pkg.get("vulnerabilities", []):
                        sev = "medium"
                        for sev_info in vuln.get("severity", []):
                            score = sev_info.get("score", "")
                            if "CRITICAL" in score.upper():
                                sev = "critical"
                            elif "HIGH" in score.upper():
                                sev = "high"

                        # Affected versions
                        affected = []
                        for aff in vuln.get("affected", []):
                            for rng in aff.get("ranges", []):
                                for ev in rng.get("events", []):
                                    if ev.get("fixed"):
                                        affected.append(f"fixed in {ev['fixed']}")

                        findings.append(ScannerFinding(
                            title=f"Vulnerability in {pkg.get('package', {}).get('name', 'unknown')}: {vuln.get('id', '')}",
                            severity=sev,
                            category="dependency",
                            scanner=self.name,
                            package_name=pkg.get("package", {}).get("name"),
                            installed_version=pkg.get("package", {}).get("version"),
                            fixed_version=affected[0].replace("fixed in ", "") if affected else None,
                            advisory_ids=[vuln.get("id", "")],
                            cve_ids=[a for a in vuln.get("aliases", []) if a.startswith("CVE-")],
                            raw_output={"vuln_id": vuln.get("id"), "package": pkg.get("package")},
                        ))
        except json.JSONDecodeError:
            return ScannerResult(
                scanner=self.name, available=True, ran=True,
                error="Failed to parse OSV-Scanner JSON output",
                raw_stdout=stdout[:5000], raw_stderr=stderr[:2000],
            )

        return ScannerResult(
            scanner=self.name, available=True, ran=True,
            findings=findings, exit_code=exit_code,
            raw_stdout=stdout[:5000], raw_stderr=stderr[:2000],
        )


# ── npm audit ─────────────────────────────────────────────────────────────────

class NpmAuditAdapter(BaseScannerAdapter):
    name = "npm-audit"
    display_name = "npm audit (Node.js Dependencies)"

    @classmethod
    def is_available(cls) -> bool:
        return shutil.which("npm") is not None

    async def run(self, workspace: Path) -> ScannerResult:
        if not self.is_available():
            return ScannerResult(scanner=self.name, available=False, ran=False)

        # Only run if package.json exists
        pkg_json = workspace / "package.json"
        if not pkg_json.exists():
            # Search subdirectories
            candidates = list(workspace.rglob("package.json"))
            if not candidates:
                return ScannerResult(
                    scanner=self.name, available=True, ran=False,
                    error="No package.json found — npm audit not applicable",
                )
            pkg_json = candidates[0]

        target_dir = pkg_json.parent
        args = ["npm", "audit", "--json"]
        exit_code, stdout, stderr = await self._run_process(args, cwd=target_dir)

        findings = []
        try:
            data = json.loads(stdout) if stdout.strip() else {}
            sev_map = {"critical": "critical", "high": "high", "moderate": "medium", "low": "low"}
            for vuln_name, vuln in data.get("vulnerabilities", {}).items():
                sev = sev_map.get(vuln.get("severity", "low"), "low")
                findings.append(ScannerFinding(
                    title=f"npm vulnerability: {vuln_name}",
                    severity=sev,
                    category="dependency",
                    scanner=self.name,
                    package_name=vuln_name,
                    installed_version=vuln.get("range", ""),
                    advisory_ids=[str(a) for a in vuln.get("via", []) if isinstance(a, (int, str))],
                    raw_output={k: v for k, v in vuln.items() if k != "nodes"},
                ))
        except json.JSONDecodeError:
            return ScannerResult(
                scanner=self.name, available=True, ran=True,
                error="Failed to parse npm audit JSON output",
                raw_stdout=stdout[:5000], raw_stderr=stderr[:2000],
            )

        return ScannerResult(
            scanner=self.name, available=True, ran=True,
            findings=findings, exit_code=exit_code,
            raw_stdout=stdout[:5000], raw_stderr=stderr[:2000],
        )


# ── Registry ──────────────────────────────────────────────────────────────────

ALL_ADAPTERS: list[type[BaseScannerAdapter]] = [
    SemgrepAdapter,
    BanditAdapter,
    GitleaksAdapter,
    OSVScannerAdapter,
    NpmAuditAdapter,
]


def get_scanner_availability() -> dict[str, dict]:
    """Return availability status for all known scanners."""
    return {
        adapter.name: {
            "name": adapter.name,
            "display_name": adapter.display_name,
            "available": adapter.is_available(),
        }
        for adapter in ALL_ADAPTERS
    }


def get_available_adapters(requested: list[str] | None = None) -> list[BaseScannerAdapter]:
    """Return instantiated adapters that are available (and requested if specified)."""
    available = [cls() for cls in ALL_ADAPTERS if cls.is_available()]
    if requested:
        available = [a for a in available if a.name in requested]
    return available
