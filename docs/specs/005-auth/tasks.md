# 005: Authentication and identity tasks

## Approval gate

- [x] **Planner, [T-0021](../../work/tickets/T-0021-draft-auth-spec.md):**
  Record Zack's 2026-11-17 Gate 1 approval, production Data API OFF,
  ES256/P-256 via JWKS, previous HS256 rejected and 3600-second access
  lifetime. Approved contract: [spec](spec.md), commit `3e3c79c`.
- [x] **Architect, [T-0022](../../work/tickets/T-0022-plan-auth.md):**
  Map AC1-AC5 to the layered design, PostgreSQL migration, operational
  erasure and offline verification; hand [plan](plan.md) and this ordering
  to Zack.
- [x] **Zack plan gate (2026-11-17):** Approved the choices in
  [plan gate](plan.md#plan-gate-decisions-and-limitations), especially
  platform deny-marker treatment, shared advisory-lock protocol, 600s
  JWKS cache/60s in-memory per-process limit/3s timeout, ES256-only
  verification, first-login transaction and two-table migration.
  **RED is authorized; GREEN awaits Zack's RED-checkpoint review.**

The coordinator allocates a new work ticket before each independent
assignment; no future ticket IDs are presumed here. Each RED/GREEN item is
one focused Conventional Commit on `feature/005-auth`, with checkpoints
and verification recorded in its assigned ticket. RED tests collect and
fail on missing behavior, not on missing libraries, unrelated setup or
production network access. Test writer and Implementer remain separate
roles; the Implementer does not alter tests merely to pass.

## RED: Approved, stop for Zack's review before GREEN

- [x] **Test writer: offline JWT matrix (AC2).** Add locally generated
  P-256 key/test JWKS tokens for valid, expired, bad signature, wrong issuer,
  audience and algorithm (including previously used HS256), unknown `kid`,
  missing/empty `sub`, `anon`/`service_role`/unknown role and JWKS outage.
  Assert 401/503 behavior, 600s cache expiry, a random-`kid` flood across
  verifier instances in one process causing <=1 unknown-key fetch per
  60-second window even with concurrent thread/async requests,
  a 3-second fetch timeout, no provisioning on rejection and no Supabase
  network. Commit behavioral failures separately.
- [x] **Test writer: schema, first login and erasure marker (AC3, AC5).**
  Extend disposable PostgreSQL migration tests to `0003` upgrade/downgrade/
  re-upgrade; assert identity uniqueness/FK, minimal marker and no extra
  auth table or exposure. Add same-user return, email/provider
  change, two-sub separation, concurrent first-login/no orphan and marker
  denial before lookup. Force a two-connection PostgreSQL interleaving:
  operator inserts marker under the same advisory lock while first-login
  is in flight; after operator deletion, no re-provisioned user survives.
  Verify both lock orders with READ COMMITTED re-check; commit RED.
- [x] **Test writer: current-user route/CORS (AC2, AC4).** Exercise
  `/api/v1/me` with authenticated bearer and two users, missing/invalid
  bearer, cookie-only attempt, allowed/disallowed preflight origins, public
  health and no caller-supplied user ID. Commit RED.
- [x] **Test writer: Next.js session experience (AC1, AC4).** Mock Google
  OAuth PKCE callback, signed-in and signed-out states, cancelled/expired
  flows, sign-out, bearer request with omitted credentials and no tokens in
  URLs/logs. Run Vitest to a behavior-failing RED checkpoint; commit.
- [x] **Test writer handoff:** Verify all RED tests collect and failures
  identify missing 005 behavior. Existing domain/integration tests still
  pass; no real Supabase keys or network calls in CI. Checkpoint the exact
  failing revision and stop for Zack's review before any Implementer work.

## GREEN: Only after Zack reviews the RED checkpoint

- [x] **Implementer: additive identity schema (AC3, AC5).** Add
  `identities` and `erasure_deny_markers` mappings, indexes/constraints and
  `0003_auth_identity` after deployed `0002`; import metadata in Alembic.
  Preserve 002 tables and prove PostgreSQL migration round-trip and RED
  constraints pass. Commit only schema/migration work.
- [x] **Implementer: ES256 verification (AC2).** Add locked cryptographic
  JWT/HTTP dependencies, pinned issuer/audience/project JWKS, bounded
  600s public-key cache, synchronized in-memory unknown-`kid` limit
  (one attempt per 60 seconds per process across all keys), 3s HTTP timeout,
  strict P-256
  ES256/role/sub checks and fail-closed errors.
  No shared secret, token-supplied key URL or live Supabase network in CI.
  Run offline matrix and commit.
- [ ] **Implementer: identity resolution (AC3, AC5).** Add pure domain
  identity/marker ports, SQLAlchemy adapters and `ResolveCurrentUser`.
  Check marker before lookup. If identity is absent, acquire the PostgreSQL
  transaction advisory lock on the canonical `(issuer, sub)` key, re-check
  marker and identity under READ COMMITTED, then use the caller-owned
  transaction/savepoint to avoid duplicate and orphan users. Assign SGD
  only at first login. Prove interleaving and two-user tests; commit.
- [ ] **Implementer: FastAPI wiring (AC2, AC4).** Compose verifier,
  session and resolver in the identity dependency; expose only `GET
  /api/v1/me` with UUID/currency and generic denial. Restrict CORS to
  configured frontend origins, accept bearer not auth cookies, keep health
  public. Run API and import-linter tests; commit.
- [ ] **Implementer: Next.js login/logout (AC1, AC4).** Add Supabase
  browser/server clients and PKCE callback, protected user display,
  signed-out and failure states, sign-out/session-expiry behavior, and
  bearer-only FastAPI fetch with credentials omitted. Lock packages,
  document public configuration, run Vitest/typecheck/build; commit.
- [ ] **Implementer: operator runbook and docs (AC5).** Document verified
  request clock (30 calendar days), verified `(issuer, sub)` key derivation
  identical to provisioning, acquire `pg_advisory_xact_lock` in the
  operator's transaction, upsert marker with >=3600s remaining and commit before
  deletion, then perform FK-safe app and Supabase Auth deletion, partial
  retry, restricted backup/log retention, restore re-erasure and marker
  purge after >=3600 seconds. No API pause, app erasure endpoint/job or
  marker insertion/purge code. Document production Data API OFF inspection;
  test with disposable DB/Auth identities outside CI before any second
  user; do not access production credentials as an agent. Commit docs.
- [ ] **Implementer: full verification.** Run PostgreSQL migration
  upgrade/downgrade/re-upgrade, backend ruff/format, mypy strict,
  import-linter, pytest >=80% overall, frontend lint/Prettier/typecheck/
  Vitest/build and scans. Prove no live keys, Supabase CI calls, Feature
  006 endpoints, RLS claims or unrelated domain edits. Record outcomes;
  fix behavior via separate commits without weakening RED tests.

## Delivery

- [ ] **Coordinator:** After approved plan and completed GREEN, use
  [ship](../../skills/ship.md) end to end for issue #27, including
  create-pr, CI, fresh Reviewer rounds and gated merge. This line does
  not grant PR/merge authority in the current planning session.
