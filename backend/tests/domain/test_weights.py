"""AC8: exact portfolio weights are returned per instrument."""

from decimal import Decimal
from uuid import UUID

import pytest

FIRST_INSTRUMENT_ID = UUID("30000000-0000-0000-0000-000000000001")
SECOND_INSTRUMENT_ID = UUID("30000000-0000-0000-0000-000000000002")


def _weights_api(public_contract):
    Money = public_contract.export("app.shared.domain", "Money")
    calculate_portfolio_weights = public_contract.export(
        "app.modules.portfolio.domain", "calculate_portfolio_weights"
    )
    return Money, calculate_portfolio_weights


def test_weights_are_exact_per_instrument_and_sum_to_one(
    public_contract,
) -> None:
    Money, calculate_portfolio_weights = _weights_api(public_contract)

    weights = calculate_portfolio_weights(
        {
            FIRST_INSTRUMENT_ID: Money(Decimal("650"), "USD"),
            SECOND_INSTRUMENT_ID: Money(Decimal("350"), "USD"),
        }
    )

    assert weights == {
        FIRST_INSTRUMENT_ID: Decimal("0.65"),
        SECOND_INSTRUMENT_ID: Decimal("0.35"),
    }
    assert sum(weights.values(), start=Decimal("0")) == Decimal("1")


def test_empty_portfolio_has_no_weights(public_contract) -> None:
    _, calculate_portfolio_weights = _weights_api(public_contract)

    assert calculate_portfolio_weights({}) == {}


def test_zero_value_portfolio_has_no_weights(public_contract) -> None:
    Money, calculate_portfolio_weights = _weights_api(public_contract)

    assert (
        calculate_portfolio_weights(
            {
                FIRST_INSTRUMENT_ID: Money(Decimal("0"), "USD"),
                SECOND_INSTRUMENT_ID: Money(Decimal("0"), "USD"),
            }
        )
        == {}
    )


def test_weights_reject_mixed_currencies(public_contract) -> None:
    Money, calculate_portfolio_weights = _weights_api(public_contract)

    with pytest.raises(ValueError):
        calculate_portfolio_weights(
            {
                FIRST_INSTRUMENT_ID: Money(Decimal("650"), "USD"),
                SECOND_INSTRUMENT_ID: Money(Decimal("350"), "EUR"),
            }
        )


def test_weights_reject_negative_total_value(public_contract) -> None:
    Money, calculate_portfolio_weights = _weights_api(public_contract)

    with pytest.raises(ValueError):
        calculate_portfolio_weights(
            {
                FIRST_INSTRUMENT_ID: Money(Decimal("-2"), "USD"),
                SECOND_INSTRUMENT_ID: Money(Decimal("1"), "USD"),
            }
        )
