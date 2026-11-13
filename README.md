# Tallyhold

*All your brokers. One portfolio.*

Tallyhold gives long-term investors a consolidated portfolio view across broker accounts, with per-account drill-down. It is a multi-user learning project in OOP, SOLID, relational databases and spec-driven delivery.

![Development pipeline and runtime architecture](docs/architecture/overview.png)

**Status:** Phase 0: project scaffold.

Read the [product spec](docs/spec.md), [workflow](docs/workflow.md) and [agent entry point](AGENTS.md).

For current priorities, ticket ownership, and session recovery, start at
[work tracking](docs/work/README.md). The repo-local records include the
[roadmap](docs/work/roadmap.md) and agent run history; no external board is needed.

## Run locally

Install Python 3.12, [uv](https://docs.astral.sh/uv/), Node 24.19.0, npm and Docker Compose. The pins are in `backend/.python-version` and `frontend/.nvmrc`. The frontend runs on your host; Compose runs the API and disposable PostgreSQL only.

```sh
docker compose up --build -d
docker compose ps
curl --fail http://localhost:8000/api/v1/health
```

Then, in another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000 to see the API status. The frontend uses `http://localhost:8000` by default; override `NEXT_PUBLIC_API_URL` before starting Next.js if the API runs elsewhere. The API allows the local frontend origin `http://localhost:3000` by default (`FRONTEND_ORIGIN` overrides it). To stop the containers, use `docker compose down`.

The local database is exposed on `127.0.0.1:55432`, not `5432`, to avoid common local Postgres conflicts. It uses trust authentication **only for disposable local development** and is not suitable for production or real user data. No application tables exist in feature 001. On a network with a custom trusted TLS authority, point `TALLYHOLD_CA_CERT` at its local PEM bundle when running `docker compose up --build -d`; Docker mounts it as a build secret, without committing the certificate or disabling TLS validation.

## Check changes

Run backend commands from `backend/`:

```sh
uv sync --locked --group dev
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked mypy app
uv run --locked lint-imports
uv run --locked pytest --cov=app --cov-report=term-missing --cov-fail-under=80
DATABASE_URL=postgresql+psycopg://tallyhold@localhost:55432/tallyhold uv run --locked alembic upgrade head
DATABASE_URL=postgresql+psycopg://tallyhold@localhost:55432/tallyhold uv run --locked alembic downgrade base
```

Run frontend commands from `frontend/`:

```sh
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

The backend dependency scan checks the full locked dependency graph:

```sh
uv export --locked --all-groups --no-emit-project --format requirements-txt --output-file /tmp/tallyhold-requirements.txt >/dev/null
uv run --locked pip-audit -r /tmp/tallyhold-requirements.txt
```

Run `gitleaks git --redact --exit-code 1 .` at the repository root for the secret scan. CI runs these checks and the migration round-trip against a fresh PostgreSQL service on every pull request.
