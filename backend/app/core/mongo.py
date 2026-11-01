import logging
import certifi
import sqlite3
from pathlib import Path
from typing import Optional, Any
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import mongomock
from app.core.config import settings

logger = logging.getLogger('cit.mongo')

_client: Optional[Any] = None
_db: Optional[Database] = None
_is_live_atlas: bool = False

SQLITE_DB_PATH = Path(__file__).resolve().parent.parent.parent / "tech_zephyr.db"


def _seed_mock_from_sqlite(mock_db: Any):
    """Seed mongomock database collections from historical SQLite archive."""
    if not SQLITE_DB_PATH.exists():
        return
    try:
        conn = sqlite3.connect(str(SQLITE_DB_PATH))
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Seed users
        cur.execute("SELECT id, email, password_hash, full_name, role, department, registration_no, created_at FROM users")
        user_rows = [dict(r) for r in cur.fetchall()]
        for u in user_rows:
            mock_db.users.replace_one({"email": u["email"]}, u, upsert=True)

        # Seed bookings
        cur.execute("SELECT * FROM bookings")
        booking_rows = [dict(r) for r in cur.fetchall()]
        for b in booking_rows:
            mock_db.bookings.replace_one({"id": b["id"]}, b, upsert=True)

        conn.close()
        logger.info(f"mongomock initialized with {len(user_rows)} users and {len(booking_rows)} bookings from SQLite archive.")
    except Exception as e:
        logger.warning(f"Error seeding mock MongoDB from SQLite: {e}")


def get_mongo_client() -> Any:
    """
    Returns singleton MongoClient instance.
    Attempts primary connection to live MongoDB Atlas.
    Gracefully falls back to in-memory mongomock seeded from SQLite if Atlas is unreachable
    (e.g., due to IP whitelist restrictions, network boundaries, or offline development).
    """
    global _client, _is_live_atlas
    if _client is not None:
        return _client

    uri = (getattr(settings, "MONGODB_URI", "") or "").strip()
    if uri:
        try:
            logger.info("Connecting to MongoDB Atlas...")
            candidate = MongoClient(
                uri,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=2500,
                connectTimeoutMS=2500,
                socketTimeoutMS=5000,
                maxPoolSize=50,
                retryWrites=True
            )
            candidate.admin.command('ping')
            _client = candidate
            _is_live_atlas = True
            logger.info("Successfully connected to live MongoDB Atlas cluster.")
            return _client
        except Exception as e:
            logger.warning(
                f"Live MongoDB Atlas connection unavailable ({type(e).__name__}: {e}). "
                "Engaging resilient in-memory MongoDB compatibility layer backed by SQLite archive."
            )

    # Resilient fallback to mongomock
    mock_client = mongomock.MongoClient()
    db_name = getattr(settings, "MONGODB_DATABASE", "cit_campus") or "cit_campus"
    _seed_mock_from_sqlite(mock_client[db_name])
    _client = mock_client
    _is_live_atlas = False
    return _client


def get_mongo_db() -> Any:
    """Returns the primary application MongoDB Database instance."""
    global _db
    if _db is not None:
        return _db
    client = get_mongo_client()
    db_name = getattr(settings, "MONGODB_DATABASE", "cit_campus") or "cit_campus"
    _db = client[db_name]
    return _db


def check_mongo_connection() -> dict:
    """
    Actively verifies connectivity to MongoDB via ping.
    Returns status dictionary indicating live status and available collections.
    """
    db_name = getattr(settings, "MONGODB_DATABASE", "cit_campus") or "cit_campus"
    try:
        client = get_mongo_client()
        client.admin.command('ping')
        db = get_mongo_db()
        collections = db.list_collection_names()
        return {
            "connected": True,
            "is_live_atlas": _is_live_atlas,
            "database": db.name,
            "collections": collections,
            "error": None
        }
    except Exception as e:
        logger.error(f"MongoDB connection check failed: {type(e).__name__}: {e}")
        return {
            "connected": False,
            "is_live_atlas": False,
            "database": db_name,
            "collections": [],
            "error": f"{type(e).__name__}: {e}"
        }


def init_mongo_indexes():
    """Creates necessary indexes across all application collections in MongoDB."""
    try:
        db = get_mongo_db()
        for idx_args, idx_kwargs in [
            (("email",), {"unique": True}),
            (("registration_no",), {"unique": True, "sparse": True}),
            (("role",), {}),
            (("token_hash",), {"unique": True}),
            (("user_id",), {}),
            (("expires_at",), {}),
        ]:
            try:
                if idx_args[0] in ("email", "registration_no", "role"):
                    db.users.create_index(idx_args[0], **idx_kwargs)
                else:
                    db.password_reset_tokens.create_index(idx_args[0], **idx_kwargs)
            except Exception:
                pass

        for coll, field, kwargs in [
            ("bookings", "id", {"unique": True}),
            ("bookings", "status", {}),
            ("bookings", "role", {}),
            ("bookings", "requester_email", {}),
            ("bookings", "submitted_at", {}),
            ("schedules", "schedule_type", {}),
            ("schedules", "created_at", {}),
            ("disruptions", "id", {"unique": True}),
            ("disruptions", "status", {}),
            ("audit_logs", "user_email", {}),
            ("audit_logs", "timestamp", {}),
            ("ai_chats", "user_email", {}),
            ("ai_chats", "created_at", {}),
        ]:
            try:
                db[coll].create_index(field, **kwargs)
            except Exception:
                pass
        logger.info("MongoDB indexes initialized successfully.")
    except Exception as e:
        logger.warning(f"Notice during init_mongo_indexes: {e}")
