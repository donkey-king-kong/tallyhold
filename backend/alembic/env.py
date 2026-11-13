"""Configure migrations against the explicitly selected PostgreSQL database."""

import os
from logging.config import fileConfig

from sqlalchemy import MetaData, engine_from_config, pool

from alembic import context

config = context.config
if config.config_file_name and config.get_section("loggers"):
    fileConfig(config.config_file_name)

url = os.environ["DATABASE_URL"]
config.set_main_option("sqlalchemy.url", url.replace("%", "%%"))
target_metadata = MetaData()


def run_migrations_offline() -> None:
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
