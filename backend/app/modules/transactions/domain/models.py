"""Transaction domain models."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from app.shared.domain.money import Money, normalize_currency


class TransactionType(StrEnum):
    """Transaction kinds supported by the core domain."""

    BUY = "BUY"
    SELL = "SELL"


@dataclass(frozen=True)
class Transaction:
    """An immutable buy or sell transaction."""

    id: UUID
    user_id: UUID
    account_id: UUID
    instrument_id: UUID
    trade_date: date
    type: TransactionType
    quantity: Decimal
    unit_price: Money
    fee: Money
    instrument_currency: str

    def __post_init__(self) -> None:
        if not isinstance(self.type, TransactionType):
            raise TypeError("transaction type must be BUY or SELL")
        if not isinstance(self.quantity, Decimal):
            raise TypeError("transaction quantity must be Decimal")
        if self.quantity <= 0:
            raise ValueError("transaction quantity must be positive")
        if self.unit_price.amount <= 0:
            raise ValueError("transaction unit price must be positive")
        if self.fee.amount < 0:
            raise ValueError("transaction fee must be non-negative")

        currency = normalize_currency(self.instrument_currency)
        if self.unit_price.currency != currency or self.fee.currency != currency:
            raise ValueError("transaction money must use instrument currency")
        object.__setattr__(self, "instrument_currency", currency)

    @property
    def transaction_kind(self) -> str:
        """Expose the kind without coupling portfolio code to this enum."""
        return self.type.value
