# 005: Google authentication and identity

## Status

Approved at Gate 1 by Zack on 2026-11-17 after the four AC2/AC4/AC5
refinements. Schema and architecture changes still require Zack's plan
approval before RED tests or execution.

Issue: [#27](https://github.com/donkey-king-kong/tallyhold/issues/27).
Phase 2 follows merged Features 002 and 003. Feature 006 broker account CRUD
depends on the authenticated current-user contract delivered here.

## Problem

Phase 1 persists users and user-scoped investment records but cannot identify
an API caller. Investors need Google sign-in and a stable internal user ID
before broker account endpoints can safely operate for multiple users. The
current schema has `users(id, base_currency)` but no `identities` table; the
existing `UserRepository` has no lookup by external identity. Feature 003
deferred the Data API/RLS decision and user deletion to this phase.

## User stories

- As an investor, I want to sign in with Google so my accounts can be tied to
  one persistent Tallyhold user without a separate password.
- As a returning investor, I want the same Supabase Auth user to resolve to
  the same internal user even if my email, provider name or display name changes.
- As an API client, I want a current-user resource and clear unauthorized
  responses so I can send authenticated requests safely.
- As an operator, I want an explicit database access and erasure stance before
  real user data is accepted.

## Acceptance criteria

### AC1: Google sign-in and session use

- Given a signed-out visitor, when they choose Google sign-in in Next.js, then
  Supabase Auth performs the Google OAuth flow and returns an authenticated
  app session; the app does not collect a Google password or issue its own JWT.
- Given a valid session, when the frontend calls a protected `/api/v1` route,
  then it sends the Supabase access token as a bearer token. After sign-out or
  session expiry, protected data is not shown without a new valid session.
- Given a failed, cancelled or expired sign-in, when the visitor returns to the
  app, then a clear signed-out state is shown without exposing credentials or
  provider error internals. Session handling does not expose access or refresh
  tokens in URLs, logs or public responses.

### AC2: FastAPI accepts only verified Supabase access tokens

- Given a valid Supabase-issued access JWT for the configured project, when a
  protected API request arrives, then FastAPI validates its asymmetric
  signature against that project's JWKS, checks a strict asymmetric algorithm
  allow-list, issuer, audience, expiry, `role = "authenticated"` and a
  non-empty `sub`, and uses only the verified `iss` and `sub` claims to
  resolve the internal user, subject to the erasure deny check in AC5.
- Given a missing, expired, forged or otherwise invalid token (including a
  token from a different Supabase project or an attacker-chosen algorithm),
  when a protected route is requested, then it returns 401 without creating
  or exposing user records. Legacy shared-secret HS256, unverified decoding
  and accepting an algorithm named by an untrusted token are forbidden.
- Given a token with an empty or missing `sub`, or `role` other than
  `"authenticated"` (including `anon` and `service_role`), when a protected
  route is requested, then it returns 401 without resolving or provisioning
  a user.
- Given key rotation or temporary key-retrieval failure, when verification
  runs, then an untrusted or unknown key never results in accepted identity;
  verification fails closed. The health endpoint remains public and reveals
  no user data.
- Given the JWT verification tests in CI, when they run, then they use a
  locally generated asymmetric key pair, a test JWKS and locally minted
  valid, expired, wrong-issuer, wrong-audience, wrong-algorithm,
  unknown-`kid` and `anon`-role tokens. CI makes no network calls to
  Supabase and uses no real project signing keys or secrets in the repo.

### AC3: Stable internal identity and first-login provisioning

- Given the first verified Google sign-in, when the identity is resolved, then
  exactly one internal UUID user and one linked identity are stored
  atomically. The user receives `SGD` as the default base currency.
- Given the same verified `(issuer, sub)` on later logins (including changed
  email or provider display), when the identity is resolved, then the same
  internal UUID is returned without overwriting the user's settings.
- Given simultaneous first sign-ins for the same verified `(issuer, sub)`,
  when requests complete, then the unique identity mapping resolves to a
  single user, without orphan users or cross-user linking.
- Given two distinct verified `(issuer, sub)` pairs that share an email, when
  they sign in, then they never merge on email or provider label. Client-
  supplied metadata or a user ID cannot select another user's account.
- Given a previously erased Supabase Auth user is replaced by a new Auth user
  with the same email but a different verified `sub`, when they sign in, then
  no old internal account is automatically recovered or linked.
- Given the `identities` table, when its schema is inspected, then it has a
  unique `(issuer, subject)` pair, a `user_id` foreign key to `users`, and no
  provider/email uniqueness used for authentication. Provider name and
  email, if retained, are informational. Every schema change has a reversible
  Alembic migration and PostgreSQL integration tests.

### AC4: Current-user API and isolation

- Given a valid token and resolved identity, when `GET /api/v1/me` is called,
  then it returns the caller's internal UUID and base currency, using the
  authenticated user context rather than a request-supplied user ID.
- Given no valid token, when `GET /api/v1/me` is called, then it returns 401
  without user details. Given two authenticated users, each receives only
  their own user resource and all later user-owned repository operations
  receive the resolved internal UUID.
- Given a browser request to FastAPI, when CORS is evaluated, then only
  configured frontend origin(s) are allowed, with no wildcard origin when
  credentials are enabled. Protected API routes accept bearer tokens only;
  FastAPI does not authenticate via cookies.
- Given the endpoint and auth wiring, when layer and module checks run, then
  provider calls and signature verification stay in infrastructure,
  application services coordinate identity provisioning through domain
  interfaces, and routers contain no business rules.

### AC5: Data API isolation and operator erasure

- Given the Supabase production project, before access by anyone other than
  Zack, when the Data API setting is inspected, then it is OFF and FastAPI is
  the only application data path; unauthenticated or tenant-A API requests
  cannot read or mutate tenant-B rows. RLS without policies is not claimed
  as protection while the Data API is OFF.
- Operational checkpoint: Zack confirmed the production Data API was turned
  OFF on 2026-11-17; the inspection criterion above remains a deployment gate.
- Given a proposal to re-enable the Data API, when it is reviewed, then it
  remains OFF until real RLS policies and database privileges are tested for
  every exposed user-owned table, including denial of cross-user operations.
  Enabling the Data API is not authorized by Feature 005.
- Given a verified erasure request, when an authorized operator follows the
  documented runbook, then the request and completion are recorded, the
  deny marker is inserted before app identity deletion, and active app-owned
  records (transactions, accounts, identity mappings and the internal user)
  and the corresponding Supabase Auth user are removed within 30
  calendar days of verification, without deleting another user's records or
  shared reference data. The runbook is tested against disposable data before
  anyone other than Zack uses the app; no self-service deletion is exposed.
- Given a failed or interrupted erasure, when the operator resumes the
  documented process, then incomplete work is detectable and safely
  retryable; no partial deletion is represented as completed erasure.
- Given retained Supabase backups or logs, when the runbook is reviewed, then
  it records the actual provider retention/expiry periods, restricts access
  until expiry, and requires reapplying erasure after any restore; it does
  not promise immediate removal from retained copies.
- Given an operator-inserted deny marker for `(issuer, sub)`, when a still-
  valid JWT for that identity is presented, then the backend rejects it
  before identity resolution or auto-provisioning, so erasure cannot be
  undone by a stale token. The marker is a minimal internal security control,
  not an application data endpoint. Its table has a reversible Alembic
  migration and PostgreSQL tests for denial and purge.
- Given the maximum configured access-token lifetime has passed, when the
  operator follows the runbook's purge step, then the minimal marker is
  removed. Feature 005's erasure-specific code provides only the marker
  table and authentication check; marker insertion, purge and all deletion
  actions are operator runbook steps, not erasure application code.

## Out of scope

- Feature 006: broker list and account CRUD, account UI or other user-data
  endpoints beyond `GET /me`
- `PATCH /me`, base-currency editing, display name and cost-basis settings
- Additional sign-in providers, provider linking or account merge
- Transaction/import/dashboard behavior and broker API credentials
- Self-service deletion, erasure endpoints or jobs, and application code to
  insert/purge deny markers or delete app/Supabase Auth users
- Replacing Supabase Auth, sending passwords to FastAPI, or issuing app JWTs
- Production secrets or live settings committed to the repository

## Decisions recorded from Round 1

1. Data API OFF; only FastAPI accesses application data. Real tested RLS
   policies and privileges are prerequisites to any future re-enablement.
   The [product spec](../../spec.md#auth-and-multi-user-design) is updated
   accordingly.
2. Feature 005 has no self-service deletion. A documented, tested operator
   runbook for removing app-owned data and the Supabase Auth user must exist
   before onboarding anyone other than Zack.
3. The first-login base currency is SGD; editing is deferred.
4. The identity key is the verified Supabase JWT `(issuer, sub)`, not Google's
   provider subject. Provider name is informational; neither email nor
   client-supplied metadata is an identity key.
5. Feature 005 provides Google login/logout and minimal `GET /me` only.

## Decisions recorded from Round 2

1. An operator completes verified active-data and Supabase Auth erasure within
   30 calendar days. The runbook documents actual Supabase backup/log
   retention, restricts access until expiry and reapplies erasure after
   restoration. No immediate backup deletion is promised.
2. A minimal `(issuer, sub)` marker rejects stale JWTs before provisioning
   and is purged after the maximum access-token lifetime. Feature 005's
   erasure-specific code contains only the marker table and authentication
   check. Insertion, purge and all deletion actions are documented and
   tested operator steps.

## Open questions

None for Gate 1. Actual provider backup/log retention remains a fact for the
operator runbook to confirm before admitting anyone other than Zack; it
cannot weaken these requirements.

## Pre-planning prerequisite

Zack confirmed the current Supabase signing key is ECC P-256 (ES256) through
the project JWKS and the access-token lifetime is 3600 seconds. A previous
HS256 shared-secret key is still listed as "previously used" for unexpired
tokens; the backend never accepts HS256, even during the transition. The
operator runbook verifies actual Supabase backup/log retention before
admitting another user. No project keys or secrets belong in the repository.

## Gate 1 decision

Zack approved the Feature 005 spec at Gate 1 on 2026-11-17, including the
authenticated-role/sub checks, offline JWKS tests, CORS/bearer rule and
confirmed Data API shutdown. The architecture/schema plan is a separate
approval gate; no RED tests, migrations or implementation are authorized yet.
