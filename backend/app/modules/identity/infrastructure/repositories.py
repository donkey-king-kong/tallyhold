"""SQLAlchemy implementations of identity persistence ports."""

from collections.abc import Iterator
from contextlib import contextmanager
from uuid import UUID, uuid4

from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.identity.domain.models import User, VerifiedPrincipal
from app.modules.identity.domain.repositories import (
    DenyMarkerRepository,
    IdentityConflict,
    IdentityRepository,
    UserRepository,
)
from app.modules.identity.infrastructure.models import (
    ErasureDenyMarkerRow,
    IdentityRow,
    UserRow,
)
from app.shared.infrastructure.errors import PersistenceConstraintError, execute_write


class SqlAlchemyUserRepository(UserRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, user_id: UUID) -> User | None:
        row = self.session.get(UserRow, user_id)
        return User(row.id, row.base_currency) if row is not None else None

    def save(self, user: User) -> None:
        statement = insert(UserRow).values(id=user.id, base_currency=user.base_currency)
        execute_write(
            self.session,
            statement.on_conflict_do_update(
                index_elements=[UserRow.id],
                set_={"base_currency": statement.excluded.base_currency},
            ),
        )


class SqlAlchemyIdentityRepository(IdentityRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, principal: VerifiedPrincipal) -> UUID | None:
        return self.session.scalar(
            select(IdentityRow.user_id).where(
                IdentityRow.issuer == principal.issuer,
                IdentityRow.subject == principal.subject,
            )
        )

    def serialize_provisioning(self, principal: VerifiedPrincipal) -> None:
        self.session.execute(
            text(
                "SELECT pg_advisory_xact_lock("
                "hashtextextended(jsonb_build_array(CAST(:issuer AS text), "
                "CAST(:subject AS text))::text, 0))"
            ),
            {"issuer": principal.issuer, "subject": principal.subject},
        )

    @contextmanager
    def savepoint(self) -> Iterator[None]:
        with self.session.begin_nested():
            yield

    def link(self, principal: VerifiedPrincipal, user_id: UUID) -> None:
        try:
            execute_write(
                self.session,
                insert(IdentityRow).values(
                    id=uuid4(),
                    user_id=user_id,
                    issuer=principal.issuer,
                    subject=principal.subject,
                    provider=principal.provider,
                ),
            )
        except PersistenceConstraintError as error:
            if error.constraint_name == "uq_identities_issuer_subject":
                raise IdentityConflict("Identity already linked") from None
            raise


class SqlAlchemyDenyMarkerRepository(DenyMarkerRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def contains(self, principal: VerifiedPrincipal) -> bool:
        return (
            self.session.scalar(
                select(ErasureDenyMarkerRow.issuer).where(
                    ErasureDenyMarkerRow.issuer == principal.issuer,
                    ErasureDenyMarkerRow.subject == principal.subject,
                )
            )
            is not None
        )
