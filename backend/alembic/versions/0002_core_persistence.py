"""Persist the five core non-derived entities.

Revision ID: 0002_core_persistence
Revises: 0001_baseline
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

revision = "0002_core_persistence"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def currency_check(column: str, table: str) -> sa.CheckConstraint:
    return sa.CheckConstraint(
        f"{column} COLLATE \"C\" ~ '^[A-Z]{{3}}$'",
        name=f"ck_{table}_{column}",
    )


def created_at() -> sa.Column:
    return sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        nullable=False,
    )


def updated_at() -> sa.Column:
    return sa.Column(
        "updated_at",
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        nullable=False,
    )


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("base_currency", sa.CHAR(3), nullable=False),
        created_at(),
        currency_check("base_currency", "users"),
    )
    op.create_table(
        "brokers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("country", sa.String(32), nullable=False),
        created_at(),
        sa.UniqueConstraint("name", "country", name="uq_brokers_name_country"),
    )
    op.create_table(
        "instruments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("symbol", sa.String(64), nullable=False),
        sa.Column("exchange", sa.String(32), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("asset_type", sa.String(64), nullable=False),
        sa.Column("currency", sa.CHAR(3), nullable=False),
        created_at(),
        currency_check("currency", "instruments"),
        sa.UniqueConstraint("id", "currency", name="uq_instruments_id_currency"),
    )
    op.create_index(
        "uq_instruments_symbol_exchange_ci",
        "instruments",
        [sa.text("upper(symbol)"), sa.text("upper(exchange)")],
        unique=True,
    )
    op.create_table(
        "broker_accounts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("broker_id", UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("currency", sa.CHAR(3), nullable=False),
        created_at(),
        updated_at(),
        currency_check("currency", "broker_accounts"),
        sa.UniqueConstraint("user_id", "id", name="uq_broker_accounts_user_id_id"),
        sa.UniqueConstraint("user_id", "name", name="uq_broker_accounts_user_id_name"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_broker_accounts_user_id",
            ondelete="NO ACTION",
        ),
        sa.ForeignKeyConstraint(
            ["broker_id"],
            ["brokers.id"],
            name="fk_broker_accounts_broker_id",
            ondelete="NO ACTION",
        ),
    )
    op.create_table(
        "transactions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("entry_seq", sa.BigInteger, sa.Identity(always=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("broker_account_id", UUID(as_uuid=True), nullable=False),
        sa.Column("instrument_id", UUID(as_uuid=True), nullable=False),
        sa.Column("trade_date", sa.Date, nullable=False),
        sa.Column("type", sa.String(8), nullable=False),
        sa.Column("quantity", sa.Numeric(18, 8), nullable=False),
        sa.Column("unit_price_amount", sa.Numeric(20, 6), nullable=False),
        sa.Column("fee_amount", sa.Numeric(20, 6), nullable=False),
        sa.Column("instrument_currency", sa.CHAR(3), nullable=False),
        created_at(),
        updated_at(),
        currency_check("instrument_currency", "transactions"),
        sa.CheckConstraint("type IN ('BUY', 'SELL')", name="ck_transactions_type"),
        sa.CheckConstraint(
            "quantity > 0 AND quantity <> 'NaN'::numeric",
            name="ck_transactions_quantity",
        ),
        sa.CheckConstraint(
            "unit_price_amount > 0 AND unit_price_amount <> 'NaN'::numeric",
            name="ck_transactions_unit_price",
        ),
        sa.CheckConstraint(
            "fee_amount >= 0 AND fee_amount <> 'NaN'::numeric",
            name="ck_transactions_fee",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_transactions_user_id",
            ondelete="NO ACTION",
        ),
        sa.ForeignKeyConstraint(
            ["user_id", "broker_account_id"],
            ["broker_accounts.user_id", "broker_accounts.id"],
            name="fk_transactions_user_account",
            ondelete="NO ACTION",
        ),
        sa.ForeignKeyConstraint(
            ["instrument_id", "instrument_currency"],
            ["instruments.id", "instruments.currency"],
            name="fk_transactions_instrument_currency",
            ondelete="NO ACTION",
        ),
    )
    op.create_index(
        "ix_transactions_user_account_date_seq",
        "transactions",
        ["user_id", "broker_account_id", "trade_date", "entry_seq"],
    )
    op.create_index("ix_transactions_user_id", "transactions", ["user_id", "id"])


def downgrade() -> None:
    op.drop_table("transactions")
    op.drop_table("broker_accounts")
    op.drop_table("instruments")
    op.drop_table("brokers")
    op.drop_table("users")
