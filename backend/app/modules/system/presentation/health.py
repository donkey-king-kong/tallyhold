"""Public liveness endpoint without user-specific data."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1")


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
