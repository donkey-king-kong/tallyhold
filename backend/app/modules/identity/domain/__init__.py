"""Identity domain."""

from app.modules.identity.domain.models import User
from app.modules.identity.domain.repositories import UserRepository

__all__ = ["User", "UserRepository"]
