"""Public current-user response."""

from uuid import UUID

from pydantic import BaseModel


class CurrentUserResponse(BaseModel):
    id: UUID
    base_currency: str
