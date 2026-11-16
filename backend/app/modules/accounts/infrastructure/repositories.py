"""SQLAlchemy implementations of account-module persistence ports."""

from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.accounts.domain.models import Account, Broker
from app.modules.accounts.domain.repositories import AccountRepository, BrokerRepository
from app.modules.accounts.infrastructure.models import AccountRow, BrokerRow
from app.shared.infrastructure.errors import PersistenceConstraintError, execute_write


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


def _account(row: AccountRow) -> Account:
    return Account(row.id, row.user_id, row.broker_id, row.name, row.currency)


class SqlAlchemyAccountRepository(AccountRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, user_id: UUID, account_id: UUID) -> Account | None:
        row = self.session.scalar(
            select(AccountRow).where(
                AccountRow.user_id == user_id, AccountRow.id == account_id
            )
        )
        return _account(row) if row is not None else None

    def list_for_user(self, user_id: UUID) -> list[Account]:
        rows = self.session.scalars(
            select(AccountRow)
            .where(AccountRow.user_id == user_id)
            .order_by(AccountRow.id)
        ).all()
        return [_account(row) for row in rows]

    def save(self, user_id: UUID, account: Account) -> None:
        if account.user_id != user_id:
            raise ValueError("account owner mismatch")
        statement = insert(AccountRow).values(
            id=account.id,
            user_id=user_id,
            broker_id=account.broker_id,
            name=account.name,
            currency=account.currency,
        )
        count = execute_write(
            self.session,
            statement.on_conflict_do_update(
                index_elements=[AccountRow.id],
                set_={
                    "broker_id": statement.excluded.broker_id,
                    "name": statement.excluded.name,
                    "currency": statement.excluded.currency,
                    "updated_at": func.clock_timestamp(),
                },
                where=AccountRow.user_id == statement.excluded.user_id,
            ),
        )
        if count == 0:
            raise PersistenceConstraintError("owner_scope")

    def delete(self, user_id: UUID, account_id: UUID) -> None:
        execute_write(
            self.session,
            delete(AccountRow).where(
                AccountRow.user_id == user_id, AccountRow.id == account_id
            ),
        )
