"""AC9: Feature 002 domain source is pure and deterministic."""

import ast
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).parents[2]
APP_ROOT = BACKEND_ROOT / "app"
EXPECTED_DOMAIN_FILES = [
    APP_ROOT / "shared/domain/money.py",
    APP_ROOT / "modules/identity/domain/models.py",
    APP_ROOT / "modules/identity/domain/repositories.py",
    APP_ROOT / "modules/accounts/domain/models.py",
    APP_ROOT / "modules/accounts/domain/repositories.py",
    APP_ROOT / "modules/instruments/domain/models.py",
    APP_ROOT / "modules/instruments/domain/repositories.py",
    APP_ROOT / "modules/transactions/domain/models.py",
    APP_ROOT / "modules/transactions/domain/repositories.py",
    APP_ROOT / "modules/portfolio/domain/models.py",
    APP_ROOT / "modules/portfolio/domain/cost_basis.py",
    APP_ROOT / "modules/portfolio/domain/calculations.py",
]
DOMAIN_ROOTS = [
    APP_ROOT / "shared/domain",
    APP_ROOT / "modules/identity/domain",
    APP_ROOT / "modules/accounts/domain",
    APP_ROOT / "modules/instruments/domain",
    APP_ROOT / "modules/transactions/domain",
    APP_ROOT / "modules/portfolio/domain",
]
FORBIDDEN_IMPORT_ROOTS = {
    "alembic",
    "fastapi",
    "httpx",
    "numpy",
    "os",
    "pandas",
    "pathlib",
    "pydantic",
    "requests",
    "socket",
    "sqlite3",
    "subprocess",
    "sqlalchemy",
    "time",
    "urllib",
}
FORBIDDEN_APP_LAYERS = {".application", ".infrastructure", ".presentation"}
FORBIDDEN_CALLS = {"open", "today", "utcnow", "now", "uuid1", "uuid4"}


def _imports(tree: ast.AST) -> list[tuple[str, int]]:
    imports = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.extend((alias.name, 0) for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            imports.append((node.module or "", node.level))
    return imports


def test_all_planned_domain_source_files_exist() -> None:
    missing = [
        str(path.relative_to(BACKEND_ROOT))
        for path in EXPECTED_DOMAIN_FILES
        if not path.is_file()
    ]

    assert missing == [], f"missing planned domain behavior: {missing}"


def test_domain_imports_only_standard_library_and_domain_contracts() -> None:
    violations = []
    for root in DOMAIN_ROOTS:
        for path in root.glob("*.py"):
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
            for module_name, relative_level in _imports(tree):
                if relative_level:
                    continue
                import_root = module_name.partition(".")[0]
                if import_root in FORBIDDEN_IMPORT_ROOTS:
                    violations.append((path, module_name))
                    continue
                if import_root not in sys.stdlib_module_names | {"app"}:
                    violations.append((path, module_name))
                    continue
                if any(layer in module_name for layer in FORBIDDEN_APP_LAYERS):
                    violations.append((path, module_name))
                    continue
                if (
                    module_name.startswith("app.modules.")
                    and f"app.modules.{path.parts[-3]}." not in module_name
                ):
                    violations.append((path, module_name))

    assert violations == []


def test_domain_source_contains_no_float_literals() -> None:
    float_literals = []
    for root in DOMAIN_ROOTS:
        for path in root.glob("*.py"):
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
            for node in ast.walk(tree):
                if isinstance(node, ast.Constant) and isinstance(node.value, float):
                    float_literals.append((path, node.lineno, node.value))

    assert float_literals == []


def test_domain_calculations_do_not_call_ambient_boundaries() -> None:
    forbidden_calls = []
    for root in DOMAIN_ROOTS:
        for path in root.glob("*.py"):
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
            for node in ast.walk(tree):
                if not isinstance(node, ast.Call):
                    continue
                if isinstance(node.func, ast.Name):
                    call_name = node.func.id
                elif isinstance(node.func, ast.Attribute):
                    call_name = node.func.attr
                else:
                    continue
                if call_name in FORBIDDEN_CALLS:
                    forbidden_calls.append((path, node.lineno, call_name))

    assert forbidden_calls == []
