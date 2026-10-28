"""API-level tests for the StayFinder domain store — `Stay`.

Exercises the CRUD routes in `stayfinder_backend/routes.py` against a real
async SQLite DB, overriding the production `get_db_session` dependency.

Setup notes (async sqlite): a dedicated async engine on a temp-file DB is used
instead of `:memory:` — `TestClient` runs each request in its own anyio
worker/event loop, and a shared in-memory connection is loop-bound and breaks
across loops; a file DB lets every connection reopen the same data. Mirrors
the Travel node's `test_store_api.py` fixture wiring.
"""

from __future__ import annotations

import asyncio
import os
import tempfile
from collections.abc import AsyncIterator
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from suite_backend_core import Base
from stayfinder_backend import models  # noqa: F401  (registers tables on Base.metadata)
from stayfinder_backend.app import app
from stayfinder_backend.db import get_db_session

# --- Test DB wiring -----------------------------------------------------------

_TMP_DIR = tempfile.mkdtemp(prefix="stayfinder_store_test_")
_DB_PATH = Path(_TMP_DIR) / "store_test.db"
_engine = create_async_engine(f"sqlite+aiosqlite:///{_DB_PATH.as_posix()}")


@event.listens_for(_engine.sync_engine, "connect")
def _enable_sqlite_fk(dbapi_conn, _record):  # pragma: no cover - trivial hook
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA foreign_keys=ON")
    cur.close()


_TestSession = async_sessionmaker(_engine, expire_on_commit=False)


async def _override_get_db_session() -> AsyncIterator[AsyncSession]:
    async with _TestSession() as session:
        yield session


client = TestClient(app)


@pytest.fixture(autouse=True)
def _reset_db():
    """Fresh schema per test for isolation; dispose to drop loop-bound conns."""
    app.dependency_overrides[get_db_session] = _override_get_db_session

    async def _setup() -> None:
        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_setup())
    asyncio.run(_engine.dispose())
    yield
    asyncio.run(_engine.dispose())


# --- Helpers ------------------------------------------------------------------


def _make_stay(name: str = "Hotel Central", location: str = "Praga", kind: str = "hotel") -> dict:
    resp = client.post(
        "/api/stays",
        json={"name": name, "location": location, "kind": kind},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# --- Tests --------------------------------------------------------------------


def test_create_stay():
    resp = client.post(
        "/api/stays",
        json={
            "name": "Casa Vista",
            "location": "Lisbona",
            "kind": "apartment",
            "url": "https://example.com/casa-vista",
            "price_per_night": "82.50",
            "rating": 4.6,
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["id"] > 0
    assert data["name"] == "Casa Vista"
    assert data["location"] == "Lisbona"
    assert data["kind"] == "apartment"
    assert data["currency"] == "EUR"  # default
    assert data["source"] == "assisted"  # default
    assert data["created"] is not None
    assert data["updated"] is not None


def test_get_stay():
    created = _make_stay()
    resp = client.get(f"/api/stays/{created['id']}")
    assert resp.status_code == 200, resp.text
    assert resp.json()["name"] == "Hotel Central"


def test_get_stay_404():
    resp = client.get("/api/stays/999999")
    assert resp.status_code == 404


def test_list_stays():
    _make_stay(name="A", location="Praga", kind="hotel")
    _make_stay(name="B", location="Lisbona", kind="hostel")
    resp = client.get("/api/stays")
    assert resp.status_code == 200, resp.text
    assert len(resp.json()) == 2


def test_list_stays_filter_by_location():
    _make_stay(name="A", location="Praga", kind="hotel")
    _make_stay(name="B", location="Lisbona", kind="hostel")
    resp = client.get("/api/stays", params={"location": "Praga"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert len(data) == 1
    assert data[0]["location"] == "Praga"


def test_list_stays_filter_by_kind():
    _make_stay(name="A", location="Praga", kind="hotel")
    _make_stay(name="B", location="Praga", kind="hostel")
    resp = client.get("/api/stays", params={"kind": "hostel"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert len(data) == 1
    assert data[0]["kind"] == "hostel"


def test_patch_stay():
    created = _make_stay()
    resp = client.patch(
        f"/api/stays/{created['id']}", json={"rating": 4.9, "notes": "great view"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["rating"] == 4.9
    assert data["notes"] == "great view"


def test_delete_stay():
    created = _make_stay()
    resp = client.delete(f"/api/stays/{created['id']}")
    assert resp.status_code == 204
    assert client.get(f"/api/stays/{created['id']}").status_code == 404
