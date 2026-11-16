"""User persistence mapping."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import CHAR, CheckConstraint, DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infrastructure.database import Base


class UserRow(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "base_currency COLLATE \"C\" ~ '^[A-Z]{3}$'",
            name="ck_users_base_currency",
        ),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    base_currency: Mapped[str] = mapped_column(CHAR(3), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
