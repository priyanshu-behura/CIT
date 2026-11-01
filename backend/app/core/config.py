import os
import json
from pathlib import Path
from typing import List, Union, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine workspace root
# __file__ is in backend/app/core/config.py
# parent 1: core, parent 2: app, parent 3: backend, parent 4: workspace root
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BACKEND_DIR.parent

# Resolve default dataset path with candidate fallbacks for standalone/containerized deployments
def _find_default_dataset() -> Path:
    candidates = [
        WORKSPACE_ROOT / "CrunchWeek_StarterPack (1)" / "CrunchWeek_StarterPack" / "data" / "cit_public.json",
        BACKEND_DIR / "data" / "cit_public.json",
        WORKSPACE_ROOT / "data" / "cit_public.json",
        BACKEND_DIR / "cit_public.json",
    ]
    for c in candidates:
        if c.is_file():
            return c
    return candidates[0]

DEFAULT_DATASET = _find_default_dataset()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Campus Scheduling and Venue Management Platform for Chilika Institute of Technology (CIT)"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Path to cit_public.json
    DATASET_PATH: str = str(DEFAULT_DATASET)
    WORKSPACE_ROOT: str = str(WORKSPACE_ROOT)
    BACKEND_DIR: str = str(BACKEND_DIR)
    
    # CORS Configuration
    # Accepts JSON array string, comma-separated string, or list of origins
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if item]
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, (list, tuple)):
            return [str(item).strip() for item in v if item]
        return []

    # MongoDB Atlas Configuration
    MONGODB_URI: str = "mongodb+srv://sumitkumarpanigrahi9278_db_user:aYJBPRXaRaIrSypT@cluster0.cnbjszh.mongodb.net/?retryWrites=true&w=majority"
    MONGODB_DATABASE: str = "cit_campus"

    # LLM API Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Email & SMTP Configuration for Password Reset
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@cit.edu"
    SMTP_FROM_NAME: str = "Chilika Institute of Technology"
    FRONTEND_URL: str = "http://localhost:5173"
    APP_ENV: str = "development"

    model_config = SettingsConfigDict(
        env_file=(str(Path(__file__).resolve().parent.parent.parent / ".env"), ".env"),
        extra="allow"
    )


settings = Settings()
