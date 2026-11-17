"""Identity domain models."""

from dataclasses import dataclass
from uuid import UUID

from app.shared.domain.money import normalize_currency


@dataclass(frozen=True)
class User:
    """A Tallyhold user with a preferred base currency."""

    id: UUID
    base_currency: str

    def __post_init__(self) -> None:
        object.__setattr__(
            self, "base_currency", normalize_currency(self.base_currency)
        )


@dataclass(frozen=True)
class VerifiedPrincipal:
    """Identity claims obtained only after trusted signature verification."""

    issuer: str
    subject: str
    provider: str | None = None
