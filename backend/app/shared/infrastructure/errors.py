"""Infrastructure-only persistence failures and integrity translation."""

from sqlalchemy import literal
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.sql.dml import Delete, Insert, Update


class PersistenceConstraintError(ValueError):
    """A database constraint rejected a write without exposing driver details."""

    def __init__(self, constraint_name: str) -> None:
        self.constraint_name = constraint_name
        super().__init__("persistence constraint violated")


def execute_write(session: Session, statement: Delete | Insert | Update) -> int:
    """Flush a write; the caller remains responsible for rollback or commit."""
    try:
        result = session.execute(statement.returning(literal(1)))
        affected = result.scalar_one_or_none() is not None
        session.flush()
    except IntegrityError as error:
        name = getattr(getattr(error.orig, "diag", None), "constraint_name", None)
        raise PersistenceConstraintError(name or "unknown") from None
    return int(affected)
