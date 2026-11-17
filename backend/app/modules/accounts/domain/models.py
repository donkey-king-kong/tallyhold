"""Account domain models."""

from dataclasses import dataclass
from uuid import UUID

from app.shared.domain.money import normalize_currency


def normalize_account_name(name: str) -> str:
    """Keep display case while enforcing the account-name contract."""
    if not isinstance(name, str):
        raise ValueError("account name must be text")
    normalized = name.strip(" \t\n\r\f\v")
    if not normalized or len(normalized) > 255:
        raise ValueError("account name must contain 1-255 characters")
    return normalized


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
