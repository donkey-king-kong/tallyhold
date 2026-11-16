"""AC1, AC4-AC7: five domain ports against PostgreSQL-backed adapters."""

from dataclasses import replace
from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.modules.accounts.domain.models import Account, Broker
from app.modules.identity.domain.models import User
from app.modules.instruments.domain.models import Instrument
from app.modules.portfolio.domain.cost_basis import AverageCostStrategy
from app.modules.transactions.domain.models import Transaction, TransactionType
from app.shared.domain.money import Money


def entities() -> tuple[User, Broker, Account, Instrument, Transaction]:
    user = User(uuid4(), "USD")
    broker = Broker(uuid4(), "Tiger", "SG")
    account = Account(uuid4(), user.id, broker.id, "Long term", "USD")
    instrument = Instrument(uuid4(), "aApL", "Nasdaq", "Apple", "equity", "USD")
    transaction = Transaction(
        uuid4(),
        user.id,
        account.id,
        instrument.id,
        date(2025, 1, 15),
        TransactionType.BUY,
        Decimal("1.12345678"),
        Money(Decimal("123.123456"), "USD"),
        Money(Decimal("0.000001"), "USD"),
        "USD",
    )
    return user, broker, account, instrument, transaction


def seed(
    repos: dict[str, object],
) -> tuple[User, Broker, Account, Instrument, Transaction]:
    user, broker, account, instrument, transaction = entities()
    repos["users"].save(user)
    repos["brokers"].save(broker)
    repos["accounts"].save(user.id, account)
    repos["instruments"].save(instrument)
    return user, broker, account, instrument, transaction


def test_five_ports_round_trip_and_shared_reference_access(
    repos: dict[str, object],
    session: Session,
) -> None:
    from app.modules.accounts.domain.repositories import (
        AccountRepository,
        BrokerRepository,
    )
    from app.modules.identity.domain.repositories import UserRepository
    from app.modules.instruments.domain.repositories import InstrumentRepository
    from app.modules.transactions.domain.repositories import TransactionRepository

    for name, port in (
        ("users", UserRepository),
        ("brokers", BrokerRepository),
        ("accounts", AccountRepository),
        ("instruments", InstrumentRepository),
        ("transactions", TransactionRepository),
    ):
        assert isinstance(repos[name], port)
    user, broker, account, instrument, transaction = seed(repos)
    repos["transactions"].save(user.id, transaction)
    session.flush()
    session.expire_all()
    assert repos["users"].get(user.id) == user
    assert repos["brokers"].get(broker.id) == broker
    assert broker in repos["brokers"].list_all()
    assert repos["accounts"].get(user.id, account.id) == account
    assert account in repos["accounts"].list_for_user(user.id)
    assert repos["instruments"].get(instrument.id) == instrument
    assert repos["instruments"].find_by_symbol("AAPL", "NASDAQ") == instrument
    assert repos["transactions"].get(user.id, transaction.id) == transaction
    assert list(repos["transactions"].list_for_account(user.id, account.id)) == [
        transaction
    ]
    assert isinstance(
        repos["transactions"].get(user.id, transaction.id).quantity, Decimal
    )
    assert isinstance(
        repos["transactions"].get(user.id, transaction.id).type, TransactionType
    )
    # A repository flush cannot decide the caller's transaction boundary.
    assert session.in_transaction()


def test_supported_replacements_and_deletions(
    repos: dict[str, object], session: Session
) -> None:
    user, broker, account, instrument, transaction = seed(repos)
    repos["transactions"].save(user.id, transaction)
    original_account_audit = session.execute(
        text("SELECT created_at, updated_at FROM broker_accounts WHERE id = :id"),
        {"id": account.id},
    ).one()
    original_trade_audit = session.execute(
        text("SELECT created_at, updated_at FROM transactions WHERE id = :id"),
        {"id": transaction.id},
    ).one()
    changed_account = replace(account, name="Retirement")
    changed_transaction = replace(transaction, fee=Money(Decimal("2.250000"), "USD"))
    repos["accounts"].save(user.id, changed_account)
    repos["transactions"].save(user.id, changed_transaction)
    for table, id_, original in (
        ("broker_accounts", account.id, original_account_audit),
        ("transactions", transaction.id, original_trade_audit),
    ):
        changed = session.execute(
            text(f"SELECT created_at, updated_at FROM {table} WHERE id = :id"),
            {"id": id_},
        ).one()
        assert changed.created_at == original.created_at
        assert changed.updated_at > original.updated_at
    session.expire_all()
    assert repos["accounts"].get(user.id, account.id) == changed_account
    assert repos["transactions"].get(user.id, transaction.id) == changed_transaction
    repos["transactions"].delete(user.id, transaction.id)
    assert repos["transactions"].get(user.id, transaction.id) is None
    repos["accounts"].delete(user.id, account.id)
    assert repos["accounts"].get(user.id, account.id) is None
    assert repos["brokers"].get(broker.id) == broker
    assert repos["instruments"].get(instrument.id) == instrument


def test_scoped_reads_writes_deletes_and_owner_mismatch(
    repos: dict[str, object],
    session: Session,
) -> None:
    user, _, account, _, transaction = seed(repos)
    other = User(uuid4(), "SGD")
    repos["users"].save(other)
    repos["transactions"].save(user.id, transaction)
    assert repos["accounts"].get(other.id, account.id) is None
    assert account not in repos["accounts"].list_for_user(other.id)
    assert repos["transactions"].get(other.id, transaction.id) is None
    assert not repos["transactions"].list_for_account(other.id, account.id)
    repos["accounts"].delete(other.id, account.id)
    repos["transactions"].delete(other.id, transaction.id)
    assert repos["accounts"].get(user.id, account.id) == account
    assert repos["transactions"].get(user.id, transaction.id) == transaction
    with pytest.raises(ValueError):
        repos["accounts"].save(other.id, account)
    with pytest.raises(ValueError):
        repos["transactions"].save(other.id, transaction)
    session.expire_all()
    assert repos["accounts"].get(user.id, account.id) == account
    assert repos["transactions"].get(user.id, transaction.id) == transaction


@pytest.mark.parametrize(
    ("field", "value"),
    (
        ("quantity", Decimal("1.123456789")),
        ("quantity", Decimal("12345678901.00000000")),
        ("unit_price", Money(Decimal("1.0000001"), "USD")),
        ("unit_price", Money(Decimal("100000000000000.000000"), "USD")),
        ("fee", Money(Decimal("0.0000001"), "USD")),
    ),
)
def test_overprecision_is_rejected_before_postgres_rounds(
    repos: dict[str, object],
    field: str,
    value: object,
) -> None:
    user, _, _, _, transaction = seed(repos)
    with pytest.raises(ValueError):
        repos["transactions"].save(user.id, replace(transaction, **{field: value}))
    assert repos["transactions"].get(user.id, transaction.id) is None


def test_constraint_error_is_translated_and_caller_rollback_is_atomic(
    repos: dict[str, object],
    session: Session,
) -> None:
    user, broker, account, _, _ = entities()
    # The caller, not the adapter, controls the commit of related writes.
    with pytest.raises(Exception) as caught:
        repos["users"].save(user)
        repos["brokers"].save(broker)
        repos["accounts"].save(user.id, replace(account, broker_id=uuid4()))
    assert type(caught.value).__name__ == "PersistenceConstraintError"
    assert isinstance(caught.value.constraint_name, str)
    assert caught.value.constraint_name
    session.rollback()
    assert repos["users"].get(user.id) is None
    assert repos["brokers"].get(broker.id) is None


def test_same_day_order_and_replace_preserve_entry_sequence(
    repos: dict[str, object],
    session: Session,
) -> None:
    user, _, account, instrument, buy = seed(repos)
    buy = replace(buy, id=UUID(int=2), quantity=Decimal("2"))
    sell = replace(
        buy,
        id=UUID(int=1),
        type=TransactionType.SELL,
        quantity=Decimal("1"),
        unit_price=Money(Decimal("140"), "USD"),
    )
    repos["transactions"].save(user.id, buy)
    repos["transactions"].save(user.id, sell)
    before = list(repos["transactions"].list_for_account(user.id, account.id))
    assert [item.id for item in before] == [buy.id, sell.id]
    positions, realised = AverageCostStrategy().derive(before)
    assert positions[0].quantity == Decimal("1")
    assert len(realised) == 1
    original = session.execute(
        text("SELECT entry_seq, created_at FROM transactions WHERE id = :id"),
        {"id": buy.id},
    ).one()
    assert isinstance(original.entry_seq, int)
    repos["transactions"].save(
        user.id, replace(buy, unit_price=Money(Decimal("125"), "USD"))
    )
    assert (
        session.execute(
            text("SELECT entry_seq, created_at FROM transactions WHERE id = :id"),
            {"id": buy.id},
        ).one()
        == original
    )
    assert [
        item.id for item in repos["transactions"].list_for_account(user.id, account.id)
    ] == [
        buy.id,
        sell.id,
    ]


@pytest.mark.parametrize("name", ("accounts", "transactions"))
def test_foreign_id_replace_is_generic_and_leaves_row_identical(
    repos: dict[str, object],
    session: Session,
    name: str,
) -> None:
    owner, _, account, _, transaction = seed(repos)
    other = User(uuid4(), "USD")
    repos["users"].save(other)
    repos["transactions"].save(owner.id, transaction)
    table, entity = (
        ("broker_accounts", account)
        if name == "accounts"
        else ("transactions", transaction)
    )
    before = session.execute(
        text(f"SELECT row_to_json(t)::text FROM {table} t WHERE id = :id"),
        {"id": entity.id},
    ).scalar_one()
    with pytest.raises(Exception) as caught:
        repos[name].save(other.id, replace(entity, user_id=other.id))
    assert type(caught.value).__name__ == "PersistenceConstraintError"
    after = session.execute(
        text(f"SELECT row_to_json(t)::text FROM {table} t WHERE id = :id"),
        {"id": entity.id},
    ).scalar_one()
    assert after == before
