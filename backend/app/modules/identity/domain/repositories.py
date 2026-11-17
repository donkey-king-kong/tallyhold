"""Identity persistence ports."""

from abc import ABC, abstractmethod
from contextlib import AbstractContextManager
from uuid import UUID

from app.modules.identity.domain.models import User, VerifiedPrincipal


class UserRepository(ABC):
    """Persistence contract for users."""

    @abstractmethod
    def get(self, user_id: UUID) -> User | None:
        """Return one user when present."""

    @abstractmethod
    def save(self, user: User) -> None:
        """Persist a user."""


class IdentityConflict(ValueError):
    """Another transaction already linked this verified identity pair."""


class IdentityRepository(ABC):
    """Lookup and serialize provisioning by verified issuer and subject."""

    @abstractmethod
    def get(self, principal: VerifiedPrincipal) -> UUID | None:
        """Return the internal user ID for one verified pair."""

    @abstractmethod
    def serialize_provisioning(self, principal: VerifiedPrincipal) -> None:
        """Take a transaction-scoped lock shared with the erasure operator."""

    @abstractmethod
    def savepoint(self) -> AbstractContextManager[None]:
        """Keep a failed candidate user out of the caller's transaction."""

    @abstractmethod
    def link(self, principal: VerifiedPrincipal, user_id: UUID) -> None:
        """Insert the identity, reporting only its unique-pair conflict."""


class DenyMarkerRepository(ABC):
    """Read-only application access to operator-owned erasure markers."""

    @abstractmethod
    def contains(self, principal: VerifiedPrincipal) -> bool:
        """Deny even when marker expiry has passed but purge has not run."""
