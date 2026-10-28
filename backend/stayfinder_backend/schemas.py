"""Pydantic schemas for the StayFinder node's structured store.

One `StayCreate` / `StayUpdate` / `StayOut` triple for the `Stay` model in
`models.py`. `StayUpdate` fields are all optional (partial PATCH); `StayOut`
mirrors the ORM model via `from_attributes=True`. Enum-like string columns
are constrained with `Literal[...]`.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict

StayKind = Literal["hotel", "apartment", "hostel", "bnb", "camping", "other"]
StaySource = Literal["assisted", "link", "manual", "agent"]


class StayCreate(BaseModel):
    name: str
    location: str
    kind: StayKind = "other"
    url: str | None = None
    price_per_night: Decimal | None = None
    currency: str | None = "EUR"
    lat: float | None = None
    lng: float | None = None
    rating: float | None = None
    notes: str | None = None
    source: StaySource = "assisted"


class StayUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    kind: StayKind | None = None
    url: str | None = None
    price_per_night: Decimal | None = None
    currency: str | None = None
    lat: float | None = None
    lng: float | None = None
    rating: float | None = None
    notes: str | None = None
    source: StaySource | None = None


class StayOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: str
    kind: str
    url: str | None = None
    price_per_night: Decimal | None = None
    currency: str | None = None
    lat: float | None = None
    lng: float | None = None
    rating: float | None = None
    notes: str | None = None
    source: str
    created: datetime | None = None
    updated: datetime | None = None
