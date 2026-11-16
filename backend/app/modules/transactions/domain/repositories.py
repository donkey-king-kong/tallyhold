"""Transaction persistence ports."""

from abc import ABC, abstractmethod
from collections.abc import Sequence
from uuid import UUID

from app.modules.transactions.domain.models import Transaction


class TransactionRepository(ABC):
    """User-scoped persistence contract for transactions."""

    @abstractmethod
    def get(self, user_id: UUID, transaction_id: UUID) -> Transaction | None:
        """Return one user-owned transaction when present."""

    @abstractmethod
    def list_for_account(
        self, user_id: UUID, account_id: UUID
    ) -> Sequence[Transaction]:
        """Return transactions for one user-owned account."""

    @abstractmethod
    def save(self, user_id: UUID, transaction: Transaction) -> None:
        """Persist a transaction within its owner scope."""

    @abstractmethod
    def delete(self, user_id: UUID, transaction_id: UUID) -> None:
        """Delete a transaction within its owner scope."""
