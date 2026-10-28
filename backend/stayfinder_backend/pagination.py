"""Cursor pagination shared by the finder endpoints."""
from __future__ import annotations

import base64
from typing import Generic, TypeVar

from fastapi import HTTPException, Query
from pydantic import BaseModel

T = TypeVar("T")


class Pagina(BaseModel, Generic[T]):
    """A stable cursor-paginated response envelope."""

    items: list[T]
    total: int
    next_cursor: str | None = None


def _invalid_cursor() -> HTTPException:
    return HTTPException(status_code=422, detail="Cursor non valido")


def decode_cursor(cursor: str | None) -> int:
    """Decode an opaque URL-safe base64 offset, rejecting malformed values."""
    if cursor is None:
        return 0
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        value = base64.urlsafe_b64decode(padded.encode("ascii")).decode("ascii")
        offset = int(value)
    except (UnicodeEncodeError, UnicodeDecodeError, ValueError, base64.binascii.Error):
        raise _invalid_cursor() from None
    if offset < 0 or str(offset) != value:
        raise _invalid_cursor()
    return offset


def encode_cursor(offset: int) -> str:
    return base64.urlsafe_b64encode(str(offset).encode("ascii")).decode("ascii").rstrip("=")


def pagination_params(
    limit: int = Query(50, ge=1, le=200), cursor: str | None = Query(None)
) -> tuple[int, int]:
    """FastAPI dependency returning validated ``(limit, offset)`` values."""
    return limit, decode_cursor(cursor)


def apply_pagination(query_or_items, *, limit: int, cursor: str | None = None):
    """Apply cursor offset and limit to a SQLAlchemy selectable or a list.

    The caller keeps ownership of counting so this helper works for both sync
    collections and async SQLAlchemy sessions.
    """
    offset = decode_cursor(cursor)
    if isinstance(query_or_items, list):
        return query_or_items[offset : offset + limit]
    return query_or_items.offset(offset).limit(limit)
