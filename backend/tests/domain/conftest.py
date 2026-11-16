"""Helpers that keep absent domain contracts as test failures during RED."""

from importlib import import_module
from types import ModuleType
from typing import Any

import pytest


class PublicContract:
    """Load planned public exports during test execution."""

    def module(self, module_name: str) -> ModuleType:
        try:
            return import_module(module_name)
        except ModuleNotFoundError as error:
            pytest.fail(f"missing public domain package {module_name}: {error}")

    def export(self, module_name: str, export_name: str) -> Any:
        module = self.module(module_name)
        if not hasattr(module, export_name):
            pytest.fail(f"{module_name} does not export {export_name}")
        return getattr(module, export_name)


@pytest.fixture
def public_contract() -> PublicContract:
    return PublicContract()
