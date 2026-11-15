"""
Application configuration — reads from environment / .env file.
"""

from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ───────────────────────────────────────────────────────
    APP_NAME: str = "Vibe Shield AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # ── Security ──────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-this-before-production"

    # ── CORS ──────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def ALLOWED_ORIGINS_LIST(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # ── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./vibeshield.db"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """Ensure we use the appropriate async driver."""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        if url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
            url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return url

    # ── File Uploads ──────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE: int = 104_857_600       # 100 MB
    MAX_WORKSPACE_SIZE: int = 524_288_000    # 500 MB
    MAX_ZIP_FILES: int = 10_000
    UPLOAD_DIR: str = "uploads"
    WORKSPACE_DIR: str = "workspaces"

    # ── AI / LLM ──────────────────────────────────────────────────────────
    LLM_PROVIDER: str = "disabled"           # openai | anthropic | google | disabled
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-haiku-20241022"
    GOOGLE_API_KEY: str = ""
    GOOGLE_MODEL: str = "gemini-1.5-flash"

    @property
    def AI_ENABLED(self) -> bool:
        return self.LLM_PROVIDER != "disabled"

    # ── Qdrant ────────────────────────────────────────────────────────────
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "vibe_shield_knowledge"

    # ── Scanners ──────────────────────────────────────────────────────────
    SEMGREP_PATH: str = "semgrep"
    BANDIT_PATH: str = "bandit"
    GITLEAKS_PATH: str = "gitleaks"
    OSV_SCANNER_PATH: str = "osv-scanner"

    # ── Timeouts ──────────────────────────────────────────────────────────
    SCAN_TIMEOUT: int = 300
    SCANNER_TIMEOUT: int = 60

    # ── Paths ─────────────────────────────────────────────────────────────
    @property
    def BASE_DIR(self) -> Path:
        return Path(__file__).parent.parent.parent

    @property
    def UPLOAD_PATH(self) -> Path:
        p = self.BASE_DIR / self.UPLOAD_DIR
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def WORKSPACE_PATH(self) -> Path:
        p = self.BASE_DIR / self.WORKSPACE_DIR
        p.mkdir(parents=True, exist_ok=True)
        return p


settings = Settings()
