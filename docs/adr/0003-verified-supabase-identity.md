# ADR 0003: Verified Supabase identity through FastAPI

Status: accepted with Feature 005 architecture-plan approval on 2026-11-17.

## Context

Feature 003 stores user-scoped records but does not authenticate callers.
Supabase's Data API was ON with RLS enabled but no policies; Zack turned it
OFF on 2026-11-17. The current Supabase Auth key is ES256/P-256 via JWKS,
while a previously used HS256 shared-secret key can still have unexpired
tokens. A deleted Auth user may also leave a briefly valid access token.

## Decision

Use FastAPI as the only application data path. Verify the configured
project's access JWT with its pinned JWKS, ES256 only, and require a verified
issuer, audience, expiry, authenticated role and non-empty Supabase Auth
subject. Map `(issuer, sub)` to the internal Tallyhold user, never Google
subject, email or client metadata. Keep Data API OFF; do not claim RLS
protection until real policies and privileges have been tested before any
future re-enablement.

The operator-owned, short-lived `(issuer, sub)` deny marker is a platform
security index, not a portfolio record: it must be checked before an
internal user ID is known, and must outlive deletion of that user. The
operator inserts it before erasure and manually purges it after the maximum
access-token lifetime. When identity is absent, provisioning takes a
transaction-scoped PostgreSQL advisory lock keyed on the verified
`(issuer, sub)`, then re-checks the marker and identity before inserting.
The operator takes the same lock, inserts and commits the marker in its own
transaction before deleting the identity and user. READ COMMITTED makes
the post-lock re-check see the operator's committed marker. No API pause or
erasure application code is needed.

Cache public JWKS keys for 10 minutes, use a synchronized in-memory limit
for at most one unknown-`kid` fetch per 60 seconds across all key IDs and
concurrent requests **within each process**, and time out JWKS HTTP after
3 seconds. A throttled unknown key returns 401 without a fetch; a fetch
outage with no trusted key fails closed. Separate API replicas have
independent limits; no refresh state or token contents are persisted.

## Alternatives considered

- Keep Data API ON and add RLS to every exposed table: possible later but
  requires tested policies and database privileges before it is safe.
- Key identities by Google's subject or email: neither is the verified
  Supabase Auth user ID used by this backend; email is mutable and can
  join unrelated accounts.
- Accept legacy HS256 during rotation: requires the shared secret in the
  backend and violates the asymmetric-only security contract.
- Retain an internal `user_id` FK on deny markers: the row must survive
  internal-user erasure and be checked before that ID can be resolved.
- Pause all API traffic during erasure: simpler sequencing but interrupts
  unrelated users; the advisory lock serializes only the affected identity.
- Rate-limit unknown JWKS keys per `kid`: random-`kid` requests would
  multiply fetches even within one process.
- Persist a deployment-wide refresh gate: caps all replicas together but
  adds a database table and dependency to a public-key fetch. The approved
  limit is per process instead.

## Consequences

Tenant isolation relies on verified FastAPI request context, scoped
repositories and relational constraints, not an unimplemented RLS policy.
Legacy HS256 sessions must refresh or sign in again. The marker is minimal
personal security metadata with a manual purge obligation; it has no
client endpoint. Provisioning and the runbook must use identical advisory
key derivation and transaction ordering. In-memory throttling must be
thread/async-safe and may allow one fetch per replica per window; migration
0003 adds only identities and deny markers. Any future Data API
exposure, provider linking or self-service erasure needs a separate
approved design.
