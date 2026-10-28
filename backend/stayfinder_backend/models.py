"""SQLAlchemy models for the StayFinder node.

`Stay` is the node's first domain entity (accommodation-finder domain, see
`brain/conoscenza/stayfinder-scope.md`): an assisted/linked accommodation
record — never scraped from Booking/Airbnb public APIs, only data entered
by a human/agent plus external links.

Registered on `suite_backend_core.Base` — picked up automatically by
`alembic revision --autogenerate` via ../database/env.py.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from suite_backend_core import Base


def _utcnow() -> datetime:
    """Timezone-aware UTC now (``datetime.utcnow`` is deprecated)."""
    return datetime.now(timezone.utc)


class Stay(Base):
    """An accommodation option (hotel, apartment, hostel, ...) for a search.

    Populated by assisted ingest or manual link entry — `source` records how
    it arrived. No public-API scraping: `url` is an external link the user or
    agent supplied.
    """

    __tablename__ = "stays"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    location: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(20), nullable=False, default="other")
    url: Mapped[str | None] = mapped_column(Text)
    price_per_night: Mapped[float | None] = mapped_column(Numeric(10, 2))
    currency: Mapped[str | None] = mapped_column(String(3), default="EUR")
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    rating: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="assisted")
    created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
