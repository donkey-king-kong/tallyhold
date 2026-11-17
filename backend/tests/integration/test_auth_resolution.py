"""Feature 005 AC3/AC5: identity resolution and erasure-lock interleavings."""

from collections.abc import Iterator
from concurrent.futures import Future, ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from importlib import import_module
from threading import Event
from time import monotonic, sleep
from uuid import UUID, uuid4

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from .conftest import adapter, disposable_database, migrate

ISSUER = "https://auth.invalid.test/auth/v1"
LOCK = text(
    "SELECT pg_advisory_xact_lock("
    "hashtextextended(jsonb_build_array(CAST(:issuer AS text), "
    "CAST(:subject AS text))::text, 0))"
)
MARKER = text(
    "INSERT INTO erasure_deny_markers(issuer, subject, expires_at) "
    "VALUES (:issuer, :subject, :expires) "
    "ON CONFLICT (issuer, subject) DO UPDATE SET expires_at = EXCLUDED.expires_at"
)


@pytest.fixture
def auth_engine(monkeypatch: pytest.MonkeyPatch) -> Iterator[Engine]:
    with disposable_database() as url:
        migrate(url, "head", "upgrade", monkeypatch)
        engine = create_engine(url)
        try:
            yield engine
        finally:
            engine.dispose()


def resolve(
    session: Session, subject: str, provider: str = "google", issuer: str = ISSUER
) -> object:
    """Use the planned public application service with real domain adapters."""
    try:
        models = import_module("app.modules.identity.domain.models")
        ports = import_module("app.modules.identity.domain.repositories")
        service = import_module("app.modules.identity.application.resolve_current_user")
    except ModuleNotFoundError as error:
        pytest.fail(f"AC3: identity resolution is not implemented yet: {error}")
    repositories = "app.modules.identity.infrastructure.repositories"
    return service.ResolveCurrentUser(
        users=adapter(repositories, ports.UserRepository, session),
        identities=adapter(repositories, ports.IdentityRepository, session),
        deny_markers=adapter(repositories, ports.DenyMarkerRepository, session),
    ).resolve(
        models.VerifiedPrincipal(issuer=issuer, subject=subject, provider=provider)
    )


def counts(engine: Engine) -> tuple[int, int]:
    with engine.connect() as connection:
        return (
            connection.execute(text("SELECT count(*) FROM users")).scalar_one(),
            connection.execute(text("SELECT count(*) FROM identities")).scalar_one(),
        )


def test_first_and_returning_login_keep_one_user_and_existing_settings(
    auth_engine: Engine,
) -> None:
    subject = str(uuid4())
    with Session(auth_engine, expire_on_commit=False) as session:
        first = resolve(session, subject)
        assert isinstance(first.id, UUID)
        assert first.base_currency == "SGD"
        session.commit()
    with auth_engine.begin() as connection:
        connection.execute(
            text("UPDATE users SET base_currency = 'USD' WHERE id = :id"),
            {"id": first.id},
        )
    with Session(auth_engine) as session:
        returning = resolve(session, subject, provider="changed-provider")
        assert returning.id == first.id
        assert returning.base_currency == "USD"
        session.commit()
    assert counts(auth_engine) == (1, 1)


def test_different_auth_subjects_with_same_provider_stay_distinct(
    auth_engine: Engine,
) -> None:
    with Session(auth_engine) as session:
        first = resolve(session, str(uuid4()), provider="google")
        second = resolve(session, str(uuid4()), provider="google")
        assert first.id != second.id
        session.commit()
    assert counts(auth_engine) == (2, 2)


def test_same_subject_from_another_issuer_never_reuses_a_user(
    auth_engine: Engine,
) -> None:
    subject = str(uuid4())
    with Session(auth_engine) as session:
        first = resolve(session, subject)
        other = resolve(
            session, subject, issuer="https://different.invalid.test/auth/v1"
        )
        assert first.id != other.id
        session.commit()
    assert counts(auth_engine) == (2, 2)


def test_expired_marker_still_denies_until_operator_purges_it(
    auth_engine: Engine,
) -> None:
    subject = str(uuid4())
    pair = {"issuer": ISSUER, "subject": subject}
    with auth_engine.begin() as operator:
        operator.execute(
            MARKER, {**pair, "expires": datetime.now(UTC) - timedelta(seconds=1)}
        )
    with Session(auth_engine) as session, pytest.raises(Exception):
        resolve(session, subject)
    assert counts(auth_engine) == (0, 0)
    with auth_engine.begin() as operator:
        operator.execute(
            text(
                "DELETE FROM erasure_deny_markers "
                "WHERE issuer = :issuer AND subject = :subject"
            ),
            pair,
        )
    with Session(auth_engine) as session:
        assert resolve(session, subject).base_currency == "SGD"
        session.commit()
    assert counts(auth_engine) == (1, 1)


def test_marker_denies_even_an_existing_identity_before_lookup(
    auth_engine: Engine,
) -> None:
    subject = str(uuid4())
    pair = {"issuer": ISSUER, "subject": subject}
    with Session(auth_engine) as session:
        resolve(session, subject)
        session.commit()
    with auth_engine.begin() as operator:
        operator.execute(
            MARKER, {**pair, "expires": datetime.now(UTC) + timedelta(seconds=3600)}
        )
    with Session(auth_engine) as session, pytest.raises(Exception):
        resolve(session, subject)
    assert counts(auth_engine) == (1, 1)


def test_simultaneous_first_logins_create_no_duplicate_or_orphan_user(
    auth_engine: Engine,
) -> None:
    subject = str(uuid4())
    ready = Event()

    def login() -> UUID:
        with Session(auth_engine) as session:
            ready.wait(timeout=5)
            user = resolve(session, subject)
            session.commit()
            return user.id

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(login) for _ in range(8)]
        ready.set()
        assert len({future.result(timeout=10) for future in futures}) == 1
    assert counts(auth_engine) == (1, 1)


def wait_for_advisory_wait(
    engine: Engine, application_name: str, worker: Future[object]
) -> None:
    """Observe the blocked transaction, so the operator commit cannot race setup."""
    deadline = monotonic() + 5
    while monotonic() < deadline:
        if worker.done():
            worker.result()
            pytest.fail(f"AC5: {application_name} finished without waiting for lock")
        with engine.connect() as connection:
            blocked = connection.execute(
                text(
                    "SELECT count(*) FROM pg_stat_activity "
                    "WHERE application_name = :name "
                    "AND wait_event_type = 'Lock' AND wait_event = 'advisory'"
                ),
                {"name": application_name},
            ).scalar_one()
        if blocked:
            return
        sleep(0.02)
    pytest.fail(f"AC5: {application_name} did not reach the advisory lock")


def test_operator_marker_commits_while_first_login_waits_and_denies_creation(
    auth_engine: Engine,
) -> None:
    subject = str(uuid4())
    pair = {"issuer": ISSUER, "subject": subject}
    started = Event()

    def login() -> None:
        with Session(auth_engine) as session:
            session.execute(text("SET application_name = 'auth-red-login'"))
            started.set()
            resolve(session, subject)
            session.commit()

    with auth_engine.connect() as operator:
        transaction = operator.begin()
        try:
            operator.execute(LOCK, pair)
            with ThreadPoolExecutor(max_workers=1) as pool:
                attempt = pool.submit(login)
                assert started.wait(timeout=5)
                wait_for_advisory_wait(auth_engine, "auth-red-login", attempt)
                operator.execute(
                    MARKER,
                    {
                        **pair,
                        "expires": datetime.now(UTC) + timedelta(seconds=3600),
                    },
                )
                transaction.commit()
                with pytest.raises(Exception):
                    attempt.result(timeout=10)
        finally:
            if transaction.is_active:
                transaction.rollback()
    assert counts(auth_engine) == (0, 0)
    with Session(auth_engine) as session, pytest.raises(Exception):
        resolve(session, subject)
    assert counts(auth_engine) == (0, 0)


def test_first_login_commits_before_operator_marker_then_erasure_stays_denied(
    auth_engine: Engine,
) -> None:
    subject = str(uuid4())
    pair = {"issuer": ISSUER, "subject": subject}
    created = Event()
    release = Event()

    def login() -> UUID:
        with Session(auth_engine) as session:
            user = resolve(session, subject)
            created.set()
            assert release.wait(timeout=10)
            session.commit()
            return user.id

    with ThreadPoolExecutor(max_workers=2) as pool:
        first = pool.submit(login)
        if not created.wait(timeout=5):
            first.result(timeout=1)
            pytest.fail("AC5: first login did not reach provisioning")

        def erase() -> None:
            with auth_engine.begin() as operator:
                operator.execute(text("SET application_name = 'auth-red-operator'"))
                operator.execute(LOCK, pair)
                operator.execute(
                    MARKER,
                    {
                        **pair,
                        "expires": datetime.now(UTC) + timedelta(seconds=3600),
                    },
                )
            with auth_engine.begin() as operator:
                operator.execute(
                    text(
                        "DELETE FROM identities WHERE issuer = :issuer "
                        "AND subject = :subject"
                    ),
                    pair,
                )
                operator.execute(
                    text("DELETE FROM users WHERE id = :id"), {"id": first.result()}
                )

        operator = pool.submit(erase)
        try:
            wait_for_advisory_wait(auth_engine, "auth-red-operator", operator)
        finally:
            release.set()
        first.result(timeout=10)
        operator.result(timeout=10)
    with Session(auth_engine) as session, pytest.raises(Exception):
        resolve(session, subject)
    assert counts(auth_engine) == (0, 0)
