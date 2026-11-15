"""Models package — import all models here to ensure they're registered."""

from app.models.project import Project, Upload  # noqa: F401
from app.models.scan import Scan, ScanEvent  # noqa: F401
from app.models.finding import Finding, FindingEvidence  # noqa: F401
from app.models.patch import Patch, VerificationRun  # noqa: F401

__all__ = [
    "Project",
    "Upload",
    "Scan",
    "ScanEvent",
    "Finding",
    "FindingEvidence",
    "Patch",
    "VerificationRun",
]
