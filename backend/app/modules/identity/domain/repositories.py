"""Identity persistence ports."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.modules.identity.domain.models import User


class UserRepository(ABC):
    """Persistence contract for users."""

    @abstractmethod
    def get(self, user_id: UUID) -> User | None:
        """Return one user when present."""

    @abstractmethod
    def save(self, user: User) -> None:
        """Persist a user."""
