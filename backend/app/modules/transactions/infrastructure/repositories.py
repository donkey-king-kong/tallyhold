"""SQLAlchemy implementation of the user-scoped transaction port."""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.transactions.domain.models import Transaction, TransactionType
from app.modules.transactions.domain.repositories import TransactionRepository
from app.modules.transactions.infrastructure.models import TransactionRow
from app.shared.domain.money import Money
from app.shared.infrastructure.errors import PersistenceConstraintError, execute_write


def _exact(value: Decimal, precision: int, scale: int) -> Decimal:
    exponent = value.as_tuple().exponent
    if (
        not value.is_finite()
        or not isinstance(exponent, int)
        or exponent < -scale
        or abs(value) >= Decimal(10) ** (precision - scale)
    ):
        raise ValueError("value exceeds database numeric precision or scale")
    return value


def _transaction(row: TransactionRow) -> Transaction:
    return Transaction(
        id=row.id,
        user_id=row.user_id,
        account_id=row.broker_account_id,
        instrument_id=row.instrument_id,
        trade_date=row.trade_date,
        type=TransactionType(row.type),
        quantity=row.quantity,
        unit_price=Money(row.unit_price_amount, row.instrument_currency),
        fee=Money(row.fee_amount, row.instrument_currency),
        instrument_currency=row.instrument_currency,
    )


class SqlAlchemyTransactionRepository(TransactionRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, user_id: UUID, transaction_id: UUID) -> Transaction | None:
        row = self.session.scalar(
            select(TransactionRow).where(
                TransactionRow.user_id == user_id,
                TransactionRow.id == transaction_id,
            )
        )
        return _transaction(row) if row is not None else None

    def list_for_account(self, user_id: UUID, account_id: UUID) -> list[Transaction]:
        rows = self.session.scalars(
            select(TransactionRow)
            .where(
                TransactionRow.user_id == user_id,
                TransactionRow.broker_account_id == account_id,
            )
            .order_by(TransactionRow.trade_date, TransactionRow.entry_seq)
        ).all()
        return [_transaction(row) for row in rows]

    def save(self, user_id: UUID, transaction: Transaction) -> None:
        if transaction.user_id != user_id:
            raise ValueError("transaction owner mismatch")
        statement = insert(TransactionRow).values(
            id=transaction.id,
            user_id=user_id,
            broker_account_id=transaction.account_id,
            instrument_id=transaction.instrument_id,
            trade_date=transaction.trade_date,
            type=transaction.type.value,
            quantity=_exact(transaction.quantity, 18, 8),
            unit_price_amount=_exact(transaction.unit_price.amount, 20, 6),
            fee_amount=_exact(transaction.fee.amount, 20, 6),
            instrument_currency=transaction.instrument_currency,
        )
        count = execute_write(
            self.session,
            statement.on_conflict_do_update(
                index_elements=[TransactionRow.id],
                set_={
                    key: getattr(statement.excluded, key)
                    for key in (
                        "broker_account_id",
                        "instrument_id",
                        "trade_date",
                        "type",
                        "quantity",
                        "unit_price_amount",
                        "fee_amount",
                        "instrument_currency",
                    )
                }
                | {"updated_at": func.clock_timestamp()},
                where=TransactionRow.user_id == statement.excluded.user_id,
            ),
        )
        if count == 0:
            raise PersistenceConstraintError("owner_scope")

    def delete(self, user_id: UUID, transaction_id: UUID) -> None:
        execute_write(
            self.session,
            delete(TransactionRow).where(
                TransactionRow.user_id == user_id,
                TransactionRow.id == transaction_id,
            ),
        )
