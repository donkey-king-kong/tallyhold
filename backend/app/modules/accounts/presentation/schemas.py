"""Strict HTTP shapes for the shared catalog and owned accounts."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.modules.accounts.domain.models import normalize_account_name
from app.shared.domain.money import normalize_currency


class BrokerResponse(BaseModel):
    id: UUID
    name: str
    country: str


class AccountResponse(BaseModel):
    id: UUID
    broker_id: UUID
    broker_name: str
    name: str
    currency: str


class CreateAccount(BaseModel):
    model_config = ConfigDict(extra="forbid")

    broker_id: UUID
    name: str
    currency: str

    @field_validator("name")
    @classmethod
    def valid_name(cls, name: str) -> str:
        return normalize_account_name(name)

    @field_validator("currency")
    @classmethod
    def valid_currency(cls, currency: str) -> str:
        return normalize_currency(currency)


class UpdateAccount(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    currency: str | None = None

    @model_validator(mode="after")
    def nonempty(self) -> "UpdateAccount":
        if not self.model_fields_set or (self.name is None and self.currency is None):
            raise ValueError("provide a name or currency")
        return self

    @field_validator("name")
    @classmethod
    def valid_name(cls, name: str | None) -> str:
        if name is None:
            raise ValueError("name cannot be null")
        return normalize_account_name(name)

    @field_validator("currency")
    @classmethod
    def valid_currency(cls, currency: str | None) -> str:
        if currency is None:
            raise ValueError("currency cannot be null")
        return normalize_currency(currency)
