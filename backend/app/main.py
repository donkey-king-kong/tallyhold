"""ASGI entry point for the modular API."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.identity.presentation.router import router as identity_router
from app.modules.system.presentation.health import router as health_router

app = FastAPI(title="Tallyhold API")
origins = os.getenv(
    "FRONTEND_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
    allow_methods=["GET"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(health_router)
app.include_router(identity_router)
