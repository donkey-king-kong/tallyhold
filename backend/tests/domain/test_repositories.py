"""Feature 003 dependency: five pure abstract repository ports."""

from inspect import isabstract, signature

import pytest

REPOSITORY_CONTRACTS = [
    (
        "app.modules.identity.domain",
        "UserRepository",
        {"get": ("self", "user_id"), "save": ("self", "user")},
    ),
    (
        "app.modules.accounts.domain",
        "BrokerRepository",
        {
            "get": ("self", "broker_id"),
            "list_all": ("self",),
            "save": ("self", "broker"),
        },
    ),
    (
        "app.modules.accounts.domain",
        "AccountRepository",
        {
            "get": ("self", "user_id", "account_id"),
            "list_for_user": ("self", "user_id"),
            "save": ("self", "user_id", "account"),
            "delete": ("self", "user_id", "account_id"),
        },
    ),
    (
        "app.modules.instruments.domain",
        "InstrumentRepository",
        {
            "get": ("self", "instrument_id"),
            "find_by_symbol": ("self", "symbol", "exchange"),
            "save": ("self", "instrument"),
        },
    ),
    (
        "app.modules.transactions.domain",
        "TransactionRepository",
        {
            "get": ("self", "user_id", "transaction_id"),
            "list_for_account": ("self", "user_id", "account_id"),
            "save": ("self", "user_id", "transaction"),
            "delete": ("self", "user_id", "transaction_id"),
        },
    ),
]


@pytest.mark.parametrize(
    ("module_name", "repository_name", "methods"),
    REPOSITORY_CONTRACTS,
)
def test_repository_is_abstract_with_only_the_planned_public_operations(
    public_contract,
    module_name: str,
    repository_name: str,
    methods: dict[str, tuple[str, ...]],
) -> None:
    repository = public_contract.export(module_name, repository_name)

    assert isabstract(repository)
    assert repository.__abstractmethods__ == frozenset(methods)
    for method_name, parameter_names in methods.items():
        assert tuple(signature(getattr(repository, method_name)).parameters) == (
            parameter_names
        )
    with pytest.raises(TypeError):
        repository()
