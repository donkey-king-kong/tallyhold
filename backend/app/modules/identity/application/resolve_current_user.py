"""Resolve verified external identity to one internal Tallyhold user."""

from uuid import uuid4

from app.modules.identity.domain.models import User, VerifiedPrincipal
from app.modules.identity.domain.repositories import (
    DenyMarkerRepository,
    IdentityConflict,
    IdentityRepository,
    UserRepository,
)


class ResolveCurrentUser:
    def __init__(
        self,
        *,
        users: UserRepository,
        identities: IdentityRepository,
        deny_markers: DenyMarkerRepository,
    ) -> None:
        self.users = users
        self.identities = identities
        self.deny_markers = deny_markers

    def _existing(self, principal: VerifiedPrincipal) -> User | None:
        user_id = self.identities.get(principal)
        if user_id is None:
            return None
        user = self.users.get(user_id)
        if user is None:
            raise ValueError("Identity refers to a missing user")
        return user

    def resolve(self, principal: VerifiedPrincipal) -> User:
        if self.deny_markers.contains(principal):
            raise PermissionError("Identity is no longer available")
        existing = self._existing(principal)
        if existing is not None:
            return existing

        self.identities.serialize_provisioning(principal)
        if self.deny_markers.contains(principal):
            raise PermissionError("Identity is no longer available")
        existing = self._existing(principal)
        if existing is not None:
            return existing

        candidate = User(id=uuid4(), base_currency="SGD")
        try:
            with self.identities.savepoint():
                self.users.save(candidate)
                self.identities.link(principal, candidate.id)
        except IdentityConflict:
            winner = self._existing(principal)
            if winner is None:
                raise ValueError("Identity provisioning failed") from None
            return winner
        return candidate
