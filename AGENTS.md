# Tallyhold agents

Tallyhold ("All your brokers. One portfolio.") is a multi-user, read-only portfolio view for long-term investors across brokers. It is a learning project in OOP, SOLID, relational design and end-to-end delivery. Agents work from approved feature specs; Zack approves requirements and constitution-changing PR merges.

## Read first

1. [Constitution](docs/constitution.md) for non-negotiable rules. Exception: a fresh Reviewer reads only [its permitted inputs](docs/agents/reviewer.md).
2. [Product spec](docs/spec.md) for product and architecture decisions; it wins over summaries elsewhere.
3. For a feature, read `docs/specs/NNN-name/spec.md`, then the approved `plan.md` and `tasks.md` when present.
4. Read [workflow](docs/workflow.md) for handoffs and the relevant [role](docs/agents/) before acting in that role.
5. Use the [skills index](docs/skills/README.md) to find role-specific procedures when their triggers apply.
6. Publish [Agent Flow](docs/agent-flow.md) events for every role start, step, completion and block; the coordinator reports fresh Reviewer lifecycle and verdict externally.

## Repo map

- `backend/`: Python API (introduced in feature 001).
- `frontend/`: Next.js client (introduced in feature 001).
- `docs/spec.md`: product source of truth; `docs/architecture/`: diagram.
- `docs/constitution.md`, `docs/conventions.md`, `docs/adr/`, `docs/agents/`, `docs/specs/`: rules, conventions, decisions, roles and feature specs.
- `.github/`: issue/PR templates; CI starts in feature 001.
- `.trae/`, `CLAUDE.md`: tool-specific pointers to these shared rules.

## Boundaries

- Presentation: FastAPI routers and Pydantic schemas; no business logic. Next.js consumes REST `/api/v1`.
- Application: use cases coordinate domain interfaces, injected dependencies and repositories.
- Domain: pure Python entities and interfaces; no framework, DB or HTTP imports.
- Infrastructure: SQLAlchemy repositories, importers and external clients implement domain interfaces; all external calls live here.
- Modules: `identity`, `accounts`, `instruments`, `transactions`, `importing`, `market_data`, `portfolio`. Transactions are authoritative; positions are derived.
- Layout: each business module owns `domain`, `application`, `infrastructure` and `presentation` packages under `backend/app/modules/<module>/`; `backend/app/shared/` contains cross-cutting code. Public health lives in the technical `backend/app/modules/system/presentation/` package, outside the seven business modules. Business modules do not import one another's internals.

## Work on a feature

1. GitHub issue -> Planner drafts feature `spec.md` -> **Gate 1:** Zack approves the spec. For schema or architecture changes, Zack also approves the plan before execution.
2. Architect writes `plan.md` and `tasks.md`; Test writer commits failing tests; Implementer makes them pass.
3. **"create pr", "open pr", "ship" or "ship it": run [ship](docs/skills/ship.md) end to end**: [create-pr](docs/skills/create-pr.md) sub-step, checks, fresh Reviewer each round, fixes and merge gate (at most three rounds).
4. **Gate 2:** The ship coordinator merges only if every gate passes; Zack merges constitution-changing PRs or resolves `needs-human`. CD deploys staging; production deploys on a tagged release.

Git is the only sync between Trae and Claude Code devices: pull before starting, push when stopping. One feature = one branch = one tool at a time. Use `feature/NNN-name` for feature work; `chore/name` for foundation/maintenance. Every commit and PR follows [conventions](docs/conventions.md). Agents never push directly to `main`; merge only through ship.

## Definition of done

- Approved acceptance criteria pass; tests cover new behavior; overall coverage is at least 80%.
- Lint, formatting, type checks and tests pass; migrations accompany schema changes.
- Documentation and ADRs reflect changes; reviewer findings are resolved or escalated.
- PR links issue and spec; ship gates pass before automated merge, or Zack resolves `needs-human` and constitution changes.

## Commands

- Backend (`backend/`): `uv sync --locked --group dev`; `uv run uvicorn app.main:app --reload`; `uv run ruff check .`; `uv run ruff format --check .`; `uv run mypy app`; `uv run lint-imports`; `uv run pytest --cov=app --cov-fail-under=80`.
- Frontend (`frontend/`): `npm ci`; `npm run dev`; `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`.
- Local stack: `docker compose up --build -d`, `docker compose ps`, `curl --fail http://localhost:8000/api/v1/health`. See [README](README.md) for migrations, security scans and local TLS trust.
