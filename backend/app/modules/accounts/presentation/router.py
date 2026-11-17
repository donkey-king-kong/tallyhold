"""Authenticated account and shared broker routes."""

from collections.abc import Callable
from typing import Any, Protocol
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.modules.accounts.application.accounts import AccountsService
from app.modules.accounts.infrastructure.repositories import (
    SqlAlchemyAccountRepository,
    SqlAlchemyBrokerRepository,
)
from app.modules.accounts.presentation.schemas import (
    AccountResponse,
    BrokerResponse,
    CreateAccount,
    UpdateAccount,
)


class CurrentAccountUser(Protocol):
    id: UUID


def account_router(
    current_user: Callable[..., Any], db_session: Callable[..., Any]
) -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    def accounts_service(
        session: Session | None = Depends(db_session),
    ) -> AccountsService:
        if session is None:
            raise HTTPException(status_code=503, detail="Service unavailable")
        return AccountsService(
            SqlAlchemyAccountRepository(session), SqlAlchemyBrokerRepository(session)
        )

    @router.get("/brokers", response_model=list[BrokerResponse])
    def brokers(
        _user: CurrentAccountUser = Depends(current_user),
        service: AccountsService = Depends(accounts_service),
    ) -> list[BrokerResponse]:
        return [
            BrokerResponse(id=b.id, name=b.name, country=b.country)
            for b in service.list_brokers()
        ]

    @router.get("/accounts", response_model=list[AccountResponse])
    def list_accounts(
        user: CurrentAccountUser = Depends(current_user),
        service: AccountsService = Depends(accounts_service),
    ) -> list[AccountResponse]:
        return [
            AccountResponse(**vars(account))
            for account in service.list_accounts(user.id)
        ]

    @router.get("/accounts/{account_id}", response_model=AccountResponse)
    def get_account(
        account_id: UUID,
        user: CurrentAccountUser = Depends(current_user),
        service: AccountsService = Depends(accounts_service),
    ) -> AccountResponse:
        return AccountResponse(**vars(service.get_account(user.id, account_id)))

    @router.post("/accounts", response_model=AccountResponse, status_code=201)
    def create_account(
        body: CreateAccount,
        response: Response,
        user: CurrentAccountUser = Depends(current_user),
        service: AccountsService = Depends(accounts_service),
    ) -> AccountResponse:
        account = service.create_account(
            user.id, body.broker_id, body.name, body.currency
        )
        response.headers["Location"] = f"/api/v1/accounts/{account.id}"
        return AccountResponse(**vars(account))

    @router.patch("/accounts/{account_id}", response_model=AccountResponse)
    def update_account(
        account_id: UUID,
        body: UpdateAccount,
        user: CurrentAccountUser = Depends(current_user),
        service: AccountsService = Depends(accounts_service),
    ) -> AccountResponse:
        account = service.update_account(
            user.id, account_id, name=body.name, currency=body.currency
        )
        return AccountResponse(**vars(account))

    @router.delete("/accounts/{account_id}", status_code=204)
    def delete_account(
        account_id: UUID,
        user: CurrentAccountUser = Depends(current_user),
        service: AccountsService = Depends(accounts_service),
    ) -> None:
        service.delete_account(user.id, account_id)

    return router
