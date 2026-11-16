"""Cost-basis strategy contracts and average-cost behavior."""

from abc import ABC, abstractmethod
from collections.abc import Iterable
from datetime import date
from decimal import Decimal
from typing import Protocol
from uuid import UUID

from app.modules.portfolio.domain.models import Position, RealisedResult
from app.shared.domain import Money


class TransactionView(Protocol):
    """Transaction fields required for cost-basis calculations."""

    id: UUID
    account_id: UUID
    instrument_id: UUID
    trade_date: date
    transaction_kind: str
    quantity: Decimal
    unit_price: Money
    fee: Money


class CostBasisStrategy(ABC):
    """Pluggable strategy for deriving holdings and sale results."""

    @abstractmethod
    def derive(
        self, transactions: Iterable[TransactionView]
    ) -> tuple[list[Position], list[RealisedResult]]:
        """Derive open positions and realised sale results."""


class AverageCostStrategy(CostBasisStrategy):
    """Consume sells using the holding's average unit cost."""

    def derive(
        self, transactions: Iterable[TransactionView]
    ) -> tuple[list[Position], list[RealisedResult]]:
        holdings: dict[tuple[UUID, UUID], tuple[Decimal, Money]] = {}
        realised: list[RealisedResult] = []

        for transaction in sorted(transactions, key=lambda item: item.trade_date):
            key = (transaction.account_id, transaction.instrument_id)
            if transaction.transaction_kind == "BUY":
                quantity, basis = holdings.get(
                    key,
                    (
                        Decimal("0"),
                        Money(Decimal("0"), transaction.unit_price.currency),
                    ),
                )
                buy_cost = transaction.unit_price * transaction.quantity
                holdings[key] = (
                    quantity + transaction.quantity,
                    basis + buy_cost + transaction.fee,
                )
                continue

            if transaction.transaction_kind != "SELL":
                raise ValueError("unsupported transaction kind")
            if key not in holdings:
                raise ValueError("cannot sell without an open position")

            quantity, basis = holdings[key]
            if transaction.quantity > quantity:
                raise ValueError("sale quantity exceeds the open position")
            if transaction.quantity == quantity:
                consumed_basis = basis
            else:
                average_unit_cost = basis.amount / quantity
                consumed_basis = Money(
                    average_unit_cost * transaction.quantity,
                    basis.currency,
                )

            net_proceeds = (
                transaction.unit_price * transaction.quantity - transaction.fee
            )
            realised.append(
                RealisedResult(
                    transaction_id=transaction.id,
                    net_proceeds=net_proceeds,
                    consumed_basis=consumed_basis,
                    realised_pnl=net_proceeds - consumed_basis,
                )
            )

            remaining_quantity = quantity - transaction.quantity
            if remaining_quantity == 0:
                del holdings[key]
            else:
                holdings[key] = (
                    remaining_quantity,
                    basis - consumed_basis,
                )

        positions = [
            Position(
                account_id=account_id,
                instrument_id=instrument_id,
                quantity=quantity,
                cost_basis=basis,
            )
            for (account_id, instrument_id), (quantity, basis) in holdings.items()
        ]
        return positions, realised


def derive_positions(
    transactions: Iterable[TransactionView], strategy: CostBasisStrategy
) -> list[Position]:
    """Return open positions through the selected cost-basis strategy."""
    positions, _ = strategy.derive(transactions)
    return positions
