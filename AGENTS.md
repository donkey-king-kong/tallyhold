# Tallyhold agents

Tallyhold ("All your brokers. One portfolio.") is a multi-user, read-only portfolio view for long-term investors across brokers. It is a learning project in OOP, SOLID, relational design and end-to-end delivery. Agents work from approved feature specs; Zack approves requirements and merges.

## Read first

1. [Constitution](docs/constitution.md) for non-negotiable rules.
2. [Product spec](docs/spec.md) for product and architecture decisions; it wins over summaries elsewhere.
3. For a feature, read `docs/specs/NNN-name/spec.md`, then the approved `plan.md` and `tasks.md` when present.
4. Read [workflow](docs/workflow.md) for handoffs and the relevant [role](docs/agents/) before acting in that role.
5. Use the [skills index](docs/skills/README.md) to find role-specific procedures when their triggers apply.

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

## Work on a feature

1. GitHub issue -> Planner drafts feature `spec.md` -> **Gate 1:** Zack approves the spec. For schema or architecture changes, Zack also approves the plan before execution.
2. Architect writes `plan.md` and `tasks.md`; Test writer commits failing tests; Implementer makes them pass.
3. Reviewer checks against spec, plan and constitution (at most three rounds, then Zack); open a PR and pass CI.
4. **Gate 2:** Zack reviews and merges. CD deploys staging; production deploys on a tagged release.

Git is the only sync between Trae and Claude Code devices: pull before starting, push when stopping. One feature = one branch = one tool at a time. Use `feature/NNN-name` for feature work; `chore/name` for foundation/maintenance. Every commit and PR follows [conventions](docs/conventions.md). To open a PR, follow [create-pr](docs/skills/create-pr.md). Only Zack merges; agents never push to `main`.

## Definition of done

- Approved acceptance criteria pass; tests cover new behavior; overall coverage is at least 80%.
- Lint, formatting, type checks and tests pass; migrations accompany schema changes.
- Documentation and ADRs reflect changes; reviewer findings are resolved or escalated.
- PR links issue and spec; CI passes; Zack completes Gate 2 before merge.

## Commands

- Backend install, run, lint, type check and test: **TBD — added in feature 001**.
- Frontend install, run, lint, type check, test and build: **TBD — added in feature 001**.
- Local Docker Compose and CI: **TBD — added in feature 001**.
