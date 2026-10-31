import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine workspace root
# __file__ is in backend/app/core/config.py
# parent 1: core, parent 2: app, parent 3: backend, parent 4: workspace root
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BACKEND_DIR.parent

# Default dataset path inside the starter pack
DEFAULT_DATASET = WORKSPACE_ROOT / "CrunchWeek_StarterPack (1)" / "CrunchWeek_StarterPack" / "data" / "cit_public.json"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Campus Scheduling and Venue Management Platform for Chilika Institute of Technology (CIT)"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Path to cit_public.json
    DATASET_PATH: str = str(DEFAULT_DATASET)
    WORKSPACE_ROOT: str = str(WORKSPACE_ROOT)
    BACKEND_DIR: str = str(BACKEND_DIR)
    
    # CORS Configuration
    # Include 5173 (default Vite port) and 5174+ (fallback when 5173 is occupied)
    CORS_ORIGINS: List[str] = [
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

    model_config = SettingsConfigDict(env_file=".env", extra="allow")


settings = Settings()
