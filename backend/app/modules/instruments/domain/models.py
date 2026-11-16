"""Instrument domain models."""

from dataclasses import dataclass
from uuid import UUID

from app.shared.domain.money import normalize_currency


@dataclass(frozen=True)
class Instrument:
    """A tradable instrument identified on one exchange."""

    id: UUID
    symbol: str
    exchange: str
    name: str
    asset_type: str
    currency: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "currency", normalize_currency(self.currency))
