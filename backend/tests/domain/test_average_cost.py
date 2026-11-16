"""AC3-AC5: average-cost derivation through the strategy seam."""

from datetime import date
from decimal import Decimal
from inspect import isabstract
from uuid import UUID

import pytest

USER_ID = UUID("10000000-0000-0000-0000-000000000001")
ACCOUNT_ID = UUID("10000000-0000-0000-0000-000000000002")
INSTRUMENT_ID = UUID("10000000-0000-0000-0000-000000000003")


def _transaction(public_contract, sequence: int, **changes):
    Money = public_contract.export("app.shared.domain", "Money")
    domain = "app.modules.transactions.domain"
    Transaction = public_contract.export(domain, "Transaction")
    TransactionType = public_contract.export(domain, "TransactionType")
    values = {
        "id": UUID(f"10000000-0000-0000-0000-{sequence:012d}"),
        "user_id": USER_ID,
        "account_id": ACCOUNT_ID,
        "instrument_id": INSTRUMENT_ID,
        "trade_date": date(2026, 1, sequence),
        "type": TransactionType.BUY,
        "quantity": Decimal("10"),
        "unit_price": Money(Decimal("100"), "USD"),
        "fee": Money(Decimal("10"), "USD"),
        "instrument_currency": "USD",
    }
    values.update(changes)
    return Transaction(**values)


def _strategy_api(public_contract):
    domain = "app.modules.portfolio.domain"
    CostBasisStrategy = public_contract.export(domain, "CostBasisStrategy")
    AverageCostStrategy = public_contract.export(domain, "AverageCostStrategy")
    derive_positions = public_contract.export(domain, "derive_positions")
    return CostBasisStrategy, AverageCostStrategy, derive_positions


def _two_buys(public_contract):
    Money = public_contract.export("app.shared.domain", "Money")
    return [
        _transaction(public_contract, 1),
        _transaction(
            public_contract,
            2,
            unit_price=Money(Decimal("120"), "USD"),
        ),
    ]


def test_average_cost_combines_buys_with_exact_fee_inclusive_basis(
    public_contract,
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    CostBasisStrategy, AverageCostStrategy, derive_positions = _strategy_api(
        public_contract
    )
    strategy = AverageCostStrategy()

    [position] = derive_positions(_two_buys(public_contract), strategy)

    assert isabstract(CostBasisStrategy)
    assert isinstance(strategy, CostBasisStrategy)
    assert position.account_id == ACCOUNT_ID
    assert position.instrument_id == INSTRUMENT_ID
    assert position.quantity == Decimal("20")
    assert position.cost_basis == Money(Decimal("2220"), "USD")
    assert position.cost_basis.amount / position.quantity == Decimal("111")


def test_partial_sell_leaves_exact_remaining_quantity_and_basis(
    public_contract,
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    _, AverageCostStrategy, derive_positions = _strategy_api(public_contract)
    transactions = [
        *_two_buys(public_contract),
        _transaction(
            public_contract,
            3,
            type=public_contract.export(
                "app.modules.transactions.domain", "TransactionType"
            ).SELL,
            quantity=Decimal("15"),
            unit_price=Money(Decimal("150"), "USD"),
            fee=Money(Decimal("15"), "USD"),
        ),
    ]

    [position] = derive_positions(transactions, AverageCostStrategy())

    assert position.quantity == Decimal("5")
    assert position.cost_basis == Money(Decimal("555"), "USD")


def test_oversell_fails_at_its_ordered_point_in_history(public_contract) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    TransactionType = public_contract.export(
        "app.modules.transactions.domain", "TransactionType"
    )
    _, AverageCostStrategy, derive_positions = _strategy_api(public_contract)
    transactions = [
        _transaction(public_contract, 1),
        _transaction(
            public_contract,
            2,
            type=TransactionType.SELL,
            quantity=Decimal("11"),
            unit_price=Money(Decimal("120"), "USD"),
        ),
    ]

    with pytest.raises(ValueError):
        derive_positions(transactions, AverageCostStrategy())


def test_full_sale_consumes_all_basis_and_omits_open_position(
    public_contract,
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    TransactionType = public_contract.export(
        "app.modules.transactions.domain", "TransactionType"
    )
    _, AverageCostStrategy, derive_positions = _strategy_api(public_contract)
    transactions = [
        _transaction(
            public_contract,
            1,
            quantity=Decimal("3"),
            unit_price=Money(Decimal("10"), "USD"),
            fee=Money(Decimal("1"), "USD"),
        ),
        _transaction(
            public_contract,
            2,
            type=TransactionType.SELL,
            quantity=Decimal("3"),
            unit_price=Money(Decimal("11"), "USD"),
            fee=Money(Decimal("0"), "USD"),
        ),
    ]

    assert derive_positions(transactions, AverageCostStrategy()) == []
    _, realised = AverageCostStrategy().derive(transactions)
    assert realised[0].consumed_basis == Money(Decimal("31"), "USD")


def test_buy_after_full_sale_starts_new_average_cost_history(
    public_contract,
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    TransactionType = public_contract.export(
        "app.modules.transactions.domain", "TransactionType"
    )
    _, AverageCostStrategy, derive_positions = _strategy_api(public_contract)
    transactions = [
        _transaction(public_contract, 1),
        _transaction(
            public_contract,
            2,
            type=TransactionType.SELL,
            unit_price=Money(Decimal("110"), "USD"),
            fee=Money(Decimal("0"), "USD"),
        ),
        _transaction(
            public_contract,
            3,
            quantity=Decimal("2"),
            unit_price=Money(Decimal("50"), "USD"),
            fee=Money(Decimal("1"), "USD"),
        ),
    ]

    [position] = derive_positions(transactions, AverageCostStrategy())

    assert position.quantity == Decimal("2")
    assert position.cost_basis == Money(Decimal("101"), "USD")


def test_transactions_are_sorted_by_trade_date_before_derivation(
    public_contract,
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    TransactionType = public_contract.export(
        "app.modules.transactions.domain", "TransactionType"
    )
    _, AverageCostStrategy, derive_positions = _strategy_api(public_contract)
    buy = _transaction(public_contract, 1, trade_date=date(2026, 1, 1))
    sell = _transaction(
        public_contract,
        2,
        trade_date=date(2026, 1, 2),
        type=TransactionType.SELL,
        quantity=Decimal("5"),
        unit_price=Money(Decimal("110"), "USD"),
        fee=Money(Decimal("0"), "USD"),
    )

    [position] = derive_positions([sell, buy], AverageCostStrategy())

    assert position.quantity == Decimal("5")
    assert position.cost_basis == Money(Decimal("505"), "USD")


def test_same_date_transactions_preserve_supplied_order(public_contract) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    TransactionType = public_contract.export(
        "app.modules.transactions.domain", "TransactionType"
    )
    _, AverageCostStrategy, derive_positions = _strategy_api(public_contract)
    same_date = date(2026, 1, 1)
    sell = _transaction(
        public_contract,
        1,
        trade_date=same_date,
        type=TransactionType.SELL,
        quantity=Decimal("1"),
        unit_price=Money(Decimal("110"), "USD"),
        fee=Money(Decimal("0"), "USD"),
    )
    buy = _transaction(public_contract, 2, trade_date=same_date)

    with pytest.raises(ValueError):
        derive_positions([sell, buy], AverageCostStrategy())


def test_position_derivation_accepts_any_cost_basis_strategy(
    public_contract,
) -> None:
    CostBasisStrategy, _, derive_positions = _strategy_api(public_contract)
    sentinel = object()

    class FutureCostBasisStrategy(CostBasisStrategy):
        def derive(self, transactions):
            assert list(transactions) == []
            return [sentinel], []

    assert derive_positions([], FutureCostBasisStrategy()) == [sentinel]
