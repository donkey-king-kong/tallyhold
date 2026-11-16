"""Broker and owned account persistence mappings."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    CHAR,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infrastructure.database import Base


class BrokerRow(Base):
    __tablename__ = "brokers"
    __table_args__ = (
        UniqueConstraint("name", "country", name="uq_brokers_name_country"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class AccountRow(Base):
    __tablename__ = "broker_accounts"
    __table_args__ = (
        UniqueConstraint("user_id", "id", name="uq_broker_accounts_user_id_id"),
        UniqueConstraint("user_id", "name", name="uq_broker_accounts_user_id_name"),
        CheckConstraint(
            "currency COLLATE \"C\" ~ '^[A-Z]{3}$'",
            name="ck_broker_accounts_currency",
        ),
        ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_broker_accounts_user_id",
            ondelete="NO ACTION",
        ),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    broker_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey(
            "brokers.id", name="fk_broker_accounts_broker_id", ondelete="NO ACTION"
        ),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    currency: Mapped[str] = mapped_column(CHAR(3), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
