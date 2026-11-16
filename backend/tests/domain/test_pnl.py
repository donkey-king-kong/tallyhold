"""AC6, AC7, and AC9 exact realised and unrealised P&L behavior."""

from datetime import date
from decimal import Decimal
from uuid import UUID

import pytest

USER_ID = UUID("20000000-0000-0000-0000-000000000001")
ACCOUNT_ID = UUID("20000000-0000-0000-0000-000000000002")
USD_INSTRUMENT_ID = UUID("20000000-0000-0000-0000-000000000003")
EUR_INSTRUMENT_ID = UUID("20000000-0000-0000-0000-000000000004")


def _transaction(
    public_contract,
    sequence: int,
    *,
    instrument_id: UUID = USD_INSTRUMENT_ID,
    currency: str = "USD",
    kind: str = "BUY",
    quantity: str = "10",
    price: str = "100",
    fee: str = "0",
):
    Money = public_contract.export("app.shared.domain", "Money")
    domain = "app.modules.transactions.domain"
    Transaction = public_contract.export(domain, "Transaction")
    TransactionType = public_contract.export(domain, "TransactionType")
    return Transaction(
        id=UUID(f"20000000-0000-0000-0000-{sequence:012d}"),
        user_id=USER_ID,
        account_id=ACCOUNT_ID,
        instrument_id=instrument_id,
        trade_date=date(2026, 1, sequence),
        type=getattr(TransactionType, kind),
        quantity=Decimal(quantity),
        unit_price=Money(Decimal(price), currency),
        fee=Money(Decimal(fee), currency),
        instrument_currency=currency,
    )


def _portfolio_api(public_contract):
    domain = "app.modules.portfolio.domain"
    AverageCostStrategy = public_contract.export(domain, "AverageCostStrategy")
    calculate_realised_pnl = public_contract.export(domain, "calculate_realised_pnl")
    calculate_unrealised_pnl = public_contract.export(
        domain, "calculate_unrealised_pnl"
    )
    return (
        AverageCostStrategy,
        calculate_realised_pnl,
        calculate_unrealised_pnl,
    )


def test_realised_pnl_returns_exact_sale_result_and_aggregate(
    public_contract,
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    AverageCostStrategy, calculate_realised_pnl, _ = _portfolio_api(public_contract)
    transactions = [
        _transaction(public_contract, 1, fee="10"),
        _transaction(public_contract, 2, price="120", fee="10"),
        _transaction(
            public_contract,
            3,
            kind="SELL",
            quantity="15",
            price="150",
            fee="15",
        ),
    ]

    results, aggregate = calculate_realised_pnl(transactions, AverageCostStrategy())

    [sale] = results
    assert sale.transaction_id == transactions[-1].id
    assert sale.net_proceeds == Money(Decimal("2235"), "USD")
    assert sale.consumed_basis == Money(Decimal("1665"), "USD")
    assert sale.realised_pnl == Money(Decimal("570"), "USD")
    assert aggregate == Money(Decimal("570"), "USD")


def test_aggregate_realised_pnl_is_exact_sum_of_multiple_sales(
    public_contract,
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    AverageCostStrategy, calculate_realised_pnl, _ = _portfolio_api(public_contract)
    transactions = [
        _transaction(public_contract, 1),
        _transaction(public_contract, 2, kind="SELL", quantity="2", price="150"),
        _transaction(public_contract, 3, kind="SELL", quantity="3", price="120"),
    ]

    results, aggregate = calculate_realised_pnl(transactions, AverageCostStrategy())

    assert [result.realised_pnl for result in results] == [
        Money(Decimal("100"), "USD"),
        Money(Decimal("60"), "USD"),
    ]
    assert aggregate == Money(Decimal("160"), "USD")


def test_aggregate_realised_pnl_rejects_mixed_currencies(
    public_contract,
) -> None:
    AverageCostStrategy, calculate_realised_pnl, _ = _portfolio_api(public_contract)
    transactions = [
        _transaction(public_contract, 1),
        _transaction(public_contract, 2, kind="SELL", quantity="1", price="110"),
        _transaction(
            public_contract,
            3,
            instrument_id=EUR_INSTRUMENT_ID,
            currency="EUR",
        ),
        _transaction(
            public_contract,
            4,
            instrument_id=EUR_INSTRUMENT_ID,
            currency="EUR",
            kind="SELL",
            quantity="1",
            price="110",
        ),
    ]

    with pytest.raises(ValueError):
        calculate_realised_pnl(transactions, AverageCostStrategy())


def test_unrealised_pnl_uses_exact_remaining_basis(public_contract) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    Position = public_contract.export("app.modules.portfolio.domain", "Position")
    _, _, calculate_unrealised_pnl = _portfolio_api(public_contract)
    position = Position(
        account_id=ACCOUNT_ID,
        instrument_id=USD_INSTRUMENT_ID,
        quantity=Decimal("5"),
        cost_basis=Money(Decimal("555"), "USD"),
    )

    market_value, unrealised_pnl = calculate_unrealised_pnl(
        position, Money(Decimal("130"), "USD")
    )

    assert market_value == Money(Decimal("650"), "USD")
    assert unrealised_pnl == Money(Decimal("95"), "USD")
    assert market_value.amount.as_tuple().exponent == 0
    assert unrealised_pnl.amount.as_tuple().exponent == 0


def test_unrealised_pnl_preserves_decimal_precision_without_rounding(
    public_contract,
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    Position = public_contract.export("app.modules.portfolio.domain", "Position")
    _, _, calculate_unrealised_pnl = _portfolio_api(public_contract)
    position = Position(
        account_id=ACCOUNT_ID,
        instrument_id=USD_INSTRUMENT_ID,
        quantity=Decimal("3"),
        cost_basis=Money(Decimal("0.1"), "USD"),
    )

    market_value, unrealised_pnl = calculate_unrealised_pnl(
        position, Money(Decimal("0.123456789"), "USD")
    )

    assert market_value == Money(Decimal("0.370370367"), "USD")
    assert unrealised_pnl == Money(Decimal("0.270370367"), "USD")


def test_unrealised_pnl_rejects_current_price_currency_mismatch(
    public_contract,
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    Position = public_contract.export("app.modules.portfolio.domain", "Position")
    _, _, calculate_unrealised_pnl = _portfolio_api(public_contract)
    position = Position(
        account_id=ACCOUNT_ID,
        instrument_id=USD_INSTRUMENT_ID,
        quantity=Decimal("5"),
        cost_basis=Money(Decimal("555"), "USD"),
    )

    with pytest.raises(ValueError):
        calculate_unrealised_pnl(position, Money(Decimal("130"), "EUR"))
