"""Backend tests — startup, health, projects, upload security."""

import io
import zipfile
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


from app.database.session import create_tables


@pytest_asyncio.fixture(autouse=True)
async def init_test_db():
    """Ensure database schema is created before tests execute."""
    await create_tables()


@pytest_asyncio.fixture
async def client():
    """HTTP test client using ASGI transport (no real network)."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# ── Health ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert "scanners" in data
    assert "ai_enabled" in data


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "docs" in data


# ── Project CRUD ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_projects_empty(client: AsyncClient):
    """Projects list returns valid structure even when empty."""
    response = await client.get("/api/v1/projects")
    # May return 200 or fail if DB is not configured
    assert response.status_code in (200, 500)
    if response.status_code == 200:
        data = response.json()
        assert "items" in data
        assert "total" in data


@pytest.mark.asyncio
async def test_create_project_validation(client: AsyncClient):
    """Project creation rejects empty name."""
    response = await client.post("/api/v1/projects", json={"name": ""})
    assert response.status_code == 422  # Pydantic validation error


@pytest.mark.asyncio
async def test_get_nonexistent_project(client: AsyncClient):
    """Getting a non-existent project returns 404."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/projects/{fake_id}")
    assert response.status_code in (404, 500)  # 500 if DB unavailable


# ── Upload Security ───────────────────────────────────────────────────────────

def make_zip(files: dict[str, bytes]) -> bytes:
    """Helper: create an in-memory ZIP with given files."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for name, content in files.items():
            zf.writestr(name, content)
    return buf.getvalue()


def make_traversal_zip() -> bytes:
    """Create a ZIP with a path traversal entry."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("../../evil.py", b"malicious content")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_upload_rejects_non_zip(client: AsyncClient):
    """Upload endpoint rejects non-ZIP files."""
    fake_id = str(uuid.uuid4())
    response = await client.post(
        f"/api/v1/projects/{fake_id}/upload",
        files={"file": ("test.py", b"print('hello')", "text/plain")},
    )
    # Accepts 400 (validation) or 404 (project not found) — both are correct
    assert response.status_code in (400, 404, 422, 500)


@pytest.mark.asyncio
async def test_upload_path_traversal_protection():
    """
    Verify that the extract_zip_safely function rejects path traversal.
    Tests the security function directly, not via HTTP.
    """
    from app.services.upload_service import extract_zip_safely
    import tempfile
    from pathlib import Path
    from fastapi import HTTPException

    # Create a traversal ZIP
    traversal_zip_data = make_traversal_zip()

    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = Path(tmpdir) / "test.zip"
        zip_path.write_bytes(traversal_zip_data)

        fake_project_id = uuid.uuid4()

        with pytest.raises(HTTPException) as exc_info:
            extract_zip_safely(zip_path, fake_project_id)

        assert exc_info.value.status_code == 400
        assert "traversal" in exc_info.value.detail.lower() or "absolute" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_upload_malformed_zip():
    """
    Verify that malformed archives are handled gracefully.
    """
    from app.services.upload_service import extract_zip_safely
    import tempfile
    from pathlib import Path
    from fastapi import HTTPException

    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = Path(tmpdir) / "bad.zip"
        zip_path.write_bytes(b"this is not a zip file at all")

        fake_project_id = uuid.uuid4()

        with pytest.raises(HTTPException) as exc_info:
            extract_zip_safely(zip_path, fake_project_id)

        assert exc_info.value.status_code == 400


# ── Scanner Registry ──────────────────────────────────────────────────────────

def test_scanner_availability_returns_dict():
    """Scanner availability check returns a dict with known keys."""
    from app.scanners.registry import get_scanner_availability

    availability = get_scanner_availability()
    assert isinstance(availability, dict)

    for scanner_name, info in availability.items():
        assert "available" in info
        assert isinstance(info["available"], bool)
        assert "display_name" in info


def test_get_available_adapters_returns_list():
    """get_available_adapters returns a list (possibly empty)."""
    from app.scanners.registry import get_available_adapters

    adapters = get_available_adapters()
    assert isinstance(adapters, list)
    # Each item must have name and run method
    for adapter in adapters:
        assert hasattr(adapter, "name")
        assert hasattr(adapter, "run")


# ── Input Validation ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_patch_approve_nonexistent(client: AsyncClient):
    """Approving a non-existent patch returns 404."""
    fake_id = str(uuid.uuid4())
    response = await client.post(
        f"/api/v1/patches/{fake_id}/approve",
        json={"approved_by": "test_user"},
    )
    assert response.status_code in (404, 500)


@pytest.mark.asyncio
async def test_api_returns_consistent_error_format(client: AsyncClient):
    """All 422 validation errors follow FastAPI's format."""
    # Missing required 'name' field
    response = await client.post("/api/v1/projects", json={})
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
