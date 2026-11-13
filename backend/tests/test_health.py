"""Public scaffold behavior at the HTTP and package boundaries."""

from importlib import import_module

from fastapi.testclient import TestClient


def test_health_is_public_and_contains_no_user_data() -> None:
    app = import_module("app.main").app

    response = TestClient(app).get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_business_modules_have_their_own_four_layers() -> None:
    for module in (
        "identity",
        "accounts",
        "instruments",
        "transactions",
        "importing",
        "market_data",
        "portfolio",
    ):
        for layer in ("domain", "application", "infrastructure", "presentation"):
            assert import_module(f"app.modules.{module}.{layer}") is not None

    assert import_module("app.shared") is not None
