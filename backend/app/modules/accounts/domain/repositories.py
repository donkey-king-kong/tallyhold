"""Account persistence ports."""

from abc import ABC, abstractmethod
from collections.abc import Sequence
from uuid import UUID

from app.modules.accounts.domain.models import Account, Broker


class BrokerRepository(ABC):
    """Persistence contract for broker reference data."""

    @abstractmethod
    def get(self, broker_id: UUID) -> Broker | None:
        """Return one broker when present."""

    @abstractmethod
    def list_all(self) -> Sequence[Broker]:
        """Return all brokers."""

    @abstractmethod
    def save(self, broker: Broker) -> None:
        """Persist a broker."""


class AccountRepository(ABC):
    """User-scoped persistence contract for broker accounts."""

    @abstractmethod
    def get(self, user_id: UUID, account_id: UUID) -> Account | None:
        """Return one user-owned account when present."""

    @abstractmethod
    def list_for_user(self, user_id: UUID) -> Sequence[Account]:
        """Return every account owned by a user."""

    @abstractmethod
    def save(self, user_id: UUID, account: Account) -> None:
        """Persist an account within its owner scope."""

    @abstractmethod
    def delete(self, user_id: UUID, account_id: UUID) -> None:
        """Delete an account within its owner scope."""
