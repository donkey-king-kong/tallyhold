"""Bearer-protected current-user endpoint."""

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.modules.identity.domain.models import User
from app.modules.identity.presentation.schemas import CurrentUserResponse

router = APIRouter(prefix="/api/v1")


@router.get("/me", response_model=CurrentUserResponse)
def current_user(user: User = Depends(get_current_user)) -> CurrentUserResponse:
    return CurrentUserResponse(id=user.id, base_currency=user.base_currency)
