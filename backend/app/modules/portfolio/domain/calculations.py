"""Pure portfolio calculations."""

from collections.abc import Iterable, Mapping
from decimal import Decimal
from uuid import UUID

from app.modules.portfolio.domain.cost_basis import (
    CostBasisStrategy,
    TransactionView,
)
from app.modules.portfolio.domain.models import Position, RealisedResult
from app.shared.domain import Money


def calculate_realised_pnl(
    transactions: Iterable[TransactionView],
    strategy: CostBasisStrategy,
) -> tuple[list[RealisedResult], Money]:
    """Return per-sale and aggregate realised profit and loss."""
    transaction_list = list(transactions)
    _, results = strategy.derive(transaction_list)

    if not results:
        if not transaction_list:
            raise ValueError("realised P&L requires a transaction currency")
        return [], Money(
            Decimal("0"),
            transaction_list[0].unit_price.currency,
        )

    currency = results[0].realised_pnl.currency
    aggregate = Money(Decimal("0"), currency)
    for result in results:
        aggregate += result.realised_pnl
    return results, aggregate


def calculate_unrealised_pnl(
    position: Position, current_price: Money
) -> tuple[Money, Money]:
    """Return current market value and unrealised profit and loss."""
    if current_price.currency != position.cost_basis.currency:
        raise ValueError("current price currency must match cost basis")
    market_value = current_price * position.quantity
    return market_value, market_value - position.cost_basis


def calculate_portfolio_weights(
    market_values: Mapping[UUID, Money],
) -> dict[UUID, Decimal]:
    """Return each instrument's exact share of a common-currency portfolio."""
    if not market_values:
        return {}

    currencies = {value.currency for value in market_values.values()}
    if len(currencies) != 1:
        raise ValueError("portfolio values must use one currency")

    total = sum(
        (value.amount for value in market_values.values()),
        start=Decimal("0"),
    )
    if total < 0:
        raise ValueError("portfolio total cannot be negative")
    if total == 0:
        return {}
    return {
        instrument_id: value.amount / total
        for instrument_id, value in market_values.items()
    }
