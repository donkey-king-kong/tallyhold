"""AC2/AC4: composed bearer, verifier and transaction boundary on PostgreSQL."""

from collections.abc import Iterator
from importlib import import_module
from typing import Any
from uuid import uuid4

import httpx
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from test_auth_jwt import SUBJECT, minted, public_jwks, verifier

from .conftest import disposable_database, migrate
from .test_auth_resolution import counts


@pytest.fixture
def auth_engine(monkeypatch: pytest.MonkeyPatch) -> Iterator[Engine]:
    with disposable_database() as url:
        migrate(url, "head", "upgrade", monkeypatch)
        engine = create_engine(url)
        try:
            yield engine
        finally:
            engine.dispose()


@pytest.fixture
def signing_key() -> ec.EllipticCurvePrivateKey:
    return ec.generate_private_key(ec.SECP256R1())


@pytest.fixture
def composed_client(
    auth_engine: Engine, signing_key: ec.EllipticCurvePrivateKey
) -> Iterator[tuple[TestClient, list[httpx.Request]] | None]:
    try:
        dependencies = import_module("app.dependencies")
        jwt_port = dependencies.get_jwt_verifier
        session_port = dependencies.get_db_session
    except (ModuleNotFoundError, AttributeError):
        yield None
        return

    requests: list[httpx.Request] = []

    def jwks(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json=public_jwks(signing_key))

    app = import_module("app.main").app

    def session_override() -> Iterator[Session]:
        with Session(auth_engine) as session:
            try:
                yield session
                session.commit()
            except Exception:
                session.rollback()
                raise

    app.dependency_overrides[jwt_port] = lambda: verifier(
        httpx.MockTransport(jwks), [0]
    )
    app.dependency_overrides[session_port] = session_override
    try:
        with TestClient(app) as client:
            yield client, requests
    finally:
        app.dependency_overrides.clear()


def test_verified_bearer_resolves_user_without_client_selected_identity(
    composed_client: tuple[TestClient, list[httpx.Request]] | None,
    auth_engine: Engine,
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    assert composed_client is not None, "AC2/AC4: auth composition is absent"
    client, requests = composed_client
    token = minted(signing_key)
    response = client.get(
        "/api/v1/me",
        headers={"Authorization": f"Bearer {token}"},
        params={"user_id": str(uuid4()), "email": "other@invalid.test"},
    )
    assert response.status_code == 200
    assert response.json()["base_currency"] == "SGD"
    assert response.json()["id"] != SUBJECT
    assert counts(auth_engine) == (1, 1)
    assert (
        client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"}).json()
        == response.json()
    )
    other_token = minted(signing_key, claims={"sub": str(uuid4())})
    other = client.get(
        "/api/v1/me",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert other.status_code == 200
    assert other.json()["id"] != response.json()["id"]
    assert counts(auth_engine) == (2, 2)
    assert requests


@pytest.mark.parametrize(
    ("claims", "headers", "forged"),
    [
        ({"exp": 1}, {}, False),
        ({"iss": "https://other.invalid.test/auth/v1"}, {}, False),
        ({"role": "anon"}, {}, False),
        ({"sub": ""}, {}, False),
        ({}, {"alg": "HS256"}, False),
        ({}, {}, True),
    ],
)
def test_invalid_verified_claim_or_signature_returns_401_without_provisioning(
    composed_client: tuple[TestClient, list[httpx.Request]] | None,
    auth_engine: Engine,
    signing_key: ec.EllipticCurvePrivateKey,
    claims: dict[str, Any],
    headers: dict[str, Any],
    forged: bool,
) -> None:
    assert composed_client is not None, "AC2/AC4: auth composition is absent"
    client, _ = composed_client
    token = minted(
        ec.generate_private_key(ec.SECP256R1()) if forged else signing_key,
        claims=claims,
        headers=headers,
    )
    response = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "id" not in response.text
    assert token not in response.text
    assert counts(auth_engine) == (0, 0)


def test_jwks_outage_returns_503_without_provisioning(
    auth_engine: Engine, signing_key: ec.EllipticCurvePrivateKey
) -> None:
    dependencies = import_module("app.dependencies")
    app = import_module("app.main").app
    requested: list[httpx.Request] = []

    def outage(request: httpx.Request) -> httpx.Response:
        requested.append(request)
        raise httpx.ReadTimeout("fixture secret", request=request)

    def session_override() -> Iterator[Session]:
        with Session(auth_engine) as session:
            yield session
            session.commit()

    app.dependency_overrides[dependencies.get_jwt_verifier] = lambda: verifier(
        httpx.MockTransport(outage), [0]
    )
    app.dependency_overrides[dependencies.get_db_session] = session_override
    try:
        token = minted(signing_key)
        with TestClient(app) as client:
            response = client.get(
                "/api/v1/me", headers={"Authorization": f"Bearer {token}"}
            )
        assert response.status_code == 503
        assert "fixture secret" not in response.text
        assert token not in response.text
        assert counts(auth_engine) == (0, 0)
        assert len(requested) == 1
    finally:
        app.dependency_overrides.clear()


def test_multiple_authorization_headers_are_not_accepted(
    composed_client: tuple[TestClient, list[httpx.Request]] | None,
    auth_engine: Engine,
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    assert composed_client is not None, "AC2/AC4: auth composition is absent"
    client, _ = composed_client
    token = minted(signing_key)
    response = client.get(
        "/api/v1/me",
        headers=[
            ("Authorization", f"Bearer {token}"),
            ("Authorization", f"Bearer {token}"),
        ],
    )
    assert response.status_code == 401
    assert counts(auth_engine) == (0, 0)
