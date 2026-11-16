"""Shared instrument persistence mapping."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    CHAR,
    CheckConstraint,
    DateTime,
    Index,
    String,
    UniqueConstraint,
    column,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infrastructure.database import Base


class InstrumentRow(Base):
    __tablename__ = "instruments"
    __table_args__ = (
        UniqueConstraint("id", "currency", name="uq_instruments_id_currency"),
        CheckConstraint(
            "currency COLLATE \"C\" ~ '^[A-Z]{3}$'",
            name="ck_instruments_currency",
        ),
        Index(
            "uq_instruments_symbol_exchange_ci",
            func.upper(column("symbol")),
            func.upper(column("exchange")),
            unique=True,
        ),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    symbol: Mapped[str] = mapped_column(String(64), nullable=False)
    exchange: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(64), nullable=False)
    currency: Mapped[str] = mapped_column(CHAR(3), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
