"""Verify Supabase ES256 access JWTs against a pinned project JWKS."""

import base64
import binascii
import json
import math
import time
from collections.abc import Callable
from threading import Lock
from typing import Any
from urllib.parse import urlsplit

import httpx
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec, utils

from app.modules.identity.domain.models import VerifiedPrincipal


def _decode(segment: str) -> bytes:
    try:
        return base64.b64decode(
            segment + "=" * (-len(segment) % 4), altchars=b"-_", validate=True
        )
    except (ValueError, binascii.Error) as error:
        raise ValueError("Invalid access token") from error


class SupabaseJwtVerifier:
    """Keep validated keys per instance and bound unknown-key fetches per process."""

    _unknown_lock = Lock()
    _last_unknown_attempt = float("-inf")

    def __init__(
        self,
        *,
        issuer: str,
        audience: str,
        jwks_url: str,
        http_client: httpx.Client,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        origin = urlsplit(issuer)
        if (
            origin.scheme != "https"
            or not origin.hostname
            or origin.username
            or origin.password
            or origin.query
            or origin.fragment
            or origin.path != "/auth/v1"
            or jwks_url != f"{issuer}/.well-known/jwks.json"
            or not audience
        ):
            raise ValueError("Invalid trusted JWT configuration")
        self.issuer = issuer
        self.audience = audience
        self.jwks_url = jwks_url
        self.http_client = http_client
        self.clock = clock
        self._keys: dict[str, ec.EllipticCurvePublicKey] = {}
        self._fetched_at = float("-inf")

    @classmethod
    def _claim_unknown_refresh(cls, now: float) -> None:
        with cls._unknown_lock:
            if now - cls._last_unknown_attempt < 60:
                raise ValueError("Unknown signing key")
            cls._last_unknown_attempt = now

    @classmethod
    def _release_successful_initial_load(cls, now: float) -> None:
        with cls._unknown_lock:
            if cls._last_unknown_attempt == now:
                cls._last_unknown_attempt = float("-inf")

    def _refresh(self, now: float) -> None:
        try:
            response = self.http_client.get(self.jwks_url, timeout=3.0)
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, json.JSONDecodeError) as error:
            raise ConnectionError("Signing keys are unavailable") from error
        if not isinstance(data, dict) or not isinstance(data.get("keys"), list):
            raise ValueError("Invalid trusted JWKS")
        keys: dict[str, ec.EllipticCurvePublicKey] = {}
        for entry in data["keys"]:
            if not isinstance(entry, dict):
                continue
            if (
                entry.get("kty") != "EC"
                or entry.get("crv") != "P-256"
                or entry.get("alg") not in (None, "ES256")
                or entry.get("use") not in (None, "sig")
                or not isinstance(entry.get("kid"), str)
            ):
                continue
            try:
                x = _decode(entry["x"])
                y = _decode(entry["y"])
                if len(x) != 32 or len(y) != 32:
                    continue
                numbers = ec.EllipticCurvePublicNumbers(
                    int.from_bytes(x, "big"), int.from_bytes(y, "big"), ec.SECP256R1()
                )
                keys[entry["kid"]] = numbers.public_key()
            except (KeyError, TypeError, ValueError):
                continue
        self._keys = keys
        self._fetched_at = now

    def verify(self, token: str) -> VerifiedPrincipal:
        try:
            header_raw, claims_raw, signature_raw = token.split(".")
            segments = (header_raw, claims_raw, signature_raw)
            if any(len(item) > 16384 for item in segments):
                raise ValueError("Invalid access token")
            header: Any = json.loads(_decode(header_raw))
            claims: Any = json.loads(_decode(claims_raw))
            if (
                not isinstance(header, dict)
                or header.get("alg") != "ES256"
                or not isinstance(header.get("kid"), str)
                or not header["kid"]
                or not isinstance(claims, dict)
            ):
                raise ValueError("Invalid access token")
            signature = _decode(signature_raw)
            if len(signature) != 64:
                raise ValueError("Invalid access token")
        except (TypeError, UnicodeDecodeError, json.JSONDecodeError) as error:
            raise ValueError("Invalid access token") from error

        now = self.clock()
        kid: str = header["kid"]
        if now - self._fetched_at >= 600:
            initial_load = self._fetched_at == float("-inf")
            if kid not in self._keys:
                self._claim_unknown_refresh(now)
            self._refresh(now)
            if initial_load and kid in self._keys:
                self._release_successful_initial_load(now)
        elif kid not in self._keys:
            self._claim_unknown_refresh(now)
            self._refresh(now)
        key = self._keys.get(kid)
        if key is None:
            raise ValueError("Unknown signing key")
        r = int.from_bytes(signature[:32], "big")
        s = int.from_bytes(signature[32:], "big")
        try:
            key.verify(
                utils.encode_dss_signature(r, s),
                f"{header_raw}.{claims_raw}".encode("ascii"),
                ec.ECDSA(hashes.SHA256()),
            )
        except (InvalidSignature, ValueError, UnicodeEncodeError) as error:
            raise ValueError("Invalid access token") from error

        expiry = claims.get("exp")
        subject = claims.get("sub")
        if (
            claims.get("iss") != self.issuer
            or claims.get("aud") != self.audience
            or claims.get("role") != "authenticated"
            or not isinstance(expiry, (int, float))
            or isinstance(expiry, bool)
            or not math.isfinite(expiry)
            or expiry <= time.time()
            or not isinstance(subject, str)
            or not subject.strip()
        ):
            raise ValueError("Invalid access token")
        metadata = claims.get("app_metadata")
        provider = metadata.get("provider") if isinstance(metadata, dict) else None
        return VerifiedPrincipal(
            issuer=self.issuer,
            subject=subject,
            provider=provider if isinstance(provider, str) else None,
        )
