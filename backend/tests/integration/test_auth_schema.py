"""Feature 005 AC3/AC5: additive identity and deny-marker PostgreSQL schema."""

from uuid import uuid4

import pytest
from sqlalchemy import Connection, create_engine, inspect, text
from sqlalchemy.engine import Engine

from .conftest import disposable_database, migrate, rejected_sql

AUTH_TABLES = {"identities", "erasure_deny_markers"}
EXISTING_TABLES = {
    "users",
    "brokers",
    "broker_accounts",
    "instruments",
    "transactions",
}


def auth_catalog(engine: Engine) -> tuple[tuple[object, ...], ...]:
    with engine.connect() as connection:
        return tuple(
            tuple(sorted(tuple(row) for row in connection.execute(text(query))))
            for query in (
                "SELECT table_name, column_name, data_type, is_nullable "
                "FROM information_schema.columns WHERE table_schema = 'public' "
                "AND table_name IN ('identities','erasure_deny_markers')",
                "SELECT c.conrelid::regclass::text, c.contype, "
                "pg_get_constraintdef(c.oid) FROM pg_constraint c "
                "WHERE c.conrelid::regclass::text "
                "IN ('identities','erasure_deny_markers')",
            )
        )


def test_0003_upgrade_downgrade_reupgrade_adds_only_approved_tables(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    with disposable_database() as url, disposable_database() as clean_url:
        migrate(url, "0002_core_persistence", "upgrade", monkeypatch)
        engine = create_engine(url)
        clean = create_engine(clean_url)
        try:
            before = set(inspect(engine).get_table_names())
            assert before == EXISTING_TABLES | {"alembic_version"}
            migrate(url, "0003_auth_identity", "upgrade", monkeypatch)
            assert set(inspect(engine).get_table_names()) == before | AUTH_TABLES
            first = auth_catalog(engine)
            migrate(url, "0002_core_persistence", "downgrade", monkeypatch)
            assert set(inspect(engine).get_table_names()) == before
            migrate(url, "0003_auth_identity", "upgrade", monkeypatch)
            migrate(clean_url, "head", "upgrade", monkeypatch)
            assert first == auth_catalog(engine) == auth_catalog(clean)
        finally:
            engine.dispose()
            clean.dispose()


def test_identity_and_marker_columns_match_the_approved_minimal_contract(
    database_engine: Engine,
) -> None:
    with database_engine.connect() as connection:
        assert AUTH_TABLES <= set(inspect(connection).get_table_names())
        columns = {
            table: {
                column["name"]: column
                for column in inspect(connection).get_columns(table)
            }
            for table in AUTH_TABLES
        }
        assert set(columns["identities"]) == {
            "id",
            "user_id",
            "issuer",
            "subject",
            "provider",
            "created_at",
        }
        assert set(columns["erasure_deny_markers"]) == {
            "issuer",
            "subject",
            "expires_at",
            "created_at",
        }
        assert columns["identities"]["provider"]["nullable"]
        for table, names in (
            ("identities", ("id", "user_id", "issuer", "subject", "created_at")),
            (
                "erasure_deny_markers",
                ("issuer", "subject", "expires_at", "created_at"),
            ),
        ):
            assert all(not columns[table][name]["nullable"] for name in names)
        constraints = {
            (row.table_name, row.kind, row.definition, row.delete_action)
            for row in connection.execute(
                text(
                    "SELECT c.conrelid::regclass::text AS table_name, "
                    "c.contype AS kind, pg_get_constraintdef(c.oid) AS definition, "
                    "c.confdeltype AS delete_action FROM pg_constraint c "
                    "WHERE c.conrelid::regclass::text "
                    "IN ('identities','erasure_deny_markers')"
                )
            )
        }
        assert any(
            table == "identities" and kind == "u" and "(issuer, subject)" in definition
            for table, kind, definition, _ in constraints
        )
        assert any(
            table == "identities"
            and kind == "f"
            and "FOREIGN KEY (user_id) REFERENCES users(id)" in definition
            and action == "a"
            for table, kind, definition, action in constraints
        )
        assert any(
            table == "erasure_deny_markers"
            and kind == "p"
            and "(issuer, subject)" in definition
            for table, kind, definition, _ in constraints
        )
        assert any(
            item["column_names"] == ["user_id"]
            for item in inspect(connection).get_indexes("identities")
        )


def test_identity_unique_pair_and_user_foreign_key_are_enforced(
    connection: Connection,
) -> None:
    owner = uuid4()
    connection.execute(
        text("INSERT INTO users(id, base_currency) VALUES (:id, 'SGD')"),
        {"id": owner},
    )
    statement = text(
        "INSERT INTO identities(id, user_id, issuer, subject) "
        "VALUES (:id, :owner, :issuer, :subject)"
    )
    pair = {"issuer": "https://auth.invalid.test/auth/v1", "subject": str(uuid4())}
    connection.execute(statement, {"id": uuid4(), "owner": owner, **pair})
    with rejected_sql(connection):
        connection.execute(statement, {"id": uuid4(), "owner": owner, **pair})
    with rejected_sql(connection):
        connection.execute(
            statement,
            {
                "id": uuid4(),
                "owner": uuid4(),
                "issuer": pair["issuer"],
                "subject": str(uuid4()),
            },
        )
    assert connection.execute(text("SELECT count(*) FROM identities")).scalar_one() == 1
