"""Feature 006 AC1-AC5/AC7: authenticated account API on PostgreSQL."""

from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from importlib import import_module
from threading import Barrier
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.modules.identity.domain.models import User

API = "/api/v1"
BEARER = {"Authorization": "Bearer offline-test-token"}


@pytest.fixture
def accounts_client(
    database_engine: Engine,
) -> Iterator[tuple[TestClient, list[User], UUID]]:
    owner, other = User(uuid4(), "SGD"), User(uuid4(), "USD")
    broker_id = uuid4()
    broker_name = f"HTTP Fixture {broker_id.hex[:8]}"
    with database_engine.begin() as connection:
        for user in (owner, other):
            connection.execute(
                text("INSERT INTO users(id, base_currency) VALUES (:id, :currency)"),
                {"id": user.id, "currency": user.base_currency},
            )
        connection.execute(
            text("INSERT INTO brokers(id, name, country) VALUES (:id, :name, 'SG')"),
            {"id": broker_id, "name": broker_name},
        )

    dependencies = import_module("app.dependencies")
    app = import_module("app.main").app
    current = [owner, other]

    def db_session() -> Iterator[Session]:
        with Session(database_engine) as session:
            try:
                yield session
                session.commit()
            except Exception:
                session.rollback()
                raise

    app.dependency_overrides[dependencies.get_current_user] = lambda: current[0]
    app.dependency_overrides[dependencies.get_db_session] = db_session
    try:
        with TestClient(app) as client:
            yield client, current, broker_id
    finally:
        app.dependency_overrides.clear()


def create(
    client: TestClient, broker_id: UUID, name: str = "Main", currency: str = "usd"
):
    return client.post(
        f"{API}/accounts",
        headers=BEARER,
        json={"broker_id": str(broker_id), "name": name, "currency": currency},
    )


def test_brokers_are_shared_read_only_and_account_reads_are_scoped(
    accounts_client: tuple[TestClient, list[User], UUID],
) -> None:
    client, current, broker_id = accounts_client
    brokers = client.get(f"{API}/brokers", headers=BEARER)
    assert brokers.status_code == 200
    assert [
        (item["name"], item["country"])
        for item in brokers.json()
        if item["name"] in {"Tiger", "IBKR"}
    ] == [("IBKR", "SG"), ("Tiger", "SG")]
    assert all(set(item) == {"id", "name", "country"} for item in brokers.json())
    assert client.post(f"{API}/brokers", headers=BEARER, json={}).status_code in (
        404,
        405,
    )
    assert client.get(f"{API}/accounts", headers=BEARER).json() == []

    created = create(client, broker_id, "  Main  ")
    assert created.status_code == 201
    account = created.json()
    assert set(account) == {"id", "broker_id", "broker_name", "name", "currency"}
    assert (account["name"], account["currency"]) == ("Main", "USD")
    assert account["broker_name"].startswith("HTTP Fixture ")
    assert created.headers["location"] == f"{API}/accounts/{account['id']}"
    assert client.get(f"{API}/accounts/{account['id']}", headers=BEARER).json() == (
        account
    )
    assert client.get(f"{API}/accounts", headers=BEARER).json() == [account]

    current[0], current[1] = current[1], current[0]
    assert client.get(f"{API}/brokers", headers=BEARER).json() == brokers.json()
    assert client.get(f"{API}/accounts", headers=BEARER).json() == []


def test_second_user_cannot_read_edit_or_delete_first_users_account(
    accounts_client: tuple[TestClient, list[User], UUID],
) -> None:
    client, current, broker_id = accounts_client
    first = create(client, broker_id)
    assert first.status_code == 201
    first_id = first.json()["id"]
    current[0], current[1] = current[1], current[0]
    missing = client.get(f"{API}/accounts/{uuid4()}", headers=BEARER)
    foreign = client.get(f"{API}/accounts/{first_id}", headers=BEARER)
    assert (missing.status_code, missing.json()) == (
        foreign.status_code,
        foreign.json(),
    )
    assert foreign.status_code == 404
    assert (
        client.patch(
            f"{API}/accounts/{first_id}", headers=BEARER, json={"name": "Changed"}
        ).status_code
        == 404
    )
    assert (
        client.delete(f"{API}/accounts/{first_id}", headers=BEARER).status_code == 404
    )
    unknown_id = str(uuid4())
    for method, payload in (("patch", {"name": "Changed"}), ("delete", None)):
        request = getattr(client, method)
        options = {"headers": BEARER}
        if payload is not None:
            options["json"] = payload
        unknown = request(f"{API}/accounts/{unknown_id}", **options)
        foreign = request(f"{API}/accounts/{first_id}", **options)
        assert (unknown.status_code, unknown.json()) == (
            foreign.status_code,
            foreign.json(),
        )
        assert unknown.status_code == 404
    assert client.get(f"{API}/accounts", headers=BEARER).json() == []
    second = create(client, broker_id, "Main", "SGD")
    assert second.status_code == 201
    assert second.json()["id"] != first_id
    current[0], current[1] = current[1], current[0]
    assert client.get(f"{API}/accounts", headers=BEARER).json() == [first.json()]


@pytest.mark.parametrize(
    "payload",
    [
        {"name": " \t "},
        {"name": "x" * 256},
        {"currency": "US1"},
        {"currency": " USD"},
        {"broker_id": str(uuid4())},
        {"user_id": str(uuid4())},
        {"id": str(uuid4())},
        {},
    ],
)
def test_patch_rejects_invalid_or_immutable_fields_without_changing_row(
    accounts_client: tuple[TestClient, list[User], UUID], payload: dict[str, str]
) -> None:
    client, _, broker_id = accounts_client
    original = create(client, broker_id)
    assert original.status_code == 201
    account = original.json()
    response = client.patch(
        f"{API}/accounts/{account['id']}", headers=BEARER, json=payload
    )
    assert response.status_code == 422
    assert (
        client.get(f"{API}/accounts/{account['id']}", headers=BEARER).json() == account
    )


@pytest.mark.parametrize(
    "payload",
    [
        {"name": " \t ", "currency": "SGD"},
        {"name": "x" * 256, "currency": "SGD"},
        {"name": "Main", "currency": "éUR"},
        {"name": "Main", "currency": "US1"},
        {"name": "Main", "currency": "SGD", "user_id": str(uuid4())},
        {"name": "Main", "currency": "SGD", "id": str(uuid4())},
    ],
)
def test_create_rejects_invalid_fields_without_a_partial_write(
    accounts_client: tuple[TestClient, list[User], UUID], payload: dict[str, str]
) -> None:
    client, _, broker_id = accounts_client
    response = client.post(
        f"{API}/accounts",
        headers=BEARER,
        json={"broker_id": str(broker_id), **payload},
    )
    assert response.status_code == 422
    assert client.get(f"{API}/accounts", headers=BEARER).json() == []


def test_unknown_broker_duplicate_name_and_malformed_ids_have_private_errors(
    accounts_client: tuple[TestClient, list[User], UUID],
) -> None:
    client, _, broker_id = accounts_client
    assert create(client, uuid4()).status_code == 404
    first = create(client, broker_id)
    assert first.status_code == 201
    conflict = create(client, broker_id, "main")
    assert conflict.status_code == 409
    assert "uq_" not in conflict.text
    assert "broker_accounts" not in conflict.text
    assert client.get(f"{API}/accounts/not-a-uuid", headers=BEARER).status_code == 422
    assert (
        client.patch(
            f"{API}/accounts/not-a-uuid", headers=BEARER, json={"name": "Other"}
        ).status_code
        == 422
    )
    malformed_delete = client.delete(f"{API}/accounts/not-a-uuid", headers=BEARER)
    assert malformed_delete.status_code == 422
    assert create(client, broker_id, " Main ").status_code == 409
    assert client.get(f"{API}/accounts/{uuid4()}", headers=BEARER).status_code == 404
    assert client.get(f"{API}/accounts", headers=BEARER).json() == [first.json()]


def test_concurrent_case_variant_posts_have_one_success_and_one_conflict(
    accounts_client: tuple[TestClient, list[User], UUID],
) -> None:
    client, _, broker_id = accounts_client
    barrier = Barrier(2)

    def submit(name: str) -> int:
        barrier.wait(timeout=5)
        return create(client, broker_id, name).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = [pool.submit(submit, name) for name in ("Main", "main")]
        assert sorted(result.result(timeout=10) for result in results) == [201, 409]
    assert len(client.get(f"{API}/accounts", headers=BEARER).json()) == 1


def test_renaming_to_another_owned_name_returns_conflict_without_mutation(
    accounts_client: tuple[TestClient, list[User], UUID],
) -> None:
    client, _, broker_id = accounts_client
    first = create(client, broker_id, "Main")
    second = create(client, broker_id, "Savings")
    assert first.status_code == second.status_code == 201
    response = client.patch(
        f"{API}/accounts/{second.json()['id']}",
        headers=BEARER,
        json={"name": "main"},
    )
    assert response.status_code == 409
    assert (
        client.get(f"{API}/accounts/{second.json()['id']}", headers=BEARER).json()
        == second.json()
    )


def test_partial_edit_and_transaction_free_delete(
    accounts_client: tuple[TestClient, list[User], UUID],
) -> None:
    client, _, broker_id = accounts_client
    first = create(client, broker_id)
    assert first.status_code == 201
    account = first.json()
    changed = client.patch(
        f"{API}/accounts/{account['id']}",
        headers=BEARER,
        json={"name": "  Growth  "},
    )
    assert changed.status_code == 200
    assert changed.json() == {**account, "name": "Growth"}
    currency = client.patch(
        f"{API}/accounts/{account['id']}", headers=BEARER, json={"currency": "sgd"}
    )
    assert currency.status_code == 200
    assert currency.json() == {**account, "name": "Growth", "currency": "SGD"}
    removed = client.delete(f"{API}/accounts/{account['id']}", headers=BEARER)
    assert removed.status_code == 204
    assert client.get(f"{API}/accounts", headers=BEARER).json() == []


def test_delete_with_transactions_returns_conflict_without_losing_data(
    accounts_client: tuple[TestClient, list[User], UUID], database_engine: Engine
) -> None:
    client, current, broker_id = accounts_client
    created = create(client, broker_id)
    assert created.status_code == 201
    account = created.json()
    trade_id, instrument_id = uuid4(), uuid4()
    with database_engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO instruments"
                "(id, symbol, exchange, name, asset_type, currency) "
                "VALUES (:id, 'ACCT006', 'TEST', 'Fixture', 'equity', 'USD')"
            ),
            {"id": instrument_id},
        )
        connection.execute(
            text(
                "INSERT INTO transactions"
                "(id, user_id, broker_account_id, instrument_id, "
                "trade_date, type, quantity, unit_price_amount, fee_amount, "
                "instrument_currency) VALUES "
                "(:id, :owner, :account, :instrument, "
                "'2026-11-17', 'BUY', 1, 100, 0, 'USD')"
            ),
            {
                "id": trade_id,
                "owner": current[0].id,
                "account": UUID(account["id"]),
                "instrument": instrument_id,
            },
        )
    blocked = client.delete(f"{API}/accounts/{account['id']}", headers=BEARER)
    assert blocked.status_code == 409
    assert "fk_transactions" not in blocked.text
    assert (
        client.get(f"{API}/accounts/{account['id']}", headers=BEARER).json() == account
    )
    with database_engine.connect() as connection:
        assert (
            connection.execute(
                text("SELECT count(*) FROM transactions WHERE id = :id"),
                {"id": trade_id},
            ).scalar_one()
            == 1
        )


def test_write_preflight_allows_configured_origin_without_cookies() -> None:
    app = import_module("app.main").app
    with TestClient(app) as client:
        for method in ("GET", "POST", "PATCH", "DELETE"):
            headers = {
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": method,
                "Access-Control-Request-Headers": "authorization,content-type",
            }
            allowed = client.options(f"{API}/accounts", headers=headers)
            assert allowed.status_code == 200
            assert allowed.headers["access-control-allow-origin"] == headers["Origin"]
            assert allowed.headers.get("access-control-allow-credentials") != "true"
            denied = client.options(
                f"{API}/accounts",
                headers={**headers, "Origin": "https://attacker.invalid.test"},
            )
            assert denied.status_code == 400
            assert "access-control-allow-origin" not in denied.headers
        unnecessary = client.options(
            f"{API}/accounts",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "PUT",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        assert unnecessary.status_code == 400
        assert "PUT" not in unnecessary.headers.get("access-control-allow-methods", "")


def test_account_routes_require_bearer_and_preserve_public_health() -> None:
    app = import_module("app.main").app
    with TestClient(app) as client:
        assert client.get(f"{API}/health").json() == {"status": "ok"}
        for path in (f"{API}/brokers", f"{API}/accounts"):
            assert client.get(path).status_code == 401
            assert (
                client.get(path, headers={"Authorization": "Bearer bad"}).status_code
                == 401
            )


def test_detail_and_writes_reject_missing_or_invalid_bearer_without_mutation(
    accounts_client: tuple[TestClient, list[User], UUID],
) -> None:
    client, _, broker_id = accounts_client
    created = create(client, broker_id)
    assert created.status_code == 201
    account_id = created.json()["id"]
    app = import_module("app.main").app
    dependencies = import_module("app.dependencies")
    owner_override = app.dependency_overrides.pop(dependencies.get_current_user)
    try:
        for headers in ({}, {"Authorization": "Bearer bad"}):
            for method, path, payload in (
                ("get", f"{API}/accounts/{account_id}", None),
                (
                    "post",
                    f"{API}/accounts",
                    {"broker_id": str(broker_id), "name": "Denied", "currency": "USD"},
                ),
                ("patch", f"{API}/accounts/{account_id}", {"name": "Denied"}),
                ("delete", f"{API}/accounts/{account_id}", None),
            ):
                options = {"headers": headers}
                if payload is not None:
                    options["json"] = payload
                assert getattr(client, method)(path, **options).status_code == 401
    finally:
        app.dependency_overrides[dependencies.get_current_user] = owner_override
    assert client.get(f"{API}/accounts", headers=BEARER).json() == [created.json()]


def test_unavailable_current_user_does_not_return_an_empty_list() -> None:
    app = import_module("app.main").app
    dependencies = import_module("app.dependencies")

    def unavailable() -> None:
        raise HTTPException(status_code=503, detail="Authentication unavailable")

    app.dependency_overrides[dependencies.get_current_user] = unavailable
    try:
        with TestClient(app) as client:
            assert client.get(f"{API}/accounts", headers=BEARER).status_code == 503
    finally:
        app.dependency_overrides.clear()


def test_missing_request_database_is_503_not_an_empty_account_list() -> None:
    app = import_module("app.main").app
    dependencies = import_module("app.dependencies")
    app.dependency_overrides[dependencies.get_current_user] = lambda: User(
        uuid4(), "SGD"
    )
    app.dependency_overrides[dependencies.get_db_session] = lambda: None
    try:
        with TestClient(app) as client:
            response = client.get(f"{API}/accounts", headers=BEARER)
        assert response.status_code == 503
        assert response.json() != []
        with TestClient(app) as client:
            assert client.get(f"{API}/brokers", headers=BEARER).status_code == 503
            assert (
                client.post(
                    f"{API}/accounts",
                    headers=BEARER,
                    json={"broker_id": str(uuid4()), "name": "Main", "currency": "USD"},
                ).status_code
                == 503
            )
    finally:
        app.dependency_overrides.clear()


def test_local_database_connection_outage_has_a_generic_503() -> None:
    app = import_module("app.main").app
    dependencies = import_module("app.dependencies")
    engine = create_engine(
        "postgresql+psycopg://tallyhold@127.0.0.1:65432/tallyhold_test_outage",
        connect_args={"connect_timeout": 1},
    )

    def unavailable_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[dependencies.get_current_user] = lambda: User(
        uuid4(), "SGD"
    )
    app.dependency_overrides[dependencies.get_db_session] = unavailable_session
    try:
        with TestClient(app, raise_server_exceptions=False) as client:
            response = client.get(f"{API}/accounts", headers=BEARER)
        assert response.status_code == 503
        assert "psycopg" not in response.text
        assert "65432" not in response.text
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
