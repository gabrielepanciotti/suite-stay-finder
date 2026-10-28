"""Compatibility-preserving API error envelopes."""
from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def install_error_handlers(app: FastAPI) -> None:
    """Install the finder error contract without dropping FastAPI's detail."""

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
        code = "not_found" if exc.status_code == 404 else f"http_{exc.status_code}"
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {"code": code, "message": str(exc.detail), "field": None},
                "detail": jsonable_encoder(exc.detail),
            },
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        details = exc.errors()
        field = str(details[0]["loc"][-1]) if details and details[0].get("loc") else None
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "La richiesta contiene dati non validi.",
                    "field": field,
                },
                "detail": jsonable_encoder(details),
            },
        )
