"""Feature 005 AC2: offline ES256 verification at the verifier interface."""

import asyncio
import base64
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from importlib import import_module
from typing import Any
from uuid import uuid4

import httpx
import pytest
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec, utils

ISSUER = "https://auth.invalid.test/auth/v1"
JWKS_URL = f"{ISSUER}/.well-known/jwks.json"
SUBJECT = str(uuid4())
PROCESS_CLOCK_BASE = [0.0]


@pytest.fixture(autouse=True)
def advance_process_clock_between_tests() -> None:
    # Preserve the process-wide limiter while giving each test a later clock window.
    PROCESS_CLOCK_BASE[0] += 2_000_000.0


def encoded(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


@pytest.fixture
def signing_key() -> ec.EllipticCurvePrivateKey:
    return ec.generate_private_key(ec.SECP256R1())


def public_jwks(
    key: ec.EllipticCurvePrivateKey, kid: str = "local-test-key"
) -> dict[str, Any]:
    numbers = key.public_key().public_numbers()
    return {
        "keys": [
            {
                "kty": "EC",
                "crv": "P-256",
                "alg": "ES256",
                "use": "sig",
                "kid": kid,
                "x": encoded(numbers.x.to_bytes(32, "big")),
                "y": encoded(numbers.y.to_bytes(32, "big")),
            }
        ]
    }


def minted(
    key: ec.EllipticCurvePrivateKey,
    *,
    claims: dict[str, Any] | None = None,
    headers: dict[str, Any] | None = None,
) -> str:
    payload = {
        "iss": ISSUER,
        "aud": "authenticated",
        "sub": SUBJECT,
        "role": "authenticated",
        "exp": int(datetime.now(UTC).timestamp()) + 3600,
    }
    payload.update(claims or {})
    header = {"alg": "ES256", "typ": "JWT", "kid": "local-test-key"}
    header.update(headers or {})
    message = ".".join(
        encoded(json.dumps(item, separators=(",", ":")).encode())
        for item in (header, payload)
    )
    signature = key.sign(message.encode("ascii"), ec.ECDSA(hashes.SHA256()))
    r, s = utils.decode_dss_signature(signature)
    return f"{message}.{encoded(r.to_bytes(32, 'big') + s.to_bytes(32, 'big'))}"


def verifier(transport: httpx.MockTransport, clock: list[float]) -> Any:
    try:
        module = import_module("app.modules.identity.infrastructure.jwt_verifier")
    except ModuleNotFoundError:
        pytest.fail("AC2: SupabaseJwtVerifier is not implemented yet")
    # The public verifier accepts a trusted configuration, an external-HTTP
    # client and a monotonic clock; no Supabase request is made by these tests.
    return module.SupabaseJwtVerifier(
        issuer=ISSUER,
        audience="authenticated",
        jwks_url=JWKS_URL,
        http_client=httpx.Client(transport=transport, timeout=30),
        clock=lambda: PROCESS_CLOCK_BASE[0] + clock[0],
    )


def test_valid_es256_token_resolves_only_verified_identity(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    requests: list[httpx.Request] = []

    def jwks(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        assert str(request.url) == JWKS_URL
        return httpx.Response(200, json=public_jwks(signing_key))

    principal = verifier(httpx.MockTransport(jwks), [0.0]).verify(minted(signing_key))

    assert (principal.issuer, principal.subject) == (ISSUER, SUBJECT)
    assert len(requests) == 1


@pytest.mark.parametrize(
    ("claims", "headers"),
    [
        ({"exp": 1}, {}),
        ({"iss": "https://other.invalid.test/auth/v1"}, {}),
        ({"aud": "other"}, {}),
        ({"role": "anon"}, {}),
        ({"role": "service_role"}, {}),
        ({"role": "custom"}, {}),
        ({"sub": ""}, {}),
        ({"sub": None}, {}),
        ({}, {"alg": "HS256"}),
        ({}, {"alg": "none"}),
        ({}, {"kid": "unknown-key"}),
    ],
)
def test_invalid_claims_and_attacker_headers_never_resolve_identity(
    signing_key: ec.EllipticCurvePrivateKey,
    claims: dict[str, Any],
    headers: dict[str, Any],
) -> None:
    requested: list[str] = []

    def jwks(request: httpx.Request) -> httpx.Response:
        requested.append(str(request.url))
        return httpx.Response(200, json=public_jwks(signing_key))

    token = minted(signing_key, claims=claims, headers=headers)
    with pytest.raises(ValueError):
        verifier(httpx.MockTransport(jwks), [0.0]).verify(token)
    assert all(url == JWKS_URL for url in requested)


def test_missing_subject_never_resolves_identity(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    token = minted(signing_key, claims={"sub": SUBJECT})
    header, payload, _ = token.split(".")
    claims = json.loads(base64.urlsafe_b64decode(payload + "=="))
    claims.pop("sub")
    message = f"{header}.{encoded(json.dumps(claims).encode())}"
    signature = signing_key.sign(message.encode(), ec.ECDSA(hashes.SHA256()))
    r, s = utils.decode_dss_signature(signature)
    token = f"{message}.{encoded(r.to_bytes(32, 'big') + s.to_bytes(32, 'big'))}"
    transport = httpx.MockTransport(
        lambda request: httpx.Response(200, json=public_jwks(signing_key))
    )
    with pytest.raises(ValueError):
        verifier(transport, [0.0]).verify(token)


@pytest.mark.parametrize("header", ["jku", "x5u"])
def test_signed_token_cannot_redirect_the_jwks_request(
    signing_key: ec.EllipticCurvePrivateKey,
    header: str,
) -> None:
    requested: list[str] = []

    def jwks(request: httpx.Request) -> httpx.Response:
        requested.append(str(request.url))
        return httpx.Response(200, json=public_jwks(signing_key))

    token = minted(signing_key, headers={header: "https://attacker.invalid.test/keys"})
    assert verifier(httpx.MockTransport(jwks), [0.0]).verify(token).subject == SUBJECT
    assert requested == [JWKS_URL]


def test_forged_signature_is_rejected(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    other = ec.generate_private_key(ec.SECP256R1())
    transport = httpx.MockTransport(
        lambda request: httpx.Response(200, json=public_jwks(signing_key))
    )
    with pytest.raises(ValueError):
        verifier(transport, [0.0]).verify(minted(other))


def test_cached_keys_expire_at_600_seconds(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    clock = [0.0]
    requests: list[httpx.Request] = []

    def jwks(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json=public_jwks(signing_key))

    subject = verifier(httpx.MockTransport(jwks), clock)
    token = minted(signing_key)
    subject.verify(token)
    clock[0] = 599.0
    subject.verify(token)
    assert len(requests) == 1
    clock[0] = 600.0
    subject.verify(token)
    assert len(requests) == 2


def test_new_es256_key_verifies_after_pinned_jwks_rotation(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    rotated = ec.generate_private_key(ec.SECP256R1())
    requested: list[str] = []

    def jwks(request: httpx.Request) -> httpx.Response:
        requested.append(str(request.url))
        key = signing_key if len(requested) == 1 else rotated
        kid = "local-test-key" if len(requested) == 1 else "rotated-key"
        return httpx.Response(200, json=public_jwks(key, kid))

    subject = verifier(httpx.MockTransport(jwks), [0.0])
    assert subject.verify(minted(signing_key)).subject == SUBJECT
    assert (
        subject.verify(minted(rotated, headers={"kid": "rotated-key"})).subject
        == SUBJECT
    )
    assert requested == [JWKS_URL, JWKS_URL]


def test_expired_key_never_survives_jwks_failure(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    clock = [0.0]
    fetches = 0

    def jwks(request: httpx.Request) -> httpx.Response:
        nonlocal fetches
        fetches += 1
        if fetches == 1:
            return httpx.Response(200, json=public_jwks(signing_key))
        raise httpx.ReadTimeout("offline fixture", request=request)

    subject = verifier(httpx.MockTransport(jwks), clock)
    token = minted(signing_key)
    assert subject.verify(token).subject == SUBJECT
    clock[0] = 599.0
    assert subject.verify(token).subject == SUBJECT
    assert fetches == 1
    clock[0] = 600.0
    with pytest.raises(ConnectionError):
        subject.verify(token)
    assert fetches == 2


def test_failed_unknown_key_refresh_keeps_unexpired_known_key(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    fetches = 0

    def jwks(request: httpx.Request) -> httpx.Response:
        nonlocal fetches
        fetches += 1
        if fetches == 1:
            return httpx.Response(200, json=public_jwks(signing_key))
        raise httpx.ReadTimeout("offline fixture", request=request)

    subject = verifier(httpx.MockTransport(jwks), [0.0])
    known = minted(signing_key)
    subject.verify(known)
    with pytest.raises(ConnectionError):
        subject.verify(minted(signing_key, headers={"kid": "unavailable-key"}))
    with pytest.raises(ValueError):
        subject.verify(minted(signing_key, headers={"kid": "another-unavailable-key"}))
    assert fetches == 2
    assert subject.verify(known).subject == SUBJECT
    assert fetches == 2


def test_expired_cache_random_kids_still_use_shared_refresh_gate(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    clock = [0.0]
    requested: list[str] = []

    def jwks(request: httpx.Request) -> httpx.Response:
        requested.append(str(request.url))
        return httpx.Response(200, json=public_jwks(signing_key))

    subject = verifier(httpx.MockTransport(jwks), clock)
    subject.verify(minted(signing_key))
    clock[0] = 600.0
    for kid in ("random-one", "random-two", "random-three"):
        with pytest.raises(ValueError):
            subject.verify(minted(signing_key, headers={"kid": kid}))
    assert requested == [JWKS_URL, JWKS_URL]


@pytest.mark.parametrize(
    ("issuer", "jwks_url"),
    [
        (ISSUER, "http://auth.invalid.test/auth/v1/.well-known/jwks.json"),
        (ISSUER, "https://attacker.invalid.test/keys"),
        ("http://auth.invalid.test/auth/v1", JWKS_URL),
    ],
)
def test_untrusted_jwks_configuration_fails_before_fetch(
    issuer: str, jwks_url: str
) -> None:
    requested: list[str] = []
    module = import_module("app.modules.identity.infrastructure.jwt_verifier")

    def no_fetch(request: httpx.Request) -> httpx.Response:
        requested.append(str(request.url))
        return httpx.Response(200, json={"keys": []})

    with pytest.raises(ValueError):
        module.SupabaseJwtVerifier(
            issuer=issuer,
            audience="authenticated",
            jwks_url=jwks_url,
            http_client=httpx.Client(transport=httpx.MockTransport(no_fetch)),
            clock=lambda: 0.0,
        )
    assert requested == []


def test_random_kid_flood_refreshes_at_most_once_per_process_per_window(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    clock = [1_000_000.0]
    requests: list[httpx.Request] = []

    def jwks(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json=public_jwks(signing_key))

    transport = httpx.MockTransport(jwks)
    first = verifier(transport, clock)
    second = verifier(transport, clock)

    def rejected(index: int) -> None:
        token = minted(signing_key, headers={"kid": f"random-{index}"})
        with pytest.raises(ValueError):
            (first if index % 2 else second).verify(token)

    with ThreadPoolExecutor(max_workers=12) as pool:
        list(pool.map(rejected, range(40)))
    assert len(requests) == 1
    clock[0] = 1_000_059.0
    rejected(40)
    assert len(requests) == 1
    clock[0] = 1_000_060.0
    rejected(41)
    assert len(requests) == 2

    async def async_flood() -> None:
        await asyncio.gather(
            *(asyncio.to_thread(rejected, index) for index in range(42, 62))
        )

    clock[0] = 1_000_120.0
    asyncio.run(async_flood())
    assert len(requests) == 3
    assert first.verify(minted(signing_key)).subject == SUBJECT
    assert len(requests) == 3


def test_untrusted_jwks_key_types_are_never_accepted(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    keys = public_jwks(signing_key)
    for changed in ({"kty": "oct", "k": "c2VjcmV0"}, {"crv": "P-384"}):
        jwk = {**keys["keys"][0], **changed}
        transport = httpx.MockTransport(
            lambda request: httpx.Response(200, json={"keys": [jwk]})
        )
        with pytest.raises(ValueError):
            verifier(transport, [0.0]).verify(minted(signing_key))


def test_jwks_fetch_uses_three_second_timeout_and_fails_closed(
    signing_key: ec.EllipticCurvePrivateKey,
) -> None:
    observed: list[httpx.Request] = []

    def timeout(request: httpx.Request) -> httpx.Response:
        observed.append(request)
        raise httpx.ReadTimeout("offline fixture", request=request)

    with pytest.raises(ConnectionError):
        verifier(httpx.MockTransport(timeout), [0.0]).verify(minted(signing_key))
    assert len(observed) == 1
    assert observed[0].extensions["timeout"]["read"] == 3.0
