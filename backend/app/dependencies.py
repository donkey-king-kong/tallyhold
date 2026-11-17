"""Application composition for authenticated HTTP requests."""

import os
from collections.abc import Iterator
from functools import lru_cache

import httpx
from fastapi import Depends, HTTPException, Request
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.modules.identity.application.resolve_current_user import ResolveCurrentUser
from app.modules.identity.domain.models import User
from app.modules.identity.infrastructure.jwt_verifier import SupabaseJwtVerifier
from app.modules.identity.infrastructure.repositories import (
    SqlAlchemyDenyMarkerRepository,
    SqlAlchemyIdentityRepository,
    SqlAlchemyUserRepository,
)


@lru_cache
def _database_engine(url: str) -> Engine:
    return create_engine(url, pool_pre_ping=True)


@lru_cache
def _configured_verifier(
    issuer: str, audience: str, jwks_url: str
) -> SupabaseJwtVerifier:
    return SupabaseJwtVerifier(
        issuer=issuer,
        audience=audience,
        jwks_url=jwks_url,
        http_client=httpx.Client(timeout=3.0),
    )


def get_jwt_verifier() -> SupabaseJwtVerifier | None:
    issuer = os.getenv("SUPABASE_JWT_ISSUER")
    audience = os.getenv("SUPABASE_JWT_AUDIENCE")
    jwks_url = os.getenv("SUPABASE_JWKS_URL")
    if not issuer or not audience or not jwks_url:
        return None
    try:
        return _configured_verifier(issuer, audience, jwks_url)
    except ValueError:
        return None


def get_db_session() -> Iterator[Session | None]:
    url = os.getenv("DATABASE_URL")
    if not url:
        yield None
        return
    with Session(_database_engine(url)) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise


def get_current_user(
    request: Request,
    verifier: SupabaseJwtVerifier | None = Depends(get_jwt_verifier),
    session: Session | None = Depends(get_db_session),
) -> User:
    values = request.headers.getlist("authorization")
    if len(values) != 1:
        raise HTTPException(status_code=401, detail="Unauthorized")
    scheme, separator, token = values[0].partition(" ")
    if (
        scheme.lower() != "bearer"
        or not separator
        or not token
        or any(char.isspace() for char in token)
        or token.count(".") != 2
    ):
        raise HTTPException(status_code=401, detail="Unauthorized")
    if verifier is None:
        raise HTTPException(status_code=503, detail="Authentication unavailable")
    try:
        principal = verifier.verify(token)
    except ValueError as error:
        raise HTTPException(status_code=401, detail="Unauthorized") from error
    except ConnectionError as error:
        raise HTTPException(
            status_code=503, detail="Authentication unavailable"
        ) from error
    if session is None:
        raise HTTPException(status_code=503, detail="Authentication unavailable")
    resolver = ResolveCurrentUser(
        users=SqlAlchemyUserRepository(session),
        identities=SqlAlchemyIdentityRepository(session),
        deny_markers=SqlAlchemyDenyMarkerRepository(session),
    )
    try:
        return resolver.resolve(principal)
    except PermissionError as error:
        raise HTTPException(status_code=401, detail="Unauthorized") from error
