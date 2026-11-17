"""ASGI entry point for the modular API."""

import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.dependencies import get_current_user, get_db_session
from app.modules.accounts.presentation.errors import register_account_errors
from app.modules.accounts.presentation.router import account_router
from app.modules.identity.presentation.router import router as identity_router
from app.modules.system.presentation.health import router as health_router

app = FastAPI(title="Tallyhold API")
origins = os.getenv(
    "FRONTEND_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(health_router)
app.include_router(identity_router)
app.include_router(account_router(get_current_user, get_db_session))
register_account_errors(app)


@app.exception_handler(OperationalError)
async def database_unavailable(
    _request: Request, _error: OperationalError
) -> JSONResponse:
    return JSONResponse({"detail": "Service unavailable"}, status_code=503)
