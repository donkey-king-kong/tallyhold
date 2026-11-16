"""Portfolio domain models."""

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from app.shared.domain import Money


@dataclass(frozen=True)
class Position:
    """An open holding derived from transactions."""

    account_id: UUID
    instrument_id: UUID
    quantity: Decimal
    cost_basis: Money

    def __post_init__(self) -> None:
        if not isinstance(self.quantity, Decimal):
            raise TypeError("position quantity must be Decimal")
        if self.quantity <= 0:
            raise ValueError("position quantity must be positive")


@dataclass(frozen=True)
class RealisedResult:
    """The exact financial result of one sale."""

    transaction_id: UUID
    net_proceeds: Money
    consumed_basis: Money
    realised_pnl: Money
