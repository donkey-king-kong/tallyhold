"""AC1-AC3, AC6: Alembic's public revision path and PostgreSQL catalog."""

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine, make_url

from .conftest import disposable_database, migrate

TABLES = {"users", "brokers", "broker_accounts", "instruments", "transactions"}


def test_disposable_database_is_dropped_after_failure() -> None:
    with pytest.raises(RuntimeError, match="deliberate test failure"):
        with disposable_database() as url:
            name = make_url(url).database
            raise RuntimeError("deliberate test failure")
    admin = create_engine(
        make_url(url).set(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    try:
        with admin.connect() as connection:
            assert (
                connection.execute(
                    text("SELECT count(*) FROM pg_database WHERE datname = :name"),
                    {"name": name},
                ).scalar_one()
                == 0
            )
    finally:
        admin.dispose()


def catalog(engine: Engine) -> tuple[tuple[object, ...], ...]:
    """Compare normalized definitions, ignoring physical OIDs and sequences."""
    queries = (
        "SELECT table_name, column_name, data_type, is_nullable, "
        "numeric_precision, numeric_scale, column_default, is_identity "
        "FROM information_schema.columns WHERE table_schema = 'public' "
        "AND table_name IN "
        "('users','brokers','broker_accounts','instruments','transactions')",
        "SELECT c.conrelid::regclass::text, c.contype, pg_get_constraintdef(c.oid) "
        "FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace "
        "WHERE n.nspname = 'public' AND c.conrelid::regclass::text "
        "IN ('users','brokers','broker_accounts','instruments','transactions')",
        "SELECT tablename, indexdef FROM pg_indexes WHERE schemaname = 'public' "
        "AND tablename IN "
        "('users','brokers','broker_accounts','instruments','transactions')",
    )
    with engine.connect() as connection:
        return tuple(
            tuple(sorted(tuple(row) for row in connection.execute(text(query))))
            for query in queries
        )


def test_upgrade_downgrade_reupgrade_reproduces_clean_schema(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    with disposable_database() as url, disposable_database() as clean_url:
        migrate(url, "0001_baseline", "upgrade", monkeypatch)
        engine = create_engine(url)
        clean = create_engine(clean_url)
        try:
            assert not TABLES.intersection(inspect(engine).get_table_names())
            migrate(url, "0002_core_persistence", "upgrade", monkeypatch)
            first = catalog(engine)
            assert TABLES <= set(inspect(engine).get_table_names())
            migrate(url, "0001_baseline", "downgrade", monkeypatch)
            assert not TABLES.intersection(inspect(engine).get_table_names())
            migrate(url, "0002_core_persistence", "upgrade", monkeypatch)
            migrate(clean_url, "head", "upgrade", monkeypatch)
            assert first == catalog(engine) == catalog(clean)
        finally:
            engine.dispose()
            clean.dispose()


def test_catalog_has_only_the_approved_entities_and_exact_types(
    database_engine: Engine,
) -> None:
    with database_engine.connect() as connection:
        names = set(inspect(connection).get_table_names())
        # Feature 005 tests separately require its two additive auth tables.
        assert names - {"identities", "erasure_deny_markers"} == TABLES | {
            "alembic_version"
        }
        columns = {
            (row.table_name, row.column_name): row
            for row in connection.execute(
                text(
                    "SELECT table_name, column_name, data_type, is_nullable, "
                    "numeric_precision, numeric_scale, is_identity, column_default "
                    "FROM information_schema.columns WHERE table_schema = 'public'"
                )
            )
            if row.table_name in TABLES
        }
        for table, required in {
            "users": {"id", "base_currency", "created_at"},
            "brokers": {"id", "name", "country", "created_at"},
            "broker_accounts": {
                "id",
                "user_id",
                "broker_id",
                "name",
                "currency",
                "created_at",
                "updated_at",
            },
            "instruments": {
                "id",
                "symbol",
                "exchange",
                "name",
                "asset_type",
                "currency",
                "created_at",
            },
            "transactions": {
                "id",
                "entry_seq",
                "user_id",
                "broker_account_id",
                "instrument_id",
                "trade_date",
                "type",
                "quantity",
                "unit_price_amount",
                "fee_amount",
                "instrument_currency",
                "created_at",
                "updated_at",
            },
        }.items():
            assert {column for owner, column in columns if owner == table} == required
            for column in required:
                assert columns[table, column].is_nullable == "NO"
            assert columns[table, "id"].data_type == "uuid"
            assert columns[table, "created_at"].data_type == "timestamp with time zone"
            assert columns[table, "created_at"].column_default is not None
        for table in ("broker_accounts", "transactions"):
            assert columns[table, "user_id"].data_type == "uuid"
            assert columns[table, "updated_at"].data_type == "timestamp with time zone"
            assert columns[table, "updated_at"].column_default is not None
        assert columns["transactions", "entry_seq"].data_type == "bigint"
        assert columns["transactions", "entry_seq"].is_identity == "YES"
        assert columns["transactions", "trade_date"].data_type == "date"
        for name, precision, scale in (
            ("quantity", 18, 8),
            ("unit_price_amount", 20, 6),
            ("fee_amount", 20, 6),
        ):
            column = columns["transactions", name]
            assert (
                column.data_type,
                column.numeric_precision,
                column.numeric_scale,
            ) == (
                "numeric",
                precision,
                scale,
            )
        for table, name in (
            ("users", "base_currency"),
            ("broker_accounts", "currency"),
            ("instruments", "currency"),
            ("transactions", "instrument_currency"),
        ):
            assert columns[table, name].data_type == "character"


def test_catalog_enforces_tenant_currency_and_delete_relationships(
    database_engine: Engine,
) -> None:
    with database_engine.connect() as connection:
        constraints = {
            (row.table_name, row.constraint_type, row.definition, row.delete_action)
            for row in connection.execute(
                text(
                    "SELECT c.conrelid::regclass::text AS table_name, "
                    "c.contype AS constraint_type, "
                    "pg_get_constraintdef(c.oid) AS definition, "
                    "c.confdeltype AS delete_action "
                    "FROM pg_constraint c WHERE c.conrelid::regclass::text "
                    "IN "
                    "('users','brokers','broker_accounts','instruments','transactions')"
                )
            )
        }
        assert all(
            delete_action == "a"
            for _, kind, _, delete_action in constraints
            if kind == "f"
        )
        for table, key in (
            ("brokers", "UNIQUE (name, country)"),
            ("broker_accounts", "UNIQUE (user_id, id)"),
            ("broker_accounts", "UNIQUE (user_id, name)"),
            ("instruments", "UNIQUE (id, currency)"),
        ):
            assert any(
                t == table and kind == "u" and key in definition
                for t, kind, definition, _ in constraints
            )
        for table, columns, target in (
            ("broker_accounts", "(user_id)", "users"),
            ("broker_accounts", "(broker_id)", "brokers"),
            ("transactions", "(user_id, broker_account_id)", "broker_accounts"),
            ("transactions", "(instrument_id, instrument_currency)", "instruments"),
        ):
            assert any(
                t == table
                and kind == "f"
                and columns in definition
                and f"REFERENCES {target}" in definition
                for t, kind, definition, _ in constraints
            )
        checks = " ".join(d for _, kind, d, _ in constraints if kind == "c").lower()
        for token in ("buy", "sell", "quantity", "unit_price_amount", "fee_amount"):
            assert token in checks
        indexes = {
            (row.tablename, row.indexdef)
            for row in connection.execute(
                text(
                    "SELECT tablename, indexdef FROM pg_indexes "
                    "WHERE schemaname = 'public'"
                )
            )
        }
        for table, columns in (
            ("transactions", "(user_id, broker_account_id, trade_date, entry_seq)"),
            ("transactions", "(user_id, id)"),
            ("instruments", "upper("),
        ):
            assert any(
                t == table and columns in definition for t, definition in indexes
            )
