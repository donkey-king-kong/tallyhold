# 005: Authentication and identity architecture plan

## Status and approvals

- [Feature 005 spec](spec.md): Zack approved Gate 1 on 2026-11-17,
  committed at `3e3c79c`; issue [#27](https://github.com/donkey-king-kong/tallyhold/issues/27).
- **Approved by Zack on 2026-11-17** with the final correction that
  unknown-`kid` throttling is per process, not cross-replica. RED is
  authorized; GREEN waits for Zack's RED-checkpoint review.
  [Tasks](tasks.md) preserve that handoff.
- Zack confirmed production Supabase Data API OFF on 2026-11-17, current
  signing key ECC P-256/ES256 via project JWKS, and access-token lifetime 3600
  seconds. An old HS256 key remains listed as previously used; the API rejects
  every HS256 token, even if Supabase still considers it unexpired.

## Trust path and module interfaces

1. Next.js starts Google OAuth with Supabase Auth using PKCE. The callback
   exchanges the one-time code for a session; tokens never go in URLs or logs.
   The browser obtains the Supabase access token and sends it in
   `Authorization: Bearer` to FastAPI with `credentials: "omit"`. Any session
   cookies stay on the Next.js/Supabase side, never authenticate to FastAPI.
2. A FastAPI dependency in the application composition root extracts exactly
   one bearer token, calls an injected identity authentication interface and
   supplies a resolved internal `User` to `GET /api/v1/me`. Feature 006
   imports this top-level dependency, not identity-module internals. No
   route may accept a caller-selected `user_id` or use the Supabase Auth
   UUID as a Tallyhold user ID. Public health stays outside auth. CORS uses
   explicit configured frontend origins and allows only needed GET/preflight
   headers, no wildcard or cookie credentials.
3. `SupabaseJwtVerifier` (identity infrastructure) verifies the signature
   using the configured project's HTTPS JWKS and **only ES256** with an EC
   P-256 public key. Its trusted configuration pins issuer and audience;
   validate `exp`, `role == "authenticated"`, non-empty `sub`, and token
   structure before creating any DB state. Header `kid` selects only a key
   from that pinned JWKS; ignore token-supplied `jku`, `x5u` or URLs. The
   verifier yields an immutable `VerifiedPrincipal(issuer, subject,
   provider?)` after verification, never a raw JWT or untrusted metadata.
   Provider is optional informational data from a verified claim only.
4. `ResolveCurrentUser` (identity application) checks the deny marker before
   lookup, then resolves `(issuer, subject)` to the internal user. Only when
   identity is absent, its identity repository acquires a transaction-scoped
   PostgreSQL advisory lock on the pair, **re-checks the marker and identity
   under the lock**, then creates a `User(id=uuid4(), base_currency="SGD")`
   plus identity in the same caller-owned DB transaction. The existing
   `UserRepository` port remains unchanged. An `IdentityRepository` domain
   interface owns `get`, `link` and a provisioning-serialization operation;
   a `DenyMarkerRepository` interface owns `contains`. SQLAlchemy adapters
   hide the PostgreSQL lock behind that interface. The composition root
   injects them and manages per-request session/commit/rollback;
   application/domain layers import no framework or concrete adapter.
5. `GET /api/v1/me` returns only internal UUID and `base_currency`, with a
   Pydantic response schema in identity presentation. Missing, malformed,
   expired, wrong-role/sub, wrong-project and disallowed-alg tokens return
   generic 401 without provisioning. A JWKS transport outage with no
   trustworthy cached key fails closed (503, no user data). An unknown `kid`
   gets at most one process-wide refresh attempt per 60 seconds; outside
   that window it returns 401 without a fetch. Do not turn key retrieval
   failure into an anonymous user or a shared-secret fallback.

The interface hides key retrieval, claim validation, isolation and first-login
coordination from callers. It does not add a generic auth framework or a
cross-module dependency. Feature 006 consumes only the authenticated internal
UUID through the published current-user dependency, never identity internals.

## Files and layers

| Planned path | Responsibility |
| --- | --- |
| `backend/app/modules/identity/domain/{models,repositories}.py` | Pure `VerifiedPrincipal`/identity value and the two narrow identity/marker ports; preserve the existing `User` and `UserRepository` contract. |
| `backend/app/modules/identity/application/resolve_current_user.py` | Resolve/provision user, enforce deny before lookup and handle concurrent first login without leaking identity existence. |
| `backend/app/modules/identity/infrastructure/{models,repositories,jwt_verifier}.py` | Identity/marker mappings and scoped SQL, advisory locking, pinned JWKS fetch/cache and process-wide ES256 verification. External HTTP lives here. |
| `backend/app/modules/identity/presentation/{router,schemas}.py` | `GET /api/v1/me` response; no verification/business rules in the router. |
| `backend/app/dependencies.py`, `backend/app/main.py`, `backend/app/shared/infrastructure/database.py` | Top-level bearer/current-user composition for 005 and later 006, explicit CORS, router and reusable session factory; keep health public. |
| `backend/alembic/versions/0003_auth_identity.py`, `backend/alembic/env.py` | Additive identity and deny-marker schema, metadata imports and reversible downgrade. |
| `backend/pyproject.toml`, `backend/uv.lock`, `.github/workflows/ci.yml` | Pin asymmetric JWT/HTTP dependencies; run offline token tests plus real PostgreSQL migration tests without Supabase network/keys. |
| `frontend/lib/supabase/{browser,server}.ts`, `frontend/app/auth/callback/route.ts`, `frontend/app/page.tsx`, `frontend/components/{auth-status,current-user}.tsx` | Supabase PKCE/session wiring, sign-in/out states and bearer-only current-user request. Exact file split may remain smaller if tests prefer it. |
| `frontend/package.json`, `frontend/package-lock.json`, `frontend/.env.example`, `backend/.env.example` | Pin Supabase browser/SSR dependencies and document public client URLs/keys versus backend trusted issuer, audience, JWKS URL and frontend origins; no live credentials. |
| `docs/runbooks/erase-user.md`, `README.md` | Verified-request, operator-only erasure and restoration checklist; local auth configuration and startup checks. |
| `backend/tests/{unit,integration}/`, `frontend/**/*.test.tsx` | Offline JWT matrix, first-login/tenant tests, migration/marker checks, UI/callback/error tests. |

## PostgreSQL schema and transaction design

`0003_auth_identity` follows `0002_core_persistence`; do not mutate the
already deployed migration. `identities`: UUID `id` PK, `user_id` UUID NOT
NULL FK to `users.id` (`ON DELETE NO ACTION`), `issuer` and `subject` bounded
NOT NULL strings, nullable informational `provider`, UTC `created_at`, UNIQUE
(`issuer`, `subject`), and index on `user_id` for operator erasure. Do not store
email in this feature: it is not needed for auth and increases erasure scope.
No `provider_subject` column, email unique key or automatic account linking.
`user_id` makes identities user-owned; all ordinary identity reads/writes
start with the verified principal and never accept a client-supplied owner.
For the bootstrap lookup, equality on verified `(issuer, sub)` is the
current-user scope before the internal UUID is known; after resolution,
ordinary user-owned operations use that internal UUID.

`erasure_deny_markers`: `(issuer, subject)` composite PK, `expires_at`
TIMESTAMPTZ NOT NULL and `created_at` TIMESTAMPTZ NOT NULL. This is an
internal, short-lived platform security index, not a user-owned portfolio
table or exposed endpoint: checking it must precede knowing a Tallyhold
`user_id`, so retaining an erased user's UUID/FK here would frustrate
erasure. The only application operation is an existence check by **verified**
`(issuer, sub)`; operators insert and purge rows by runbook. The check denies
while a marker exists, even if its scheduled expiry passed; the operator
purges only after at least 3600 seconds from insertion and after confirming
the project token lifetime remains no longer. A late purge fails closed.
Neither migration has an implicit marker insertion/purge job. The Data API
remains OFF; no RLS claim or policies are added in 005.

`0003` adds only `identities` and `erasure_deny_markers`. Unknown-`kid`
refresh state stays in memory and is shared across all requests and verifier
instances within each API process; it has no database table. A synchronized
claim records each attempt before the network call, including failed
attempts, without holding a lock during HTTP. It must be safe under threads
and concurrent async tasks, and never create one limit per `kid`. Each
separate API replica has its own limit; deployment-wide fetch volume can
grow with the number of replicas.

The service opens one READ COMMITTED transaction for marker check, lookup
and possible creation. Only when no identity exists, the identity adapter
calls `pg_advisory_xact_lock` on the 64-bit key
`hashtextextended(jsonb_build_array(issuer, subject)::text, 0)`; the
runbook uses the **same SQL key derivation** with the verified pair.
Hash collisions only serialize unrelated identities: all decisions still
compare full issuer and subject values. Re-check marker in a **new statement
after acquiring the lock** (READ COMMITTED must observe the operator commit),
then re-check identity before inserting. Save user and identity
inside a savepoint; a unique (`issuer`, `subject`) conflict rolls back the
entire savepoint, including the candidate user, then loads the winner.
Other constraint failures roll back and stay generic. Adapters flush but
do not commit; no orphan user or setting overwrite after concurrent
sign-in. Preserve `NO ACTION` FKs: manual erasure deletes child transactions,
accounts, identity, then user, while shared brokers/instruments remain.
Migration downgrade drops the two new tables without touching 002 tables;
check fresh upgrade -> downgrade -> re-upgrade on disposable PostgreSQL.

The operator erasure runbook derives the same advisory key from the
**verified** issuer/sub and begins its own transaction, takes
`pg_advisory_xact_lock`, inserts/upserts the deny marker with an expiry no
earlier than 3600 seconds after this insertion, then commits **before**
deleting identity/app data and the Supabase Auth user. It need
not pause the API. A first-login holding the lock finishes before marker
insertion and is then deleted; a first-login waiting for the operator's
commit sees the marker on its under-lock re-check and cannot provision.
The runbook records verified request and completion within 30 calendar
days, actual provider backup/log retention and restricted access, safe
retry of partial steps and erasure reapplication after any restore.
Insert and purge remain **manual** steps; test with disposable PostgreSQL
and Supabase Auth test users outside CI before anyone other than Zack is
onboarded. No agent accesses production credentials or performs live
deletion. The lock protocol and marker-as-platform-index are plan-gate
decisions for Zack.

## Key retrieval, configuration and operational failure

Pin the configured issuer, audience and exact project JWKS URL
(`https://<project>.supabase.co/auth/v1/.well-known/jwks.json`); reject
untrusted origins, invalid configuration, symmetric JWKs, non-P-256 keys
and algorithms other than ES256. Only fetch public JWKS over HTTPS in
production. Cache validated public keys for **10 minutes (600 seconds)**
from fetch, with no stale-key use beyond TTL. For an unknown `kid`, atomically
claim the synchronized in-memory limiter before a fetch; only one attempt
across **all `kid` values within one process** is allowed per **60 seconds**.
Rate-limited requests return **401 without a fetch**. The JWKS HTTP timeout is **3
seconds**; a timed-out fetch fails closed (503 when no trusted cached key),
and a successfully fetched JWKS missing that `kid` yields 401. Never fetch
a token-supplied URL. Known keys verify locally within their unexpired
cache without using the unknown-`kid` gate; cache expiry triggers a bounded
normal refresh. The unknown-`kid` path always uses the gate, even if its
local cache has expired; random keys cannot trigger unrestricted normal
refreshes. A newly rotated legitimate key may receive 401 on another
replica until that replica can refresh. No network call is required per
request. Refresh failure
can use only an unexpired trusted cache entry for a known `kid`; otherwise
fail closed. Rotation/revocation response is limited by upstream JWKS edge
caching ([Supabase documents a 10-minute edge cache][jwks-cache]);
emergency response must invalidate backend cache and coordinate upstream key
revocation rather than promise instant rejection of a cached public key.

[jwks-cache]: https://supabase.com/docs/guides/auth/signing-keys#public-key-discovery-and-caching

Use environment-based allow-listed configuration for frontend origin(s),
trusted issuer/audience/JWKS URL, and public Supabase frontend URL and
publishable key. Backend accepts no JWT secret and no HS256 toggle. Enforce
HTTPS/production configuration and never log bearer/refresh tokens, JWKS
responses or credentials. A previously issued HS256 token can be rejected
until the client refreshes or signs in again; this is an intentional security
trade-off, not a reason to broaden the allow-list.

## Verification mapped to acceptance criteria

| Criterion | Behavior to test | Test surface |
| --- | --- | --- |
| AC1 | Google PKCE callback, auth success/failure/cancel, sign-out/expiry, token-free URLs/logs, bearer API fetch | Mocked Next.js Supabase client, callback and browser component tests; no real OAuth in CI |
| AC2 | ES256-valid and expiry, issuer, audience, `sub`, role, alg, signature, key type and `kid` failures; 600s cache expiry, per-process 60s random-`kid` flood cap, 3s timeout, rotation/outage | Offline generated EC P-256 key, minted JWTs/test JWKS, fake HTTP and clock, thread/async-safe limiter across verifier instances in one process, FastAPI 401/503 tests; zero Supabase CI network |
| AC3 | SGD first login, same `(issuer, sub)` on changed email/provider, distinct sub same email, concurrent unique race with no orphan/setting overwrite | Application tests plus disposable migrated PostgreSQL advisory-lock/transaction assertions |
| AC4 | `GET /me` only current UUID/currency, missing token 401, two-user isolation, preflight allowed/denied origins, bearer not cookie, public health | FastAPI TestClient with injected verifier/session, import-linter/mypy and current-user response assertions |
| AC5 | Marker denies before lookup/provisioning, shared-key advisory lock interleaving, manual purge after token lifetime, Data API OFF checkpoint, erasure order/retry/restore and migration reversal | PostgreSQL two-connection test forces marker insertion under lock during first login and proves no re-provisioned user survives; operator walkthrough on disposable data outside CI |

Reuse the Feature 003 disposable PostgreSQL 17 fixture and its strict local
test URL guard; no SQLite substitution or `create_all()`. CI generates key
pairs in memory and intercepts **every** JWKS request; assert no Supabase
network access and no real project keys. Verify full backend ruff, format,
strict mypy, import-linter and pytest >=80%; frontend lint, Prettier, type
check, Vitest and build; migration round-trip and dependency/secret scans.

Test seams: the JWT verifier interface catches signature/claim/cache failures
but not database provisioning; `ResolveCurrentUser` catches mapping,
isolation and lock ordering but not JWT parsing; migrated PostgreSQL
catalog/transactions catch constraints and real concurrency but not Google
OAuth; FastAPI `/me` catches bearer/CORS composition but not the Next.js
session UI; Next.js sign-in/session behavior catches UI and bearer usage but
not live Google OAuth in CI.

## Plan-gate decisions and limitations

Zack approved: ES256-only pinned project JWKS with a 10-minute cache,
one-per-60-second unknown-`kid` refresh limit per process (thread/async-safe,
across all key IDs) and a 3-second fetch timeout; `(issuer, sub)` identity
with an informational nullable provider and no stored email; one identity/user
transaction with conflict savepoint and provisioning-only advisory lock;
`0003`'s two additive tables; a minimal
operator-owned marker that blocks until manually purged after 3600 seconds;
operator marker insertion under the same transaction-scoped advisory lock
before deletion; operator-only erasure with actual
backup/log retention still to be checked; Next.js PKCE/session cookies
isolated from bearer-only FastAPI; and Data API remaining OFF without RLS
claims. No Feature 006 endpoints, self-service erasure or production secret
handling are authorized by this plan. GREEN waits for Zack's RED-checkpoint
review.

The significant API-only identity and isolation trade-off is recorded in
[ADR 0003](../../adr/0003-verified-supabase-identity.md). A change to the
schema, erasure race strategy or trust model returns to Zack for approval.
