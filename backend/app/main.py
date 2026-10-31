from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import init_db

# Routers
from app.api.health import router as health_router
from app.api.dataset import router as dataset_router
from app.api.auth import router as auth_router
from app.api.timetable import router as timetable_router
from app.api.bookings import router as bookings_router
from app.api.disruptions import router as disruptions_router
from app.api.analytics import router as analytics_router
from app.api.chat import router as chat_router
from app.api.export import router as export_router
from app.api.notifications import router as notifications_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed initial demo accounts & bookings
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Automated Timetable Generation, Disruption Management, and Event Booking System",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoints (Root and /api/v1)
app.include_router(health_router, prefix="/api")
app.include_router(health_router, prefix=settings.API_V1_STR)

# Auth endpoints
app.include_router(auth_router, prefix="/api")
app.include_router(auth_router, prefix=settings.API_V1_STR)

# Dataset endpoints
app.include_router(dataset_router, prefix=settings.API_V1_STR)

# Timetable, Exams & Validation endpoints
app.include_router(timetable_router, prefix=settings.API_V1_STR)

# Venue Bookings & Spectra Week endpoints
app.include_router(bookings_router, prefix=settings.API_V1_STR)

# Disruption Management & Rescheduling endpoints
app.include_router(disruptions_router, prefix=settings.API_V1_STR)

# Analytics endpoints
app.include_router(analytics_router, prefix=settings.API_V1_STR)

# AI Campus Assistant Q&A endpoints
app.include_router(chat_router, prefix=settings.API_V1_STR)

# Official Exports & Reports endpoints
app.include_router(export_router, prefix=settings.API_V1_STR)

# Notifications endpoints
app.include_router(notifications_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }
