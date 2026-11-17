"""Feature 006 AC1/AC3/AC4/AC7: catalog and name-index migration."""

from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import UUID, uuid4

import pytest
from alembic.config import Config
from sqlalchemy import Connection, create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError

from alembic import command

from .conftest import BACKEND, disposable_database, migrate, rejected_sql

INDEX = "uq_broker_accounts_user_id_name_ci"
LEGACY = "uq_broker_accounts_user_id_name"


def _broker_ids(connection: Connection) -> dict[str, UUID]:
    return {
        row.name: row.id
        for row in connection.execute(
            text("SELECT id, name FROM brokers WHERE country = 'SG'")
        )
        if row.name in {"Tiger", "IBKR"}
    }


def _account(connection: Connection, owner: UUID, broker: UUID, name: str) -> UUID:
    account_id = uuid4()
    connection.execute(
        text(
            "INSERT INTO broker_accounts(id, user_id, broker_id, name, currency) "
            "VALUES (:id, :user_id, :broker_id, :name, 'SGD')"
        ),
        {
            "id": account_id,
            "user_id": owner,
            "broker_id": broker,
            "name": name,
        },
    )
    return account_id


def _owner(connection: Connection) -> UUID:
    owner = uuid4()
    connection.execute(
        text("INSERT INTO users(id, base_currency) VALUES (:id, 'SGD')"),
        {"id": owner},
    )
    return owner


def test_head_seeds_shared_sg_brokers_and_replaces_exact_name_constraint(
    database_engine: Engine,
) -> None:
    with database_engine.connect() as connection:
        assert [
            (row.name, row.country)
            for row in connection.execute(
                text(
                    "SELECT name, country FROM brokers "
                    "WHERE name IN ('IBKR', 'Tiger') ORDER BY name"
                )
            )
        ] == [("IBKR", "SG"), ("Tiger", "SG")]
        assert INDEX in {
            index["name"]
            for index in inspect(connection).get_indexes("broker_accounts")
            if index["unique"]
        }
        assert LEGACY not in {
            item["name"]
            for item in inspect(connection).get_unique_constraints("broker_accounts")
        }


def test_preexisting_broker_id_survives_upgrade_downgrade_and_reupgrade(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    with disposable_database() as url:
        migrate(url, "0003_auth_identity", "upgrade", monkeypatch)
        engine = create_engine(url)
        try:
            existing = uuid4()
            with engine.begin() as connection:
                connection.execute(
                    text(
                        "INSERT INTO brokers(id, name, country) "
                        "VALUES (:id, 'Tiger', 'SG')"
                    ),
                    {"id": existing},
                )
            migrate(url, "0004_accounts_catalog", "upgrade", monkeypatch)
            with engine.connect() as connection:
                first = _broker_ids(connection)
            assert first["Tiger"] == existing
            assert first["IBKR"] != existing
            migrate(url, "0003_auth_identity", "downgrade", monkeypatch)
            with engine.connect() as connection:
                assert _broker_ids(connection) == {"Tiger": existing}
                assert LEGACY in {
                    item["name"]
                    for item in inspect(connection).get_unique_constraints(
                        "broker_accounts"
                    )
                }
            migrate(url, "0004_accounts_catalog", "upgrade", monkeypatch)
            with engine.connect() as connection:
                assert _broker_ids(connection) == first
        finally:
            engine.dispose()


def test_reserved_seed_id_collision_rejects_upgrade_without_overwriting(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    with disposable_database() as seeded_url, disposable_database() as target_url:
        migrate(seeded_url, "0004_accounts_catalog", "upgrade", monkeypatch)
        seeded = create_engine(seeded_url)
        try:
            with seeded.connect() as connection:
                reserved = _broker_ids(connection)["IBKR"]
        finally:
            seeded.dispose()
        migrate(target_url, "0003_auth_identity", "upgrade", monkeypatch)
        target = create_engine(target_url)
        try:
            with target.begin() as connection:
                connection.execute(
                    text(
                        "INSERT INTO brokers(id, name, country) "
                        "VALUES (:id, 'Unrelated Fixture', 'SG')"
                    ),
                    {"id": reserved},
                )
            config = Config(str(BACKEND / "alembic.ini"))
            monkeypatch.setenv("DATABASE_URL", target_url)
            with pytest.raises(Exception, match="(?i)(reserved|collision)"):
                command.upgrade(config, "0004_accounts_catalog")
            with target.connect() as connection:
                assert (
                    connection.execute(
                        text("SELECT name FROM brokers WHERE id = :id"),
                        {"id": reserved},
                    ).scalar_one()
                    == "Unrelated Fixture"
                )
                assert (
                    connection.execute(
                        text("SELECT version_num FROM alembic_version")
                    ).scalar_one()
                    == "0003_auth_identity"
                )
        finally:
            target.dispose()


@pytest.mark.parametrize(
    "names",
    [("Main", "main"), (" Main ",), ("   ",)],
    ids=["case-collision", "noncanonical-whitespace", "blank-legacy-name"],
)
def test_upgrade_rejects_legacy_names_without_rewriting_rows(
    monkeypatch: pytest.MonkeyPatch, names: tuple[str, ...]
) -> None:
    with disposable_database() as url:
        migrate(url, "0003_auth_identity", "upgrade", monkeypatch)
        engine = create_engine(url)
        try:
            with engine.begin() as connection:
                owner = _owner(connection)
                broker = uuid4()
                connection.execute(
                    text(
                        "INSERT INTO brokers(id, name, country) "
                        "VALUES (:id, 'Fixture Broker', 'SG')"
                    ),
                    {"id": broker},
                )
                for name in names:
                    _account(connection, owner, broker, name)
            config = Config(str(BACKEND / "alembic.ini"))
            monkeypatch.setenv("DATABASE_URL", url)
            with pytest.raises(
                Exception, match="(?i)(noncanonical|collision|remediat)"
            ):
                command.upgrade(config, "0004_accounts_catalog")
            with engine.connect() as connection:
                assert [
                    row.name
                    for row in connection.execute(
                        text(
                            "SELECT name FROM broker_accounts "
                            "WHERE user_id = :owner ORDER BY name"
                        ),
                        {"owner": owner},
                    )
                ] == sorted(names)
                assert (
                    connection.execute(
                        text("SELECT version_num FROM alembic_version")
                    ).scalar_one()
                    == "0003_auth_identity"
                )
                assert "IBKR" not in _broker_ids(connection)
        finally:
            engine.dispose()


def test_downgrade_rejects_seed_referenced_by_an_account(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    with disposable_database() as url:
        migrate(url, "0004_accounts_catalog", "upgrade", monkeypatch)
        engine = create_engine(url)
        try:
            with engine.begin() as connection:
                owner = _owner(connection)
                account = _account(
                    connection, owner, _broker_ids(connection)["IBKR"], "Main"
                )
            config = Config(str(BACKEND / "alembic.ini"))
            monkeypatch.setenv("DATABASE_URL", url)
            with pytest.raises(Exception, match="(?i)(referenced|dependent)"):
                command.downgrade(config, "0003_auth_identity")
            with engine.connect() as connection:
                assert (
                    connection.execute(
                        text("SELECT count(*) FROM broker_accounts WHERE id = :id"),
                        {"id": account},
                    ).scalar_one()
                    == 1
                )
                assert (
                    connection.execute(
                        text("SELECT version_num FROM alembic_version")
                    ).scalar_one()
                    == "0004_accounts_catalog"
                )
                assert INDEX in {
                    item["name"]
                    for item in inspect(connection).get_indexes("broker_accounts")
                }
        finally:
            engine.dispose()


def test_name_index_rejects_case_variant_within_user_but_not_across_users(
    connection: Connection,
) -> None:
    owner, other = _owner(connection), _owner(connection)
    broker = uuid4()
    connection.execute(
        text(
            "INSERT INTO brokers(id, name, country) "
            "VALUES (:id, 'Fixture Broker', 'SG')"
        ),
        {"id": broker},
    )
    _account(connection, owner, broker, "Main")
    with rejected_sql(connection):
        _account(connection, owner, broker, "main")
    _account(connection, other, broker, "main")
    assert (
        connection.execute(
            text("SELECT count(*) FROM broker_accounts WHERE broker_id = :id"),
            {"id": broker},
        ).scalar_one()
        == 2
    )


def test_concurrent_case_variants_have_one_winner(database_engine: Engine) -> None:
    with database_engine.begin() as connection:
        owner = _owner(connection)
        broker = uuid4()
        connection.execute(
            text(
                "INSERT INTO brokers(id, name, country) "
                "VALUES (:id, 'Concurrent Fixture', 'SG')"
            ),
            {"id": broker},
        )

    barrier = Barrier(2)

    def create(name: str) -> str:
        try:
            with database_engine.begin() as connection:
                barrier.wait(timeout=5)
                _account(connection, owner, broker, name)
            return "created"
        except IntegrityError as error:
            assert error.orig.diag.constraint_name == INDEX
            return "duplicate"

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(create, name) for name in ("Main", "main")]
        assert sorted(future.result(timeout=10) for future in futures) == [
            "created",
            "duplicate",
        ]
    with database_engine.connect() as connection:
        assert (
            connection.execute(
                text("SELECT count(*) FROM broker_accounts WHERE user_id = :id"),
                {"id": owner},
            ).scalar_one()
            == 1
        )
