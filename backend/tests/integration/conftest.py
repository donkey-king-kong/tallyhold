"""Feature 003 contracts against isolated, migrated PostgreSQL 17 databases."""

import os
from collections.abc import Iterator
from contextlib import contextmanager
from importlib import import_module
from inspect import getmembers, isclass
from pathlib import Path
from uuid import uuid4

import pytest
from alembic.config import Config
from sqlalchemy import Connection, create_engine, text
from sqlalchemy.engine import URL, Engine, make_url
from sqlalchemy.orm import Session

from alembic import command

BACKEND = Path(__file__).resolve().parents[2]
TEST_URL_ENV = "TALLYHOLD_TEST_DATABASE_URL"


def _test_url() -> URL:
    raw = os.environ.get(TEST_URL_ENV)
    if not raw:
        pytest.fail(
            f"set {TEST_URL_ENV} to the Compose PostgreSQL test target "
            "(postgresql+psycopg://tallyhold@127.0.0.1:55432/tallyhold_test)"
        )
    url = make_url(raw)
    if (
        url.drivername != "postgresql+psycopg"
        or url.host not in {"127.0.0.1", "localhost"}
        or not (url.database or "").startswith("tallyhold_test")
        or url.database == "tallyhold"
    ):
        pytest.fail(f"{TEST_URL_ENV} must name a local PostgreSQL test target")
    return url


@contextmanager
def disposable_database() -> Iterator[str]:
    """Create only a uniquely named disposable DB; drop it even after failure."""
    target = _test_url()
    admin = create_engine(target.set(database="postgres"), isolation_level="AUTOCOMMIT")
    name = f"tallyhold_test_{uuid4().hex}"
    try:
        with admin.connect() as connection:
            version = connection.execute(text("SHOW server_version_num")).scalar_one()
            assert int(version) // 10000 == 17, (
                "integration tests require PostgreSQL 17"
            )
            # The name is generated locally, not supplied by an environment variable.
            connection.exec_driver_sql(f'CREATE DATABASE "{name}"')
        try:
            yield target.set(database=name).render_as_string(hide_password=False)
        finally:
            with admin.connect() as connection:
                connection.execute(
                    text(
                        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                        "WHERE datname = :name AND pid <> pg_backend_pid()"
                    ),
                    {"name": name},
                )
                connection.exec_driver_sql(f'DROP DATABASE IF EXISTS "{name}"')
    finally:
        admin.dispose()


@pytest.fixture(scope="session")
def test_database_url() -> Iterator[str]:
    with disposable_database() as url:
        yield url


def migrate(
    url: str, revision: str, direction: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Keep failed direction and revision visible in pytest output."""
    config = Config(str(BACKEND / "alembic.ini"))
    monkeypatch.setenv("DATABASE_URL", url)
    try:
        if direction == "upgrade":
            command.upgrade(config, revision)
        else:
            command.downgrade(config, revision)
    except Exception as error:
        pytest.fail(f"Alembic {direction} to {revision} failed: {error}")


@pytest.fixture(scope="session")
def database_engine(
    test_database_url: str, pytestconfig: pytest.Config
) -> Iterator[Engine]:
    # pytest's own MonkeyPatch lifetime must encompass the session migration.
    with pytest.MonkeyPatch.context() as patch:
        migrate(test_database_url, "head", "upgrade", patch)
    engine = create_engine(test_database_url)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def connection(database_engine: Engine) -> Iterator[Connection]:
    with database_engine.connect() as conn:
        transaction = conn.begin()
        try:
            yield conn
        finally:
            transaction.rollback()


@pytest.fixture
def session(connection: Connection) -> Iterator[Session]:
    with Session(bind=connection, join_transaction_mode="create_savepoint") as db:
        yield db


def adapter(module: str, port: type, session: Session) -> object:
    """Instantiate the module's one concrete implementation of its domain port."""
    try:
        candidates = [
            cls
            for _, cls in getmembers(import_module(module), isclass)
            if cls.__module__ == module and issubclass(cls, port) and cls is not port
        ]
    except ModuleNotFoundError as error:
        pytest.fail(f"missing Feature 003 adapter {module}: {error}")
    assert len(candidates) == 1, f"expected one {port.__name__} adapter in {module}"
    return candidates[0](session)


class RepositorySet(dict[str, object]):
    """Load an adapter when a test calls it, so missing code fails the test."""

    def __init__(self, session: Session) -> None:
        super().__init__()
        self.session = session

    def __missing__(self, name: str) -> object:
        from app.modules.accounts.domain.repositories import (
            AccountRepository,
            BrokerRepository,
        )
        from app.modules.identity.domain.repositories import UserRepository
        from app.modules.instruments.domain.repositories import InstrumentRepository
        from app.modules.transactions.domain.repositories import TransactionRepository

        module, port = {
            "users": ("identity", UserRepository),
            "brokers": ("accounts", BrokerRepository),
            "accounts": ("accounts", AccountRepository),
            "instruments": ("instruments", InstrumentRepository),
            "transactions": ("transactions", TransactionRepository),
        }[name]
        value = adapter(
            f"app.modules.{module}.infrastructure.repositories", port, self.session
        )
        self[name] = value
        return value


@pytest.fixture
def repos(session: Session) -> dict[str, object]:
    return RepositorySet(session)


@contextmanager
def rejected_sql(connection: Connection) -> Iterator[None]:
    """Allow repeated constraint checks without aborting the surrounding test."""
    with pytest.raises(Exception) as caught:
        with connection.begin_nested():
            yield
    from sqlalchemy.exc import IntegrityError

    assert isinstance(caught.value, IntegrityError), caught.value
