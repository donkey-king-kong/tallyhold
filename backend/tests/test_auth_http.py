"""Feature 005 AC2/AC4: current-user HTTP and bearer-only CORS boundary."""

from collections.abc import Iterator
from importlib import import_module
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.modules.identity.domain.models import User


@pytest.fixture
def client() -> Iterator[TestClient]:
    app = import_module("app.main").app
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def authenticated(client: TestClient, user: User) -> None:
    """Inject only the trusted current-user boundary, not request user data."""
    try:
        dependency = import_module("app.dependencies").get_current_user
    except (ModuleNotFoundError, AttributeError):
        pytest.fail("AC4: the shared current-user dependency is not implemented yet")
    client.app.dependency_overrides[dependency] = lambda: user


def test_me_returns_only_the_authenticated_internal_user(client: TestClient) -> None:
    owner, other = User(uuid4(), "SGD"), User(uuid4(), "USD")
    authenticated(client, owner)
    response = client.get(
        "/api/v1/me",
        headers={"Authorization": "Bearer locally-verified-test-token"},
        params={"user_id": str(other.id)},
    )
    assert response.status_code == 200
    assert response.json() == {"id": str(owner.id), "base_currency": "SGD"}
    authenticated(client, other)
    response = client.get(
        "/api/v1/me", headers={"Authorization": "Bearer second-verified-test-token"}
    )
    assert response.status_code == 200
    assert response.json() == {"id": str(other.id), "base_currency": "USD"}


@pytest.mark.parametrize(
    ("headers", "cookies"),
    [
        ({}, None),
        ({"Authorization": "Basic not-bearer"}, None),
        ({"Authorization": "Bearer invalid"}, None),
        ({}, {"access_token": "locally-minted-token"}),
    ],
)
def test_me_rejects_missing_invalid_or_cookie_only_authentication(
    client: TestClient, headers: dict[str, str], cookies: dict[str, str] | None
) -> None:
    client.cookies.update(cookies or {})
    response = client.get("/api/v1/me", headers=headers)
    assert response.status_code == 401
    assert "id" not in response.text


def test_only_configured_frontend_origin_may_preflight_bearer_request(
    client: TestClient,
) -> None:
    headers = {
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization",
    }
    allowed = client.options(
        "/api/v1/me", headers={**headers, "Origin": "http://localhost:3000"}
    )
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert allowed.headers["access-control-allow-origin"] != "*"
    assert "authorization" in allowed.headers["access-control-allow-headers"].lower()
    assert allowed.headers.get("access-control-allow-credentials") != "true"

    denied = client.options(
        "/api/v1/me", headers={**headers, "Origin": "https://attacker.invalid.test"}
    )
    assert denied.status_code == 400
    assert "access-control-allow-origin" not in denied.headers


def test_health_stays_public_while_me_is_protected(client: TestClient) -> None:
    assert client.get("/api/v1/health").json() == {"status": "ok"}
    assert client.get("/api/v1/me").status_code == 401
