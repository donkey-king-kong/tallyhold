"""SQLAlchemy implementation of the user persistence port."""

from uuid import UUID

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.identity.domain.models import User
from app.modules.identity.domain.repositories import UserRepository
from app.modules.identity.infrastructure.models import UserRow
from app.shared.infrastructure.errors import execute_write


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
