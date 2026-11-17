# 006: Accounts delivery tasks

## Approval gates

- [x] **Planner, [T-0040](../../work/tickets/T-0040-draft-accounts-spec.md):**
  Zack approved [Feature 006](spec.md) at Gate 1 on 2026-11-17;
  approved contract pushed as `c5469b8`.
- [x] **Architect, [T-0041](../../work/tickets/T-0041-plan-accounts.md):**
  Present [plan](plan.md), this ordering and [ADR 0004](../../adr/0004-account-name-and-broker-catalog.md)
  for Zack's separate schema/architecture approval.
- [ ] **Zack plan gate:** Explicitly approve the migration, layer design and
  verification before any RED test, migration file or feature code is written.

The coordinator creates a Track A ticket (T-0042..T-0049 as available)
**when assigning** each independently owned step, not in advance.
Track A alone writes Alembic until 006 merges. A task can have multiple
small commits when useful, but do not mix RED tests with implementation.
The Test writer commits/pushes behavior-failing tests first; each RED
round receives a fresh independent review before GREEN. This document
orders work and maps ACs; tickets own assignment and execution evidence.

## RED: only after separate plan approval

- [ ] **Test writer: PostgreSQL migration and repository invariants
  (AC1, AC3, AC4, AC7).** Add failing tests for 0004's SG Tiger/IBKR
  seeds, reuse of pre-existing IDs, idempotence, `(user_id, lower(name))`
  index replacing the old constraint, two-user independence, direct SQL
  case-conflict and concurrent insert race. Exercise clean and blocked
  downgrade and legacy collision/padded-name preflight without data
  rewrites. Adapt 003 catalog assertions to distinguish 0002 from head;
  do not edit migration or production code. Commit and push RED.
- [ ] **Test writer: account use cases (AC2-AC5, AC7).** With fake 003
  ports, cover sorted scoped reads, name trimming/blank/length and
  currency normalization, stable broker, partial PATCH, missing/foreign
  account, duplicate name, unknown broker and dependent delete. Assert
  domain/application imports remain pure. Commit and push RED.
- [ ] **Test writer: authenticated API and CORS (AC1-AC5, AC7).** Add
  offline JWT/dependency-injected FastAPI tests for the six routes, two
  users, strict 422/404/409, create `Location`, 204 delete, 401/503,
  rollback/no SQL leak, public health and configured-origin write
  preflights. Reuse disposable PostgreSQL 17, never live auth. Commit
  and push RED.
- [ ] **Test writer: account UI (AC1, AC3, AC5, AC6).** Add Vitest
  failures for `/accounts` link/list/form/edit/delete, SG catalog,
  broker-not-listed and currency default from `/me`, conflict/retry,
  loading/empty/outage, keyboard/focus and mobile, bearer-only fetch,
  sign-out/expiry/user-switch clearing and stale request abortion.
  Keep existing 005 auth tests passing. Commit and push RED.
- [ ] **Test writer handoff:** Run targeted RED suites to show failures
  are caused by missing 006 behavior, not broken fixtures or unrelated
  regressions; run pre-existing tests and checkpoint the pushed SHA,
  failure summary and plan criteria. Stop for fresh independent
  [RED review](../../skills/red-review.md), at most two rounds; no GREEN
  before `APPROVE`.

## GREEN: only after independent RED approval

- [ ] **Implementer: 0004 broker seed and name index (AC1, AC3, AC7).**
  Add the transactional migration after 0003 and matching SQLAlchemy
  metadata. Preserve pre-existing broker IDs; reject noncanonical or
  colliding legacy names before replacing the 003 unique constraint.
  Restore that constraint on guarded downgrade. Pass PostgreSQL
  migration/index tests, then commit only schema/migration work.
- [ ] **Implementer: account domain and use cases (AC2-AC5, AC7).**
  Add pure name validation and module failures, account CRUD and
  read-only broker listing in one application module using the 003 ports.
  Map named account constraints in infrastructure, scope all owned calls to
  005's internal user ID, never change broker on PATCH and preserve
  transactions on rejected DELETE. Pass unit and repository tests;
  commit this layer slice separately.
- [ ] **Implementer: API and composition (AC1-AC5, AC7).** Add strict
  request/response schemas and routes, 201/200/204 and opaque
  401/422/404/409/503 mapping, shared request session and current-user
  injection. Register router once and permit configured-origin
  GET/POST/PATCH/DELETE preflights without cookies or wildcard. Pass API
  and isolation tests; commit this HTTP slice.
- [ ] **Implementer: account UI (AC1, AC3, AC5, AC6).** Reuse the 005
  session lifecycle, add bearer-only account API client and `/accounts`
  manager with home link, forms, delete confirmation and meaningful
  empty/error/expiry states. Preserve current auth tests and private
  data clearing; pass Vitest/types/lint/build and commit UI separately.
- [ ] **Implementer: verification and docs (AC1-AC7).** Run fresh
  PostgreSQL migration upgrade/downgrade/re-upgrade and full backend
  ruff/format/mypy/import-linter/pytest >=80%; frontend lint/
  Prettier/typecheck/Vitest/build and dependency/secret scans. Reconcile
  affected 003 migration tests and documentation with the new head.
  Record results and any fixes in focused commits without weakening
  approved RED behavior. No CI, Compose or AGENTS.md edits on Track A.

## Delivery

- [ ] **Coordinator:** Only after approved plan, RED review, GREEN and
  checks, run [ship](../../skills/ship.md) for issue #36 with a fresh
  Reviewer, CI and gated merge. This planning handoff does not authorize
  a PR or merge now.
