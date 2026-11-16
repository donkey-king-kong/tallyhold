"""Transaction persistence mapping; entry_seq is database-generated."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    CHAR,
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKeyConstraint,
    Identity,
    Index,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infrastructure.database import Base


class TransactionRow(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_transactions_user_id",
            ondelete="NO ACTION",
        ),
        ForeignKeyConstraint(
            ["user_id", "broker_account_id"],
            ["broker_accounts.user_id", "broker_accounts.id"],
            name="fk_transactions_user_account",
            ondelete="NO ACTION",
        ),
        ForeignKeyConstraint(
            ["instrument_id", "instrument_currency"],
            ["instruments.id", "instruments.currency"],
            name="fk_transactions_instrument_currency",
            ondelete="NO ACTION",
        ),
        CheckConstraint("type IN ('BUY', 'SELL')", name="ck_transactions_type"),
        CheckConstraint(
            "quantity > 0 AND quantity <> 'NaN'::numeric",
            name="ck_transactions_quantity",
        ),
        CheckConstraint(
            "unit_price_amount > 0 AND unit_price_amount <> 'NaN'::numeric",
            name="ck_transactions_unit_price",
        ),
        CheckConstraint(
            "fee_amount >= 0 AND fee_amount <> 'NaN'::numeric",
            name="ck_transactions_fee",
        ),
        CheckConstraint(
            "instrument_currency COLLATE \"C\" ~ '^[A-Z]{3}$'",
            name="ck_transactions_currency",
        ),
        Index(
            "ix_transactions_user_account_date_seq",
            "user_id",
            "broker_account_id",
            "trade_date",
            "entry_seq",
        ),
        Index("ix_transactions_user_id", "user_id", "id"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    entry_seq: Mapped[int] = mapped_column(
        BigInteger, Identity(always=True), nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    broker_account_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), nullable=False
    )
    instrument_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    trade_date: Mapped[date] = mapped_column(Date, nullable=False)
    type: Mapped[str] = mapped_column(String(8), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)
    unit_price_amount: Mapped[Decimal] = mapped_column(Numeric(20, 6), nullable=False)
    fee_amount: Mapped[Decimal] = mapped_column(Numeric(20, 6), nullable=False)
    instrument_currency: Mapped[str] = mapped_column(CHAR(3), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
