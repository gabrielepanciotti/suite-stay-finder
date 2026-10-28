"""Domain API for the StayFinder node — accommodation search (minimal).

CRUD over the async DB (see `db.py`) for `Stay`, the node's first domain
entity. Assisted/linked data only — no public-API scraping. Registered under
the `/api` prefix; there is no catch-all router here, so include order in
`app.py` is not load-bearing.
"""
from __future__ import annotations

import logging

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models, schemas
from .db import get_db_session
from .pagination import Pagina, apply_pagination, decode_cursor, encode_cursor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


async def _get_stay_or_404(session: AsyncSession, stay_id: int) -> models.Stay:
    result = await session.execute(
        select(models.Stay).where(models.Stay.id == stay_id, models.Stay.deleted_at.is_(None))
    )
    stay = result.scalar_one_or_none()
    if stay is None:
        raise HTTPException(status_code=404, detail="Stay not found")
    return stay


@router.post("/stays", response_model=schemas.StayOut, status_code=201)
async def create_stay(
    payload: schemas.StayCreate, session: AsyncSession = Depends(get_db_session)
) -> models.Stay:
    stay = models.Stay(**payload.model_dump())
    session.add(stay)
    await session.commit()
    await session.refresh(stay)
    logger.info("Created stay id=%s name=%s", stay.id, stay.name)
    return stay


@router.get("/stays", response_model=list[schemas.StayOut])
async def list_stays(
    location: str | None = None,
    kind: schemas.StayKind | None = None,
    session: AsyncSession = Depends(get_db_session),
) -> list[models.Stay]:
    query = select(models.Stay).where(models.Stay.deleted_at.is_(None))
    if location is not None:
        query = query.where(models.Stay.location == location)
    if kind is not None:
        query = query.where(models.Stay.kind == kind)
    result = await session.execute(query)
    return list(result.scalars().all())


@router.get("/stays/{stay_id}", response_model=schemas.StayOut)
async def get_stay(
    stay_id: int, session: AsyncSession = Depends(get_db_session)
) -> models.Stay:
    return await _get_stay_or_404(session, stay_id)


@router.patch("/stays/{stay_id}", response_model=schemas.StayOut)
@router.patch("/saved/{stay_id}", response_model=schemas.StayOut)
async def update_stay(
    stay_id: int,
    payload: schemas.StayUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> models.Stay:
    stay = await _get_stay_or_404(session, stay_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(stay, field, value)
    await session.commit()
    await session.refresh(stay)
    return stay


@router.delete("/stays/{stay_id}", status_code=204)
@router.delete("/saved/{stay_id}", status_code=204)
async def delete_stay(
    stay_id: int, session: AsyncSession = Depends(get_db_session)
) -> None:
    stay = await _get_stay_or_404(session, stay_id)
    stay.deleted_at = datetime.now(timezone.utc)
    await session.commit()


@router.get("/saved", response_model=Pagina[schemas.StayOut])
async def list_saved(
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = Query(None),
    q: str | None = Query(None),
    session: AsyncSession = Depends(get_db_session),
) -> Pagina[schemas.StayOut]:
    """Return active saved stays, newest first, using an opaque offset cursor."""
    offset = decode_cursor(cursor)
    filters = [models.Stay.deleted_at.is_(None)]
    if q:
        pattern = f"%{q.lower()}%"
        filters.append(
            or_(
                func.lower(models.Stay.name).like(pattern),
                func.lower(models.Stay.location).like(pattern),
            )
        )
    total = (
        await session.execute(select(func.count()).select_from(models.Stay).where(*filters))
    ).scalar_one()
    query = select(models.Stay).where(*filters).order_by(models.Stay.id.desc())
    items = list(
        (
            await session.execute(apply_pagination(query, limit=limit, cursor=cursor))
        ).scalars().all()
    )
    next_cursor = encode_cursor(offset + limit) if offset + len(items) < total else None
    return Pagina[schemas.StayOut](items=items, total=total, next_cursor=next_cursor)
