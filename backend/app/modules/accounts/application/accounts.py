"""Use cases for the shared broker catalog and owned accounts."""

from dataclasses import dataclass
from uuid import UUID, uuid4

from app.modules.accounts.domain.errors import (
    AccountNotFound,
    BrokerIntegrityError,
    BrokerNotFound,
)
from app.modules.accounts.domain.models import Account, Broker, normalize_account_name
from app.modules.accounts.domain.repositories import AccountRepository, BrokerRepository


@dataclass(frozen=True)
class AccountDetail:
    id: UUID
    broker_id: UUID
    broker_name: str
    name: str
    currency: str


class AccountsService:
    def __init__(self, accounts: AccountRepository, brokers: BrokerRepository) -> None:
        self.accounts = accounts
        self.brokers = brokers

    def list_brokers(self) -> list[Broker]:
        return sorted(
            self.brokers.list_all(), key=lambda broker: (broker.name, broker.id)
        )

    def _detail(self, account: Account, brokers: dict[UUID, Broker]) -> AccountDetail:
        broker = brokers.get(account.broker_id)
        if broker is None:
            raise BrokerIntegrityError("account broker is missing")
        return AccountDetail(
            account.id, account.broker_id, broker.name, account.name, account.currency
        )

    def list_accounts(self, user_id: UUID) -> list[AccountDetail]:
        brokers = {broker.id: broker for broker in self.brokers.list_all()}
        accounts = sorted(
            self.accounts.list_for_user(user_id),
            key=lambda account: (account.name, account.id),
        )
        return [self._detail(account, brokers) for account in accounts]

    def _owned(self, user_id: UUID, account_id: UUID) -> Account:
        account = self.accounts.get(user_id, account_id)
        if account is None:
            raise AccountNotFound()
        return account

    def get_account(self, user_id: UUID, account_id: UUID) -> AccountDetail:
        account = self._owned(user_id, account_id)
        broker = self.brokers.get(account.broker_id)
        return self._detail(account, {broker.id: broker} if broker else {})

    def create_account(
        self, user_id: UUID, broker_id: UUID, name: str, currency: str
    ) -> AccountDetail:
        broker = self.brokers.get(broker_id)
        if broker is None:
            raise BrokerNotFound()
        account = Account(
            uuid4(), user_id, broker_id, normalize_account_name(name), currency
        )
        self.accounts.save(user_id, account)
        return self._detail(account, {broker_id: broker})

    def update_account(
        self,
        user_id: UUID,
        account_id: UUID,
        *,
        name: str | None = None,
        currency: str | None = None,
    ) -> AccountDetail:
        previous = self._owned(user_id, account_id)
        updated = Account(
            previous.id,
            user_id,
            previous.broker_id,
            normalize_account_name(name) if name is not None else previous.name,
            currency if currency is not None else previous.currency,
        )
        self.accounts.save(user_id, updated)
        broker = self.brokers.get(updated.broker_id)
        return self._detail(updated, {broker.id: broker} if broker else {})

    def delete_account(self, user_id: UUID, account_id: UUID) -> None:
        self._owned(user_id, account_id)
        self.accounts.delete(user_id, account_id)
