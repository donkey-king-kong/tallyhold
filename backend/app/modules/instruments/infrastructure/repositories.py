"""SQLAlchemy implementation of the shared instrument persistence port."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.instruments.domain.models import Instrument
from app.modules.instruments.domain.repositories import InstrumentRepository
from app.modules.instruments.infrastructure.models import InstrumentRow
from app.shared.infrastructure.errors import execute_write


def _hydrate(row: InstrumentRow) -> Instrument:
    return Instrument(
        row.id, row.symbol, row.exchange, row.name, row.asset_type, row.currency
    )


class SqlAlchemyInstrumentRepository(InstrumentRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, instrument_id: UUID) -> Instrument | None:
        row = self.session.get(InstrumentRow, instrument_id)
        return _hydrate(row) if row is not None else None

    def find_by_symbol(self, symbol: str, exchange: str) -> Instrument | None:
        row = self.session.scalar(
            select(InstrumentRow).where(
                func.upper(InstrumentRow.symbol) == symbol.upper(),
                func.upper(InstrumentRow.exchange) == exchange.upper(),
            )
        )
        return _hydrate(row) if row is not None else None

    def save(self, instrument: Instrument) -> None:
        statement = insert(InstrumentRow).values(
            id=instrument.id,
            symbol=instrument.symbol,
            exchange=instrument.exchange,
            name=instrument.name,
            asset_type=instrument.asset_type,
            currency=instrument.currency,
        )
        execute_write(
            self.session,
            statement.on_conflict_do_update(
                index_elements=[InstrumentRow.id],
                set_={
                    key: getattr(statement.excluded, key)
                    for key in ("symbol", "exchange", "name", "asset_type", "currency")
                },
            ),
        )
