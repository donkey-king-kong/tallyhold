"""Feature 006 AC2-AC5: accounts through public application operations."""

from collections.abc import Sequence
from importlib import import_module
from uuid import UUID, uuid4

import pytest

from app.modules.accounts.domain.models import Account, Broker
from app.modules.accounts.domain.repositories import AccountRepository, BrokerRepository


class Brokers(BrokerRepository):
    def __init__(self, *brokers: Broker) -> None:
        self.rows = {broker.id: broker for broker in brokers}

    def get(self, broker_id: UUID) -> Broker | None:
        return self.rows.get(broker_id)

    def list_all(self) -> Sequence[Broker]:
        return list(reversed(list(self.rows.values())))

    def save(self, broker: Broker) -> None:
        self.rows[broker.id] = broker


class Accounts(AccountRepository):
    def __init__(self, *accounts: Account) -> None:
        self.rows = {account.id: account for account in accounts}

    def get(self, user_id: UUID, account_id: UUID) -> Account | None:
        account = self.rows.get(account_id)
        return account if account is not None and account.user_id == user_id else None

    def list_for_user(self, user_id: UUID) -> Sequence[Account]:
        return [
            account
            for account in reversed(list(self.rows.values()))
            if account.user_id == user_id
        ]

    def save(self, user_id: UUID, account: Account) -> None:
        assert account.user_id == user_id
        self.rows[account.id] = account

    def delete(self, user_id: UUID, account_id: UUID) -> None:
        if self.get(user_id, account_id) is not None:
            self.rows.pop(account_id)


def service(accounts: Accounts, brokers: Brokers) -> object:
    try:
        module = import_module("app.modules.accounts.application.accounts")
    except ModuleNotFoundError:
        pytest.fail("AC2: accounts application operations are not implemented")
    return module.AccountsService(accounts=accounts, brokers=brokers)


def test_brokers_and_owned_accounts_have_stable_name_order_and_broker_labels() -> None:
    owner, other = uuid4(), uuid4()
    tiger = Broker(uuid4(), "Tiger", "SG")
    ibkr = Broker(uuid4(), "IBKR", "SG")
    later = Account(UUID(int=3), owner, tiger.id, "Zeta", "SGD")
    first = Account(UUID(int=2), owner, ibkr.id, "Alpha", "USD")
    tie = Account(UUID(int=1), owner, tiger.id, "Alpha", "SGD")
    foreign = Account(uuid4(), other, ibkr.id, "Private", "USD")
    accounts = Accounts(later, first, tie, foreign)
    manager = service(accounts, Brokers(tiger, ibkr))

    assert [(broker.name, broker.country) for broker in manager.list_brokers()] == [
        ("IBKR", "SG"),
        ("Tiger", "SG"),
    ]
    listed = manager.list_accounts(owner)
    assert [item.id for item in listed] == [tie.id, first.id, later.id]
    assert [item.broker_name for item in listed] == ["Tiger", "IBKR", "Tiger"]
    assert manager.get_account(owner, tie.id).currency == "SGD"
    assert [item.id for item in manager.list_accounts(other)] == [foreign.id]


def test_create_trims_name_normalizes_currency_and_never_selects_an_owner() -> None:
    owner, other = uuid4(), uuid4()
    broker = Broker(uuid4(), "IBKR", "SG")
    accounts = Accounts()
    manager = service(accounts, Brokers(broker))

    created = manager.create_account(owner, broker.id, "  Main  ", "usd")
    assert isinstance(created.id, UUID)
    assert (created.name, created.currency, created.broker_name) == (
        "Main",
        "USD",
        "IBKR",
    )
    assert accounts.get(owner, created.id) == Account(
        created.id, owner, broker.id, "Main", "USD"
    )
    assert manager.list_accounts(other) == []


@pytest.mark.parametrize("name", ["", " \t ", "x" * 256])
def test_invalid_names_do_not_create_or_change_accounts(name: str) -> None:
    owner = uuid4()
    broker = Broker(uuid4(), "Tiger", "SG")
    original = Account(uuid4(), owner, broker.id, "Main", "USD")
    accounts = Accounts(original)
    manager = service(accounts, Brokers(broker))

    with pytest.raises(ValueError):
        manager.create_account(owner, broker.id, name, "USD")
    with pytest.raises(ValueError):
        manager.update_account(owner, original.id, name=name)
    assert accounts.list_for_user(owner) == [original]


def test_update_is_partial_and_cannot_move_the_account_between_brokers() -> None:
    owner = uuid4()
    tiger, ibkr = Broker(uuid4(), "Tiger", "SG"), Broker(uuid4(), "IBKR", "SG")
    original = Account(uuid4(), owner, tiger.id, "Main", "USD")
    accounts = Accounts(original)
    manager = service(accounts, Brokers(tiger, ibkr))

    renamed = manager.update_account(owner, original.id, name="  Growth  ")
    assert (renamed.name, renamed.currency, renamed.broker_id) == (
        "Growth",
        "USD",
        tiger.id,
    )
    updated = manager.update_account(owner, original.id, currency="sgd")
    assert (updated.name, updated.currency, updated.broker_id) == (
        "Growth",
        "SGD",
        tiger.id,
    )


@pytest.mark.parametrize("currency", ["US1", " USD", "éUR"])
def test_invalid_currency_never_creates_an_account(currency: str) -> None:
    owner = uuid4()
    broker = Broker(uuid4(), "IBKR", "SG")
    accounts = Accounts()
    manager = service(accounts, Brokers(broker))

    with pytest.raises(ValueError):
        manager.create_account(owner, broker.id, "Main", currency)
    assert accounts.list_for_user(owner) == []


def test_unknown_broker_and_foreign_account_leave_rows_untouched() -> None:
    owner, other = uuid4(), uuid4()
    broker = Broker(uuid4(), "Tiger", "SG")
    original = Account(uuid4(), owner, broker.id, "Main", "USD")
    accounts = Accounts(original)
    manager = service(accounts, Brokers(broker))

    with pytest.raises(Exception):
        manager.create_account(other, uuid4(), "Foreign", "USD")
    with pytest.raises(Exception):
        manager.get_account(other, original.id)
    with pytest.raises(Exception):
        manager.update_account(other, original.id, name="Changed")
    with pytest.raises(Exception):
        manager.delete_account(other, original.id)
    assert accounts.get(owner, original.id) == original
