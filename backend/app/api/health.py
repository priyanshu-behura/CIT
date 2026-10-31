from fastapi import APIRouter
from app.core.config import settings
from app.models.schemas import HealthResponse
from app.services.dataset_service import dataset_service

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    # Check OR-Tools availability
    ortools_available = False
    ortools_version = None
    try:
        import ortools
        ortools_available = True
        ortools_version = getattr(ortools, "__version__", "unknown")
    except ImportError:
        ortools_available = False

    # Check dataset availability
    dataset_loaded = False
    dataset_id = None
    try:
        data = dataset_service.raw_data
        dataset_loaded = True
        dataset_id = data.get("dataset_id")
    except Exception:
        dataset_loaded = False

    return HealthResponse(
        status="healthy",
        project_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        ortools_available=ortools_available,
        ortools_version=ortools_version,
        dataset_loaded=dataset_loaded,
        dataset_id=dataset_id,
    )

