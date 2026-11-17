# 006: Broker list and user-scoped accounts

## Status

Approved at Gate 1 by Zack on 2026-11-17 as drafted, including the five
Round 1 and four Round 2 decisions. Schema/architecture-plan approval is
a separate later gate.

Issue: [#36](https://github.com/donkey-king-kong/tallyhold/issues/36).
Track A is the sole Alembic writer until 006 merges; Gate 1 authorizes no
migration. Features 003 and 005 provide the persistence and authenticated
current-user contracts respectively.

## Problem

An authenticated investor can see their internal user ID but cannot register
the broker accounts that will hold future transactions. Shared brokers already
exist as reference entities and account repositories already scope every
operation by internal user UUID; neither has an HTTP resource or account UI.
Feature 006 makes these capabilities usable without exposing one investor's
accounts to another or adding a broker connection.

## User stories

- As a signed-in investor, I want to choose a known broker and create an
  account so future transactions have an account to belong to.
- As an investor with several accounts, I want to see, rename and correct my
  own accounts without changing another user's accounts.
- As an investor, I want to remove an account I no longer need without
  silently losing transactions.
- As a client, I want stable broker choices, predictable validation and
  private not-found responses from an authenticated API.

## Acceptance criteria

These criteria include the agreed Round 1 and Round 2 decisions.

### AC1: Authenticated broker catalog

- Given a valid Feature 005 session, when `GET /api/v1/brokers` is called,
  then it returns a plain JSON array of shared brokers with `id`, `name`
  and `country`, sorted by name then stable ID; a missing or invalid token
  gets 401.
- Given two different authenticated users, when they list brokers, then the
  same shared reference rows are eligible; no user-owned account details or
  broker write route are exposed.
- Given the initial catalog, when it is populated by the approved migration,
  then it contains Tiger and IBKR with `country = "SG"` for both; `country`
  denotes the brokerage entity jurisdiction, not the investor's country or
  instrument market. Seeding preserves any pre-existing broker rows and
  their IDs, and rerunning it cannot create duplicates.
- Given an investor whose broker is absent, when they open the account form,
  then the UI offers a "broker not listed" explanation and does not create
  an arbitrary broker or account with a made-up broker ID.

### AC2: User-scoped account reads

- Given an authenticated user, when `GET /api/v1/accounts` is called, then
  only their accounts are returned in a plain JSON array, including `[]`
  when none exist, ordered by name then stable ID. Each account response
  has `id`, `broker_id`, `broker_name`, `name` and `currency`.
  The API uses the existing 003 `name` and `currency` vocabulary, not the
  product overview's conceptual `nickname` and `base_currency` labels.
- Given one of their account IDs, when `GET /api/v1/accounts/{account_id}` is
  called, then that account object is returned with 200. An unknown ID
  and another user's ID both get the same non-disclosing 404; neither
  reveals that another user owns an account.
- Given no valid token, when either account read is requested, then it
  returns 401 without account data. Requests use Feature 005's resolved
  internal `User.id`, never a supplied user ID or the Supabase JWT `sub`.

### AC3: Create and edit an account

- Given a signed-in user and a valid shared broker, when
  `POST /api/v1/accounts` receives `broker_id`, a valid `name` and
  `currency`, then a new UUID account belongs to that internal user and can
  be read only by them. It returns 201 with the account object and a
  `Location` for its detail route; the caller cannot select owner or ID.
- Given one of the user's accounts, when
  `PATCH /api/v1/accounts/{account_id}` receives `name` and/or `currency`,
  then it returns 200 with the updated account object. Only supplied fields
  change; omitted fields stay unchanged. Its `broker_id` is fixed after
  creation. Invalid input causes no partial write or cross-user mutation.
- Given a name with surrounding whitespace, when an account is created or
  renamed, then the stored name is trimmed and must be nonblank and at most
  255 characters. Given `Main`, `main` or ` Main ` under the same user, when
  any duplicate is submitted, then the server returns 409, including under
  concurrent writes. Case-insensitive uniqueness is enforced in PostgreSQL
  by an approved migration, not only an application precheck.
- Given a valid three-letter ASCII currency code, when it is submitted in
  lowercase, then the stored and returned code is uppercase; malformed
  codes fail validation. The account currency is a default for future
  entry, not a restriction on transaction or instrument currencies.
  Phase 4 may use it as the account reporting currency for account-level
  totals; no FX or totals are computed in 006.
- Given an invalid or unknown broker ID, a foreign-owned account ID,
  invalid name or currency, extra fields, or an empty PATCH, when a create
  or edit is attempted, then it fails per AC5 without changing accounts.
- Given separate users, when either creates the same account name, then the
  per-user uniqueness constraint does not prevent either from succeeding.

### AC4: Delete without cross-user effects or silent data loss

- Given one of the user's accounts that has no dependent transactions, when
  `DELETE /api/v1/accounts/{account_id}` succeeds, then it returns 204,
  that account is no longer returned and no other user's data changes.
- Given an unknown or foreign-owned ID, when deletion is attempted, then
  both return 404 and no account is deleted.
- Given an account with existing transactions, when deletion is attempted,
  then deletion returns 409 and the account and all transactions remain
  intact. Archival is a later feature, not a fallback in 006.

### AC5: Predictable API errors

- Given malformed UUIDs, invalid or forbidden request fields, or an empty
  PATCH, when a write or detail request is made, then it returns 422. A
  well-formed but unknown broker ID gets 404. Unknown and foreign-owned
  account IDs get the same 404 for GET, PATCH and DELETE.
- Given a duplicate account name or an account deletion blocked by existing
  transactions, when the request fails, then it returns 409 without SQL,
  constraint names or another user's details. Failed writes roll back.
- Given an invalid or missing token, protected endpoints return 401.
  Feature 005's unavailable verifier or database remains a 503, never
  interpreted as an empty broker/account list or successful mutation.

### AC6: Minimal authenticated account UI

- Given a signed-in user, when they follow the link on the existing home
  screen to `/accounts`, then they can see their accounts and broker names,
  select a broker, create an account, edit permitted fields and request
  account deletion with a clear
  confirmation. Empty, loading, validation, conflict and unavailable states
  are distinguishable, with recoverable failures preserving form input.
- Given the account creation form, when it first opens, then currency
  defaults to `/api/v1/me`'s `base_currency`, remains editable, and
  accepts three-letter ASCII codes normalized to uppercase. It does not
  require a maintained currency list or convert values.
- Given sign-out, token expiry or an invalid session, when the account UI is
  shown or an in-flight operation completes, then private account data is
  cleared and no account mutation proceeds without a valid bearer token.
  API requests do not use auth cookies or expose access tokens in URLs.
- Given a narrow screen or keyboard-only navigation, when the account
  surface is used, then labels, focus, controls and status feedback remain
  usable. This is an account manager, not a portfolio dashboard or account
  performance drill-down.

### AC7: Layering and verification

- Given the account API, when tests exercise two authenticated users, then
  GET, POST, PATCH and DELETE all enforce user isolation, including
  cross-user ID guesses and concurrent/conflicting writes.
- Given the browser client, when it sends writes to the API, then CORS
  permits only the needed methods from configured frontend origins, with no
  wildcard origin; the public health endpoint remains public and unchanged.
- Given integration and layer checks, when this feature is verified, then
  application use cases use the Feature 003 repository ports, presentation
  contains no business rules, the Feature 005 current-user dependency
  supplies the owner, and broker seeding and case-insensitive uniqueness
  have reversible, PostgreSQL-tested Alembic migrations after separate
  schema/architecture-plan approval. Existing lint, type, coverage and
  frontend checks continue to pass.

## Out of scope

- Broker API integrations, credentials, synchronization or account balances
- Broker creation/edit endpoints or user-submitted broker reference writes
- Account archival and broker reassignment after account creation
- Transactions, import, portfolio metrics, positions, FX conversion, account
  totals and an account dashboard (Phase 4 may use account currency to
  report account-level totals)
- `PATCH /me`, identity linking, user erasure implementation or auth changes
- CI workflow, Compose and AGENTS.md changes (owned elsewhere)
- RED tests, migration and implementation before separate plan approval

## Open questions

None for Gate 1. The approved plan must address safe broker seeding and the
PostgreSQL uniqueness migration, including existing data and concurrency.

## Decisions recorded from Round 1

1. The broker catalog is shared, read-only and initially migration-seeded
   with Tiger and IBKR. Both have `country = "SG"`, meaning the brokerage
   entity jurisdiction for Zack's accounts. An unavailable broker gets a
   clear message, not user-created reference data.
2. HTTP and UI account fields use 003's `name` and `currency` with a
   per-user unique name, uppercase three-letter currency and broker ID.
3. PATCH can change name and currency; broker association is immutable.
4. DELETE rejects accounts with transactions; no archive flow in 006.
5. `/accounts` is linked from the signed-in home screen for account
   management only. The later dashboard and performance views remain out
   of scope.

## Decisions recorded from Round 2

1. Reads return 200; POST returns 201, an account object and `Location`;
   PATCH returns 200 and the updated object; successful DELETE returns 204.
   Malformed/forbidden fields and empty PATCH return 422; missing brokers
   and missing/foreign-owned accounts return 404; duplicates and blocked
   deletes return 409 without leaking persistence internals.
2. Broker and account lists are plain arrays sorted by name then stable ID.
   Broker objects have `id`, `name`, `country`; account objects have `id`,
   `broker_id`, `broker_name`, `name`, `currency`.
3. Account names are trimmed, nonblank and unique per user ignoring case;
   PostgreSQL must enforce that invariant under concurrency in a separately
   approved migration.
4. Account currency defaults in the form to the `/me` base currency, accepts
   any three ASCII letters and is normalized to uppercase. It is an entry
   default, not a transaction-currency restriction. Phase 4 may also use it
   as the account reporting currency for account-level totals; 006 does not
   add FX or totals.

## Gate 1 decision

Zack explicitly approved the full Feature 006 spec at Gate 1 on 2026-11-17.
Architecture planning and task drafting may proceed. The resulting schema/
architecture plan needs separate approval before RED tests, migrations or
implementation.
