"""AC2, AC4-AC6: direct SQL proves constraints beyond repository prechecks."""

from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import Connection, text

from .conftest import rejected_sql


def insert(connection: Connection, table: str, **values: object) -> None:
    # Call sites supply literal table names; values stay bound parameters.
    columns = ", ".join(values)
    placeholders = ", ".join(f":{key}" for key in values)
    connection.execute(
        text(f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"),
        values,
    )


def seed_rows(connection: Connection) -> dict[str, object]:
    owner, other, broker, account, instrument = (uuid4() for _ in range(5))
    insert(connection, "users", id=owner, base_currency="USD")
    insert(connection, "users", id=other, base_currency="SGD")
    insert(connection, "brokers", id=broker, name="Fixture Broker", country="SG")
    insert(
        connection,
        "broker_accounts",
        id=account,
        user_id=owner,
        broker_id=broker,
        name="Main",
        currency="USD",
    )
    insert(
        connection,
        "instruments",
        id=instrument,
        symbol="AAPL",
        exchange="NASDAQ",
        name="Apple",
        asset_type="equity",
        currency="USD",
    )
    return {
        "owner": owner,
        "other": other,
        "broker": broker,
        "account": account,
        "instrument": instrument,
    }


def trade(rows: dict[str, object], **overrides: object) -> dict[str, object]:
    values = {
        "id": uuid4(),
        "user_id": rows["owner"],
        "broker_account_id": rows["account"],
        "instrument_id": rows["instrument"],
        "instrument_currency": "USD",
        "trade_date": "2025-01-15",
        "type": "BUY",
        "quantity": Decimal("1.12345678"),
        "unit_price_amount": Decimal("123.123456"),
        "fee_amount": Decimal("0.000001"),
    }
    values.update(overrides)
    return values


def test_direct_sql_rejects_cross_user_and_currency_links(
    connection: Connection,
) -> None:
    rows = seed_rows(connection)
    with rejected_sql(connection):
        insert(connection, "transactions", **trade(rows, user_id=rows["other"]))
    with rejected_sql(connection):
        insert(
            connection,
            "transactions",
            **trade(rows, instrument_currency="SGD"),
        )
    with rejected_sql(connection):
        insert(
            connection,
            "transactions",
            **trade(rows, broker_account_id=uuid4()),
        )
    assert (
        connection.execute(
            text("SELECT count(*) FROM transactions WHERE user_id = :owner"),
            {"owner": rows["owner"]},
        ).scalar_one()
        == 0
    )


@pytest.mark.parametrize(
    ("column", "invalid"),
    (
        ("type", "DIVIDEND"),
        ("quantity", Decimal("0")),
        ("quantity", Decimal("-1")),
        ("unit_price_amount", Decimal("0")),
        ("fee_amount", Decimal("-0.01")),
        ("instrument_currency", "us1"),
    ),
)
def test_direct_sql_rejects_invalid_trade_values(
    connection: Connection,
    column: str,
    invalid: object,
) -> None:
    rows = seed_rows(connection)
    with rejected_sql(connection):
        insert(connection, "transactions", **trade(rows, **{column: invalid}))
    assert (
        connection.execute(
            text("SELECT count(*) FROM transactions WHERE user_id = :owner"),
            {"owner": rows["owner"]},
        ).scalar_one()
        == 0
    )


@pytest.mark.parametrize(
    "column",
    ("quantity", "unit_price_amount", "fee_amount"),
)
def test_direct_sql_rejects_nan_trade_values(
    connection: Connection,
    column: str,
) -> None:
    rows = seed_rows(connection)
    with rejected_sql(connection):
        insert(connection, "transactions", **trade(rows, **{column: Decimal("NaN")}))
    assert (
        connection.execute(
            text("SELECT count(*) FROM transactions WHERE user_id = :owner"),
            {"owner": rows["owner"]},
        ).scalar_one()
        == 0
    )


@pytest.mark.parametrize(
    "table,column",
    (
        ("users", "base_currency"),
        ("broker_accounts", "currency"),
        ("instruments", "currency"),
    ),
)
def test_currency_check_rejects_noncanonical_codes(
    connection: Connection,
    table: str,
    column: str,
) -> None:
    rows = seed_rows(connection)
    values = {
        "users": {"id": uuid4(), "base_currency": "us1"},
        "broker_accounts": {
            "id": uuid4(),
            "user_id": rows["owner"],
            "broker_id": rows["broker"],
            "name": "Other",
            "currency": "us1",
        },
        "instruments": {
            "id": uuid4(),
            "symbol": "MSFT",
            "exchange": "NASDAQ",
            "name": "Microsoft",
            "asset_type": "equity",
            "currency": "us1",
        },
    }
    assert values[table][column] == "us1"
    with rejected_sql(connection):
        insert(connection, table, **values[table])


def test_unique_keys_and_referenced_account_delete(
    connection: Connection,
) -> None:
    rows = seed_rows(connection)
    with rejected_sql(connection):
        insert(connection, "brokers", id=uuid4(), name="Fixture Broker", country="SG")
    with rejected_sql(connection):
        insert(
            connection,
            "broker_accounts",
            id=uuid4(),
            user_id=rows["owner"],
            broker_id=rows["broker"],
            name="Main",
            currency="USD",
        )
    with rejected_sql(connection):
        insert(
            connection,
            "instruments",
            id=uuid4(),
            symbol="aapl",
            exchange="nasdaq",
            name="Duplicate",
            asset_type="equity",
            currency="USD",
        )
    # Name uniqueness is tenant-scoped, not global.
    insert(
        connection,
        "broker_accounts",
        id=uuid4(),
        user_id=rows["other"],
        broker_id=rows["broker"],
        name="Main",
        currency="USD",
    )
    insert(connection, "transactions", **trade(rows))
    with rejected_sql(connection):
        connection.execute(
            text("DELETE FROM broker_accounts WHERE id = :id"), {"id": rows["account"]}
        )
    assert (
        connection.execute(
            text("SELECT count(*) FROM broker_accounts WHERE id = :id"),
            {"id": rows["account"]},
        ).scalar_one()
        == 1
    )


def test_exact_numeric_round_trip_at_column_limits(
    connection: Connection,
) -> None:
    rows = seed_rows(connection)
    values = trade(
        rows,
        quantity=Decimal("9999999999.12345678"),
        unit_price_amount=Decimal("99999999999999.123456"),
        fee_amount=Decimal("0.000001"),
    )
    insert(connection, "transactions", **values)
    result = connection.execute(
        text(
            "SELECT quantity, unit_price_amount, fee_amount, entry_seq "
            "FROM transactions WHERE id = :id"
        ),
        {"id": values["id"]},
    ).one()
    assert result[:3] == (
        Decimal("9999999999.12345678"),
        Decimal("99999999999999.123456"),
        Decimal("0.000001"),
    )
    assert isinstance(result.entry_seq, int)


def test_audit_timestamps_populate_and_advance_on_updates(
    connection: Connection,
) -> None:
    rows = seed_rows(connection)
    trade_values = trade(rows)
    insert(connection, "transactions", **trade_values)
    for table in ("users", "brokers", "broker_accounts", "instruments", "transactions"):
        assert connection.execute(
            text(f"SELECT bool_and(created_at IS NOT NULL) FROM {table}")
        ).scalar_one()
    for table in ("broker_accounts", "transactions"):
        row_id = rows["account"] if table == "broker_accounts" else trade_values["id"]
        original = connection.execute(
            text(f"SELECT created_at, updated_at FROM {table} WHERE id = :id"),
            {"id": row_id},
        ).one()
        connection.execute(
            text(
                f"UPDATE {table} SET updated_at = updated_at + INTERVAL '1 second' "
                "WHERE id = :id"
            ),
            {"id": row_id},
        )
        changed = connection.execute(
            text(f"SELECT created_at, updated_at FROM {table} WHERE id = :id"),
            {"id": row_id},
        ).one()
        assert changed.created_at == original.created_at
        assert changed.updated_at > original.updated_at
