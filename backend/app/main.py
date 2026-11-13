"""ASGI entry point for the modular API."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.system.presentation.health import router as health_router

app = FastAPI(title="Tallyhold API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(health_router)
