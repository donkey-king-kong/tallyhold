"""Currency-safe monetary values."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


def normalize_currency(currency: str) -> str:
    """Return a normalized three-letter currency code."""
    if (
        not isinstance(currency, str)
        or len(currency) != 3
        or not currency.isascii()
        or not currency.isalpha()
    ):
        raise ValueError("currency must be a three-letter ASCII code")
    return currency.upper()


@dataclass(frozen=True)
class Money:
    """An exact amount denominated in one currency."""

    amount: Decimal
    currency: str

    def __post_init__(self) -> None:
        if not isinstance(self.amount, Decimal):
            raise TypeError("money amount must be Decimal")
        object.__setattr__(self, "currency", normalize_currency(self.currency))

    def __add__(self, other: object) -> Money:
        if not isinstance(other, Money):
            return NotImplemented
        self._require_same_currency(other)
        return Money(self.amount + other.amount, self.currency)

    def __sub__(self, other: object) -> Money:
        if not isinstance(other, Money):
            return NotImplemented
        self._require_same_currency(other)
        return Money(self.amount - other.amount, self.currency)

    def __mul__(self, scalar: object) -> Money:
        if not isinstance(scalar, Decimal):
            raise TypeError("money scalar must be Decimal")
        return Money(self.amount * scalar, self.currency)

    def _require_same_currency(self, other: Money) -> None:
        if self.currency != other.currency:
            raise ValueError("money currencies must match")
