"""AC1: Money is exact, Decimal-only, and currency-safe."""

from dataclasses import FrozenInstanceError
from decimal import Decimal

import pytest


def test_money_preserves_exact_amount_and_normalizes_currency(public_contract) -> None:
    Money = public_contract.export("app.shared.domain", "Money")

    money = Money(Decimal("10.25"), "usd")

    assert money.amount == Decimal("10.25")
    assert money.currency == "USD"
    with pytest.raises(FrozenInstanceError):
        money.amount = Decimal("11")


@pytest.mark.parametrize("amount", [10.25, 0.0, -1.5])
def test_money_rejects_float_amounts(public_contract, amount: float) -> None:
    Money = public_contract.export("app.shared.domain", "Money")

    with pytest.raises((TypeError, ValueError)):
        Money(amount, "USD")


def test_money_adds_and_subtracts_same_currency_exactly(public_contract) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    left = Money(Decimal("10.25"), "USD")
    right = Money(Decimal("0.15"), "USD")

    assert left + right == Money(Decimal("10.40"), "USD")
    assert left - right == Money(Decimal("10.10"), "USD")


@pytest.mark.parametrize("operator", ["add", "subtract"])
def test_money_rejects_mixed_currency_arithmetic(
    public_contract, operator: str
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    usd = Money(Decimal("10"), "USD")
    eur = Money(Decimal("2"), "EUR")

    with pytest.raises((TypeError, ValueError)):
        usd + eur if operator == "add" else usd - eur


def test_money_multiplies_only_by_decimal(public_contract) -> None:
    Money = public_contract.export("app.shared.domain", "Money")
    money = Money(Decimal("10.25"), "USD")

    assert money * Decimal("2") == Money(Decimal("20.50"), "USD")
    with pytest.raises((TypeError, ValueError)):
        money * 2.0


@pytest.mark.parametrize("amount", [Decimal("0"), Decimal("-10.25")])
def test_money_allows_zero_and_negative_decimal_amounts(
    public_contract, amount: Decimal
) -> None:
    Money = public_contract.export("app.shared.domain", "Money")

    assert Money(amount, "USD").amount == amount


@pytest.mark.parametrize("currency", ["US", "USDD", "12A", "U$D"])
def test_money_rejects_invalid_currency_codes(public_contract, currency: str) -> None:
    Money = public_contract.export("app.shared.domain", "Money")

    with pytest.raises((TypeError, ValueError)):
        Money(Decimal("1"), currency)
