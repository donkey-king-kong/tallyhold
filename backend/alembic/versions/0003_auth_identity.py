"""Add verified identity mappings and operator-owned erasure markers.

Revision ID: 0003_auth_identity
Revises: 0002_core_persistence
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

revision = "0003_auth_identity"
down_revision = "0002_core_persistence"
branch_labels = None
depends_on = None


def created_at() -> sa.Column:
    return sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        nullable=False,
    )


def upgrade() -> None:
    op.create_table(
        "identities",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("issuer", sa.String(512), nullable=False),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("provider", sa.String(64), nullable=True),
        created_at(),
        sa.UniqueConstraint("issuer", "subject", name="uq_identities_issuer_subject"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_identities_user_id",
            ondelete="NO ACTION",
        ),
    )
    op.create_index("ix_identities_user_id", "identities", ["user_id"])
    op.create_table(
        "erasure_deny_markers",
        sa.Column("issuer", sa.String(512), primary_key=True),
        sa.Column("subject", sa.String(255), primary_key=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        created_at(),
    )


def downgrade() -> None:
    op.drop_table("erasure_deny_markers")
    op.drop_index("ix_identities_user_id", table_name="identities")
    op.drop_table("identities")
