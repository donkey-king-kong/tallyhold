"""Instrument persistence ports."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.modules.instruments.domain.models import Instrument


class InstrumentRepository(ABC):
    """Persistence contract for tradable instruments."""

    @abstractmethod
    def get(self, instrument_id: UUID) -> Instrument | None:
        """Return one instrument when present."""

    @abstractmethod
    def find_by_symbol(self, symbol: str, exchange: str) -> Instrument | None:
        """Return an instrument by its market identity."""

    @abstractmethod
    def save(self, instrument: Instrument) -> None:
        """Persist an instrument."""
