"""Opaque HTTP translation of account-module failures."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.modules.accounts.domain.errors import (
    AccountInUse,
    AccountNotFound,
    BrokerNotFound,
    DuplicateAccountName,
)


def register_account_errors(app: FastAPI) -> None:
    async def not_found(_request: Request, _error: Exception) -> JSONResponse:
        return JSONResponse({"detail": "Not found"}, status_code=404)

    async def conflict(_request: Request, _error: Exception) -> JSONResponse:
        return JSONResponse({"detail": "Account conflict"}, status_code=409)

    for failure in (AccountNotFound, BrokerNotFound):
        app.add_exception_handler(failure, not_found)
    for conflict_failure in (DuplicateAccountName, AccountInUse):
        app.add_exception_handler(conflict_failure, conflict)
