"""
Upload service — safe ZIP extraction with path traversal protection.
Treats all uploaded archives as untrusted.
"""

from __future__ import annotations

import shutil
import uuid
import zipfile
from pathlib import Path
from typing import Tuple

import aiofiles
import structlog
from fastapi import UploadFile, HTTPException

from app.core.config import settings

logger = structlog.get_logger(__name__)


async def save_upload(
    project_id: uuid.UUID,
    file: UploadFile,
) -> Tuple[Path, int]:
    """
    Save the uploaded file to disk.

    Returns (saved_path, file_size).
    Raises HTTPException on validation failure.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    # Validate extension
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Only ZIP archives are supported.",
        )

    upload_dir = settings.UPLOAD_PATH / str(project_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid.uuid4()}.zip"
    dest = upload_dir / safe_name

    total_size = 0
    chunk_size = 64 * 1024  # 64 KB

    try:
        async with aiofiles.open(dest, "wb") as out_file:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > settings.MAX_UPLOAD_SIZE:
                    await out_file.close()
                    dest.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=413,
                        detail=f"Upload exceeds maximum size of {settings.MAX_UPLOAD_SIZE // 1_048_576} MB.",
                    )
                await out_file.write(chunk)
    except HTTPException:
        raise
    except Exception as exc:
        dest.unlink(missing_ok=True)
        logger.error("Failed to save upload", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to save uploaded file.")

    return dest, total_size


def extract_zip_safely(
    zip_path: Path,
    project_id: uuid.UUID,
) -> Tuple[Path, int]:
    """
    Extract a ZIP archive to a fresh workspace directory.

    Security controls:
    - Rejects absolute paths.
    - Rejects path traversal sequences (../).
    - Rejects paths that would escape the workspace.
    - Limits total extracted size.
    - Limits file count.
    - Handles malformed archives gracefully.

    Returns (workspace_path, file_count).
    Raises HTTPException on any security violation or error.
    """
    workspace_id = uuid.uuid4()
    workspace = settings.WORKSPACE_PATH / str(project_id) / str(workspace_id)
    workspace.mkdir(parents=True, exist_ok=True)

    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            # Test for malformed archive
            bad = zf.testzip()
            if bad is not None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Malformed ZIP archive: bad file '{bad}'.",
                )

            members = zf.infolist()
            if len(members) > settings.MAX_ZIP_FILES:
                raise HTTPException(
                    status_code=400,
                    detail=f"ZIP contains too many files ({len(members)} > {settings.MAX_ZIP_FILES}).",
                )

            total_extracted = 0
            extracted_count = 0

            for member in members:
                # Security: reject absolute paths and traversal sequences
                member_path = member.filename
                if member_path.startswith("/") or member_path.startswith("\\"):
                    raise HTTPException(
                        status_code=400,
                        detail=f"ZIP contains absolute path: {member_path!r}",
                    )

                # Resolve and check for escape
                resolved = (workspace / member_path).resolve()
                try:
                    resolved.relative_to(workspace.resolve())
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"ZIP path traversal attempt detected: {member_path!r}",
                    )

                # Check total size
                total_extracted += member.file_size
                if total_extracted > settings.MAX_WORKSPACE_SIZE:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Extracted archive exceeds maximum size of {settings.MAX_WORKSPACE_SIZE // 1_048_576} MB.",
                    )

                # Extract
                zf.extract(member, workspace)
                if not member.is_dir():
                    extracted_count += 1

    except HTTPException:
        shutil.rmtree(workspace, ignore_errors=True)
        raise
    except zipfile.BadZipFile:
        shutil.rmtree(workspace, ignore_errors=True)
        raise HTTPException(status_code=400, detail="File is not a valid ZIP archive.")
    except Exception as exc:
        shutil.rmtree(workspace, ignore_errors=True)
        logger.error("ZIP extraction failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to extract archive.")

    logger.info(
        "ZIP extracted safely",
        workspace=str(workspace),
        file_count=extracted_count,
        total_size=total_extracted,
    )
    return workspace, extracted_count
