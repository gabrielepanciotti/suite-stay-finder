"""Regression tests for the finder-standard additions."""
from __future__ import annotations

import asyncio
import importlib
import json
import os
import tempfile
from collections.abc import AsyncIterator
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from suite_backend_core import Base
from stayfinder_backend import models  # noqa: F401
from stayfinder_backend.app import app
from stayfinder_backend.db import get_db_session
from stayfinder_backend.vista import DEFAULT_VISTA

_db_path = Path(tempfile.mkdtemp(prefix="stayfinder_standard_test_")) / "store.db"
_engine = create_async_engine(f"sqlite+aiosqlite:///{_db_path.as_posix()}")
_TestSession = async_sessionmaker(_engine, expire_on_commit=False)
client = TestClient(app)


async def _override_get_db_session() -> AsyncIterator[AsyncSession]:
    async with _TestSession() as session:
        yield session


@pytest.fixture(autouse=True)
def _reset_db():
    app.dependency_overrides[get_db_session] = _override_get_db_session

    async def setup() -> None:
        async with _engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
            await connection.run_sync(Base.metadata.create_all)

    asyncio.run(setup())
    asyncio.run(_engine.dispose())
    yield
    asyncio.run(_engine.dispose())


def _stay(name: str, location: str = "Roma") -> dict:
    response = client.post("/api/stays", json={"name": name, "location": location})
    assert response.status_code == 201, response.text
    return response.json()


def test_saved_pagination_filters_and_soft_delete():
    first = _stay("Primo hotel", "Roma")
    _stay("Secondo appartamento", "Milano")
    third = _stay("Terzo hotel", "Roma")

    response = client.get("/api/saved", params={"limit": 2})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total"] == 3
    assert [item["id"] for item in body["items"]] == [third["id"], 2]
    assert body["next_cursor"] is not None

    last_page = client.get("/api/saved", params={"limit": 2, "cursor": body["next_cursor"]})
    assert last_page.status_code == 200
    assert [item["id"] for item in last_page.json()["items"]] == [first["id"]]
    assert last_page.json()["next_cursor"] is None
    assert client.get("/api/saved", params={"q": "roma"}).json()["total"] == 2

    assert client.delete(f"/api/saved/{first['id']}").status_code == 204
    assert client.get(f"/api/stays/{first['id']}").status_code == 404
    assert client.patch(f"/api/saved/{first['id']}", json={"notes": "ignored"}).status_code == 404
    assert client.get("/api/stays").json().__len__() == 2
    assert client.get("/api/saved").json()["total"] == 2


def test_saved_rejects_invalid_cursor_and_out_of_range_limit():
    assert client.get("/api/saved", params={"cursor": "not-a-cursor"}).status_code == 422
    assert client.get("/api/saved", params={"limit": 201}).status_code == 422


def test_error_envelope_for_validation_and_not_found():
    invalid = client.get("/api/saved", params={"limit": 201})
    assert invalid.status_code == 422
    assert invalid.json()["error"] == {
        "code": "validation_error",
        "message": "La richiesta contiene dati non validi.",
        "field": "limit",
    }
    missing = client.get("/api/stays/999")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "not_found"
    assert missing.json()["error"]["field"] is None
    assert missing.json()["detail"] == "Stay not found"


def test_default_vista_matches_node_config():
    config_path = Path(__file__).resolve().parents[2] / "node.config"
    assert json.loads(config_path.read_text(encoding="utf-8"))["vista"] == DEFAULT_VISTA


def test_vista_is_available_with_explicit_local_opt_in(monkeypatch):
    monkeypatch.setenv("ALLOW_DEV_OWNER", "1")
    monkeypatch.delenv("LIFE_GATE_JWKS_URL", raising=False)
    monkeypatch.delenv("LIFE_INSTANCE", raising=False)
    import stayfinder_backend.app as app_module

    reloaded = importlib.reload(app_module)
    response = TestClient(reloaded.app).get("/api/vista")
    assert response.status_code == 200, response.text
    assert response.json()["ruolo"] == "admin"
