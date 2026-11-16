"""Account domain models."""

from dataclasses import dataclass
from uuid import UUID

from app.shared.domain.money import normalize_currency


@dataclass(frozen=True)
class Broker:
    """A brokerage institution."""

    id: UUID
    name: str
    country: str


@dataclass(frozen=True)
class Account:
    """One user's account held at one broker."""

    id: UUID
    user_id: UUID
    broker_id: UUID
    name: str
    currency: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "currency", normalize_currency(self.currency))
