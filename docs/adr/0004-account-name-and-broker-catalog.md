# ADR 0004: Replace account-name uniqueness and seed shared brokers

Status: proposed with the Feature 006 schema/architecture plan; awaiting
Zack's separate approval after Gate 1.

## Context

Feature 003 has an exact-string `UNIQUE (user_id, name)` account constraint,
no broker seeds and no account HTTP API. Feature 006 requires trimmed,
case-insensitive account names per user and a read-only SG catalog containing
Tiger and IBKR. Existing account and broker rows may already have been
written by repository callers. Transactions reference accounts through a
tenant composite FK, so broker/account history must not be discarded.

## Decision

Add one transactional `0004_accounts_catalog` Alembic revision after 0003.
Under an account-table write lock, preflight existing names for blank or
noncanonical surrounding whitespace and for per-user `lower(name)`
collisions. Fail atomically with non-identifying remediation guidance if
any are found; do not silently rename accounts. With clean data, add the
unique expression index `(user_id, lower(name))`, then drop 003's named
exact-string constraint. Keep original display case in the stored name;
the application trims new/updated names and the database enforces
concurrency-safe uniqueness. The database's collation governs `lower`.

Seed the two `(name, country)` pairs `(Tiger, SG)` and `(IBKR, SG)` with
reserved stable UUIDs only when that pair is absent. Reuse an existing
row and ID; never replace broker references or expose broker writes to
clients. Refuse **any** pre-existing row occupying a reserved ID, even
when the pair matches, so downgrade can identify its own seed safely.

On downgrade, restore the old constraint before removing the new index.
Remove only matching reserved seed rows that have no dependent accounts;
fail and roll back completely if a seeded row is referenced. A production
data-remediation or downgrade affecting active accounts requires operator
review, not automatic deletion or reassignment.

## Alternatives considered

- Validate duplicates only in the application: two concurrent inserts
  could both pass and break the contract.
- Keep both old and new uniqueness rules: redundant indexes and stale 003
  head expectations would obscure the actual invariant.
- Auto-trim, merge or rename conflicting legacy accounts in the migration:
  would silently change user-visible identities and future import matching.
- Hardcode new broker IDs in the API or overwrite existing Tiger/IBKR rows:
  would create unstable references and bypass shared catalog storage.
- Cascade broker/account deletion during downgrade: would destroy user
  data, including transaction-linked accounts.

## Consequences

PostgreSQL 17 migration tests must cover pre-existing rows, collisions,
two-user independence, upgrade/downgrade/re-upgrade and dependent-row
rollback. Tests that inspect the historical 0002 schema must no longer
assume its old constraint survives at `head`. The schema remains safe for
concurrent writes, but a live deployment with noncanonical legacy names
must pause for an explicitly approved remediation rather than guess.
No migration file or data change is authorized until Zack approves the
Feature 006 plan.
