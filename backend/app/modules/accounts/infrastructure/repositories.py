"""SQLAlchemy implementations of account-module persistence ports."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.accounts.domain.models import Broker
from app.modules.accounts.domain.repositories import BrokerRepository
from app.modules.accounts.infrastructure.models import BrokerRow
from app.shared.infrastructure.errors import execute_write


class SqlAlchemyBrokerRepository(BrokerRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, broker_id: UUID) -> Broker | None:
        row = self.session.get(BrokerRow, broker_id)
        return Broker(row.id, row.name, row.country) if row is not None else None

    def list_all(self) -> list[Broker]:
        rows = self.session.scalars(select(BrokerRow).order_by(BrokerRow.name)).all()
        return [Broker(row.id, row.name, row.country) for row in rows]

    def save(self, broker: Broker) -> None:
        statement = insert(BrokerRow).values(
            id=broker.id, name=broker.name, country=broker.country
        )
        execute_write(
            self.session,
            statement.on_conflict_do_update(
                index_elements=[BrokerRow.id],
                set_={
                    "name": statement.excluded.name,
                    "country": statement.excluded.country,
                },
            ),
        )
