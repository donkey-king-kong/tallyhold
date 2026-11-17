"""Seed shared brokers and enforce case-insensitive owned account names.

Revision ID: 0004_accounts_catalog
Revises: 0003_auth_identity
"""

from uuid import UUID

import sqlalchemy as sa

from alembic import op

revision = "0004_accounts_catalog"
down_revision = "0003_auth_identity"
branch_labels = None
depends_on = None

INDEX = "uq_broker_accounts_user_id_name_ci"
LEGACY = "uq_broker_accounts_user_id_name"
SEEDS = (
    (UUID("00000000-0000-4000-8000-000000000601"), "Tiger", "SG"),
    (UUID("00000000-0000-4000-8000-000000000602"), "IBKR", "SG"),
)
WHITESPACE = " \t\n\r\f\v"


def upgrade() -> None:
    connection = op.get_bind()
    connection.execute(
        sa.text("LOCK TABLE broker_accounts IN SHARE ROW EXCLUSIVE MODE")
    )
    invalid_name = connection.execute(
        sa.text(
            "SELECT 1 FROM broker_accounts "
            "WHERE name <> btrim(name, :whitespace) "
            "OR btrim(name, :whitespace) = '' LIMIT 1"
        ),
        {"whitespace": WHITESPACE},
    ).first()
    if invalid_name:
        raise RuntimeError("noncanonical account names require operator remediation")
    collision = connection.execute(
        sa.text(
            "SELECT 1 FROM broker_accounts GROUP BY user_id, lower(name) "
            "HAVING count(*) > 1 LIMIT 1"
        )
    ).first()
    if collision:
        raise RuntimeError("account name collision requires operator remediation")

    for broker_id, _, _ in SEEDS:
        if connection.execute(
            sa.text("SELECT 1 FROM brokers WHERE id = :id"), {"id": broker_id}
        ).first():
            raise RuntimeError("reserved broker ID collision requires remediation")

    for broker_id, name, country in SEEDS:
        connection.execute(
            sa.text(
                "INSERT INTO brokers (id, name, country) "
                "SELECT :id, CAST(:name AS varchar), CAST(:country AS varchar) "
                "WHERE NOT EXISTS (SELECT 1 FROM brokers "
                "WHERE name = :name AND country = :country)"
            ),
            {"id": broker_id, "name": name, "country": country},
        )
    op.create_index(
        INDEX,
        "broker_accounts",
        ["user_id", sa.text("lower(name)")],
        unique=True,
    )
    op.drop_constraint(LEGACY, "broker_accounts", type_="unique")


def downgrade() -> None:
    connection = op.get_bind()
    connection.execute(
        sa.text("LOCK TABLE broker_accounts IN SHARE ROW EXCLUSIVE MODE")
    )
    for broker_id, name, country in SEEDS:
        if connection.execute(
            sa.text(
                "SELECT 1 FROM broker_accounts WHERE broker_id = :id "
                "AND EXISTS (SELECT 1 FROM brokers WHERE id = :id "
                "AND name = :name AND country = :country) LIMIT 1"
            ),
            {"id": broker_id, "name": name, "country": country},
        ).first():
            raise RuntimeError("seeded broker is referenced by an account")
    op.create_unique_constraint(LEGACY, "broker_accounts", ["user_id", "name"])
    op.drop_index(INDEX, table_name="broker_accounts")
    for broker_id, name, country in SEEDS:
        connection.execute(
            sa.text(
                "DELETE FROM brokers WHERE id = :id AND name = :name "
                "AND country = :country"
            ),
            {"id": broker_id, "name": name, "country": country},
        )
