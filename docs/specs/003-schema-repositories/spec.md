# 003: Schema and repositories

## Status

Approved — Gate 1, 2026-11-13

Issue: [#17](https://github.com/donkey-king-kong/tallyhold/issues/17)

## Problem

After Feature 002 defines and lands Tallyhold's domain model, the application
needs durable PostgreSQL persistence without exposing SQLAlchemy, Alembic, or
database concerns to the domain. The schema and repository implementations must
preserve the approved domain rules, isolate each user's data, and be proven
against PostgreSQL rather than an SQLite substitute.

This feature depends on Feature 002 receiving Gate 1 approval and merging. Its
implementation may begin only after the merged Feature 002 contract identifies
the entities that require persistence and the domain repository interfaces that
infrastructure must implement.

## User stories

- As an investor, I want my accounts, instruments, and transaction history
  stored durably so that my authoritative records survive application restarts.
- As a Tallyhold user, I want every persistence operation on my data scoped to
  my identity so that another user's records cannot be read or changed.
- As a developer, I want SQLAlchemy repositories to implement domain-owned
  interfaces so that domain and later application behavior do not depend on an
  ORM.
- As a maintainer, I want repeatable Alembic migrations and repository tests
  against real PostgreSQL so that persistence behavior matches the production
  database.

## Persistence contract

- Alembic owns every schema change needed to persist the non-derived entities
  in the approved, merged Feature 002 contract.
- The relational schema follows the product schema and approved Feature 002
  invariants. User-owned tables carry `user_id`; shared reference data is
  exempt.
- Transactions remain authoritative. A position is derived from transactions
  and is not stored as an editable or authoritative record.
- SQLAlchemy repository classes live in infrastructure and implement the
  domain repository interfaces delivered by Feature 002. This feature does not
  add persistence or ORM dependencies to domain code.
- Repository integration tests run with pytest against a real PostgreSQL
  service provided by Docker Compose. SQLite does not qualify as evidence for
  these criteria.

## Acceptance criteria

### AC1: Feature 002 is an enforced prerequisite

- Given Feature 002 has not received Gate 1 approval or has not merged, when
  Feature 003 architecture or implementation is considered, then work stops
  without creating a plan, tasks, migrations, repositories, or tests.
- Given the approved and merged Feature 002 contract, when Feature 003 scope is
  finalized, then every persisted entity and implemented repository interface
  traces to that contract without changing Feature 002 domain behavior.
- Given the merged Feature 002 contract does not define the repository
  interfaces required by issue #17, when Feature 003 is ready to proceed, then
  the dependency is reported as blocked rather than inventing infrastructure-
  owned domain interfaces.

### AC2: Alembic creates the required PostgreSQL schema

- Given an empty PostgreSQL database, when all Feature 003 Alembic upgrades are
  applied, then the tables, columns, keys, relationships, uniqueness rules, and
  indexes required to persist every non-derived Feature 002 entity exist.
- Given a persisted monetary amount, price, quantity, rate, or ratio, when its
  PostgreSQL column is inspected, then it uses an exact numeric type compatible
  with the precision required by the product and domain contracts rather than a
  floating-point type.
- Given a persisted domain enumeration, identifier, date, timestamp, currency,
  or structured attribute, when its mapping is inspected, then its PostgreSQL
  representation preserves the approved domain value and constraints.
- Given any user-owned table, when its schema is inspected, then it contains a
  required `user_id` and indexes that support its user-scoped repository
  operations; shared reference tables remain exempt.
- Given the transaction schema, when it is inspected, then it preserves
  transactions as the source of truth and no editable or authoritative
  positions table exists.

### AC3: Migrations are reversible on real PostgreSQL

- Given an empty PostgreSQL database, when Feature 003 is upgraded to its
  latest revision, downgraded to the pre-feature revision, and upgraded again,
  then every command succeeds and the final schema matches a clean latest
  upgrade.
- Given a migration failure, when pytest reports the migration check, then the
  failing Alembic direction and revision are observable.

### AC4: SQLAlchemy repositories implement domain contracts

- Given the approved Feature 002 repository interfaces, when the infrastructure
  implementations are inspected, then each implementation conforms to its
  domain-owned interface and domain modules import no SQLAlchemy, Alembic, or
  database package.
- Given a valid Feature 002 entity, when it is saved and retrieved through its
  SQLAlchemy repository, then its identity, relationships, exact Decimal
  values, currencies, dates, and domain-specific values round-trip without
  loss.
- Given an existing entity and an operation supported by its approved
  repository contract, when that operation is performed and the entity is
  retrieved again, then the observable stored state matches the contract.
- Given an entity that violates an approved relational invariant, when a
  repository attempts to persist it, then PostgreSQL or the repository rejects
  the write and no partial change is committed.

### AC5: User-owned repository operations are isolated

- Given records owned by two users, when either user's repository reads,
  writes, updates, or deletes user-owned data, then the operation is constrained
  to that user's identifier.
- Given one user requests another user's identifier through a user-scoped
  repository operation, when the operation completes, then it neither returns
  nor changes the other user's record.
- Given a user-owned entity references another user-owned entity, when the
  relationship is persisted, then a cross-user relationship is rejected.
- Given shared reference data, when it is accessed through its repository, then
  it is available without pretending that the shared row is user-owned.

### AC6: Repository tests use Docker Compose PostgreSQL

- Given the repository integration test suite, when it runs, then it connects
  to the PostgreSQL service supplied by the repository's Docker Compose setup
  and does not substitute SQLite.
- Given a fresh PostgreSQL test database, when the repository suite runs, then
  it applies the Alembic migrations before testing repository behavior.
- Given the tests for each repository implementation, when they run, then they
  cover successful persistence and retrieval, approved updates or deletion,
  relational constraint failures, exact Decimal round trips, and user
  isolation where applicable.
- Given the repository suite finishes or fails, when cleanup runs, then test
  data does not leak into a later test run.

### AC7: Persistence remains inside infrastructure

- Given the completed Feature 003 changes, when module and layer dependencies
  are checked, then SQLAlchemy models, sessions, mappings, and repository
  implementations remain in infrastructure, while Alembic integration remains
  outside the domain.
- Given the completed Feature 003 changes, when the diff is inspected, then it
  contains no application services, API endpoints, presentation schemas, or
  frontend behavior.

## Out of scope

- Changes to Feature 002 entities, calculations, invariants, or repository
  interfaces
- Application services, dependency-injection wiring, or use-case orchestration
- FastAPI routes, Pydantic request or response schemas, and authentication
- Frontend pages, components, or client behavior
- CSV import, broker integrations, price providers, FX providers, and portfolio
  metric orchestration
- Persisting positions or calculated metrics as authoritative data
- Production database provisioning, deployment, backups, and credentials
- PostgreSQL Row Level Security policies; repository user scoping is required
  here, while RLS remains a later defense in depth

## Architecture dependencies and questions

1. Feature 002 merged through PR #18. Its approved contract defines `User`,
   `Broker`, `Account`, `Instrument`, `Transaction`, `Position`, `Money`, and
   `CostBasisStrategy`, but explicitly defines no database ports or repository
   interfaces. Under AC1, Feature 003 architecture remains blocked until an
   approved domain follow-up supplies the repository interfaces required by
   issue #17.
2. Which database constraints enforce cross-user relationship integrity in
   addition to mandatory repository scoping? The architecture plan must propose
   this after the repository-interface blocker is resolved.

## Gate 1 decision

Zack approved this contract as drafted on 2026-11-13. PostgreSQL Row Level
Security is deferred to the authentication and accounts phase; Feature 003
still requires repository-level user scoping and the approved relational
isolation criteria.
