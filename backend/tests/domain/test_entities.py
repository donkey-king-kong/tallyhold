"""AC2 and AC10: owned entities and the BUY/SELL transaction boundary."""

from dataclasses import FrozenInstanceError
from datetime import date
from decimal import Decimal
from uuid import UUID

import pytest

USER_ID = UUID("00000000-0000-0000-0000-000000000001")
BROKER_ID = UUID("00000000-0000-0000-0000-000000000002")
ACCOUNT_ID = UUID("00000000-0000-0000-0000-000000000003")
INSTRUMENT_ID = UUID("00000000-0000-0000-0000-000000000004")
TRANSACTION_ID = UUID("00000000-0000-0000-0000-000000000005")


def _transaction_types(public_contract):
    Money = public_contract.export("app.shared.domain", "Money")
    domain = "app.modules.transactions.domain"
    Transaction = public_contract.export(domain, "Transaction")
    TransactionType = public_contract.export(domain, "TransactionType")
    return Money, Transaction, TransactionType


def _valid_transaction(public_contract, **changes):
    Money, Transaction, TransactionType = _transaction_types(public_contract)
    values = {
        "id": TRANSACTION_ID,
        "user_id": USER_ID,
        "account_id": ACCOUNT_ID,
        "instrument_id": INSTRUMENT_ID,
        "trade_date": date(2026, 1, 2),
        "type": TransactionType.BUY,
        "quantity": Decimal("2"),
        "unit_price": Money(Decimal("100"), "USD"),
        "fee": Money(Decimal("1"), "USD"),
        "instrument_currency": "USD",
    }
    values.update(changes)
    return Transaction(**values)


def test_core_entities_expose_stable_identity_and_relationships(
    public_contract,
) -> None:
    User = public_contract.export("app.modules.identity.domain", "User")
    Broker = public_contract.export("app.modules.accounts.domain", "Broker")
    Account = public_contract.export("app.modules.accounts.domain", "Account")
    Instrument = public_contract.export("app.modules.instruments.domain", "Instrument")

    user = User(id=USER_ID, base_currency="usd")
    broker = Broker(id=BROKER_ID, name="Tiger", country="SG")
    account = Account(
        id=ACCOUNT_ID,
        user_id=USER_ID,
        broker_id=BROKER_ID,
        name="Main",
        currency="usd",
    )
    instrument = Instrument(
        id=INSTRUMENT_ID,
        symbol="AAPL",
        exchange="NASDAQ",
        name="Apple Inc.",
        asset_type="STOCK",
        currency="usd",
    )

    assert (user.id, user.base_currency) == (USER_ID, "USD")
    assert (broker.id, broker.name, broker.country) == (
        BROKER_ID,
        "Tiger",
        "SG",
    )
    assert (account.id, account.user_id, account.broker_id) == (
        ACCOUNT_ID,
        USER_ID,
        BROKER_ID,
    )
    assert (account.name, account.currency) == ("Main", "USD")
    assert (
        instrument.id,
        instrument.symbol,
        instrument.exchange,
        instrument.name,
        instrument.asset_type,
        instrument.currency,
    ) == (
        INSTRUMENT_ID,
        "AAPL",
        "NASDAQ",
        "Apple Inc.",
        "STOCK",
        "USD",
    )
    for entity in (user, broker, account, instrument):
        with pytest.raises(FrozenInstanceError):
            entity.id = UUID("ffffffff-ffff-ffff-ffff-ffffffffffff")


@pytest.mark.parametrize("kind_name", ["BUY", "SELL"])
def test_transaction_accepts_buy_and_sell_with_exact_trade_fields(
    public_contract, kind_name: str
) -> None:
    Money, _, TransactionType = _transaction_types(public_contract)
    transaction = _valid_transaction(
        public_contract, type=getattr(TransactionType, kind_name)
    )

    assert transaction.id == TRANSACTION_ID
    assert transaction.user_id == USER_ID
    assert transaction.account_id == ACCOUNT_ID
    assert transaction.instrument_id == INSTRUMENT_ID
    assert transaction.trade_date == date(2026, 1, 2)
    assert transaction.type is getattr(TransactionType, kind_name)
    assert transaction.transaction_kind == kind_name
    assert transaction.quantity == Decimal("2")
    assert transaction.unit_price == Money(Decimal("100"), "USD")
    assert transaction.fee == Money(Decimal("1"), "USD")
    with pytest.raises(FrozenInstanceError):
        transaction.quantity = Decimal("3")


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("quantity", Decimal("0")),
        ("quantity", Decimal("-1")),
        ("quantity", 1.0),
    ],
)
def test_transaction_rejects_invalid_quantities(
    public_contract, field: str, value
) -> None:
    with pytest.raises((TypeError, ValueError)):
        _valid_transaction(public_contract, **{field: value})


@pytest.mark.parametrize("amount", [Decimal("0"), Decimal("-1")])
def test_transaction_rejects_non_positive_unit_price(
    public_contract, amount: Decimal
) -> None:
    Money, _, _ = _transaction_types(public_contract)

    with pytest.raises((TypeError, ValueError)):
        _valid_transaction(public_contract, unit_price=Money(amount, "USD"))


def test_transaction_rejects_negative_fee(public_contract) -> None:
    Money, _, _ = _transaction_types(public_contract)

    with pytest.raises((TypeError, ValueError)):
        _valid_transaction(public_contract, fee=Money(Decimal("-0.01"), "USD"))


@pytest.mark.parametrize("field", ["unit_price", "fee"])
def test_transaction_rejects_money_not_in_instrument_currency(
    public_contract, field: str
) -> None:
    Money, _, _ = _transaction_types(public_contract)

    with pytest.raises((TypeError, ValueError)):
        _valid_transaction(public_contract, **{field: Money(Decimal("1"), "EUR")})


@pytest.mark.parametrize("unsupported", ["DIVIDEND", "SPLIT", "DEPOSIT"])
def test_transaction_rejects_unsupported_types(
    public_contract, unsupported: str
) -> None:
    with pytest.raises((TypeError, ValueError)):
        _valid_transaction(public_contract, type=unsupported)
