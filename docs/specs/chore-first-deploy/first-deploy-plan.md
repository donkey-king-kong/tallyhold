# First-deploy plan (draft, approval required)

Issue [#35](https://github.com/donkey-king-kong/tallyhold/issues/35).
Prepared 2026-11-17. This is a proposal, not permission to provision,
configure providers, read/write secrets, run migrations or admit users.
[Primary-source comparison](hosting-research.md) records provider terms and
links checked on 2026-11-17; recheck them before purchase or deployment.
PR #37 already shipped the migration trigger and parallel Compose ports.

## Decision for Zack

**Provisional:** Cloud Run `asia-northeast1` (Tokyo) for the FastAPI container,
Vercel Hobby for the Next.js frontend *only if* this personal project is
eligible for its non-commercial terms, and the existing Supabase project for
PostgreSQL/Auth after verifying its region, plan and access boundaries.
There is no zero-cost guarantee: Cloud Run needs billing and can charge for
Tokyo outbound traffic, container builds/storage and usage beyond its
monthly allowance. Set billing alerts and an explicit spending decision
before provisioning; alerts are not hard caps. With `min-instances=0`, expect
cold starts. Do not move or recreate the existing Supabase project merely to
match Tokyo without a separate data/auth migration decision.

| API option | Tokyo? | Ongoing free path | Decision |
| --- | --- | --- | --- |
| Cloud Run | Yes, `asia-northeast1` | Request-based monthly free usage; billing and separately priced egress still apply | Preferred for a low-traffic Tokyo pilot |
| Render Free | No; Singapore is the closest listed region | 750 shared free instance-hours/month, sleeps after inactivity | Prototype fallback if Tokyo is flexible; not recommended for production |
| Fly.io | Yes, `nrt` | No ongoing free Machines for new organizations; short trial only | Defer unless paid usage is approved |

Cloud Run quotas/pricing, Render region/free limitations and Fly.io trial
terms are sourced individually in [hosting research](hosting-research.md#fastapi-in-or-near-tokyo).
Vercel Hobby is $0/month for personal non-commercial use, has usage caps and
runs the Next.js callback as server-side code; it is not a blanket free
multi-user commercial service
([source](https://vercel.com/docs/plans/hobby)). If ineligible, pause and
choose an approved paid plan or alternate frontend host, not a silent upgrade.

## Proposed sequence after approval

1. **Preflight:** verify current Supabase project region, plan, JWT issuer,
   ECC P-256/ES256 signing key, 3600-second token lifetime, Data API OFF and
   required GitHub `production` reviewers. Verify the two older pre-PR-#37
   production-migration runs (IDs `44034401827` and `44030569348`) still
   await approval; explicitly decide whether to cancel them before any
   production approval. They were created under the old trigger. Never
   approve them by assuming the new path filter retroactively applies.
2. **Backend:** create a Cloud Run service in Tokyo using the existing
   `backend/Dockerfile`, container port **8000** (its current fixed Uvicorn
   port), HTTPS URL, `min-instances=0` and conservative max instances,
   concurrency and timeout. Grant only needed build/deploy/runtime roles;
   avoid public database access rules broader than necessary. A public API
   is acceptable only with bearer auth on protected routes; health contains
   no user data. Set budgets/alerts, inspect image registry/build and network
   charges, then smoke-test health and 401 without a bearer token. Deployment
   automation and staging/tagged-release behavior need a reviewed follow-up,
   not an ad hoc production push.
3. **Frontend:** connect `frontend/` to Vercel with Next.js preset, production
   domain and HTTPS. Confirm Hobby eligibility, callback server function,
   environment scope, build output and preview protection. Fix a canonical
   production origin before OAuth setup; previews remain isolated until
   separately allowlisted and tested.
4. **Database/migrations:** select a runtime PostgreSQL connection supported
   by the existing Supabase network path (direct or session pooler as
   appropriate), require TLS, and use a least-privileged runtime role rather
   than the schema-owner/migration credential where feasible. Check connection
   counts and Cloud Run scaling. Keep the `SUPABASE_DATABASE_URL` GitHub
   Actions secret separate for approved Alembic upgrades; Supabase's own
   Deploy to production integration remains OFF. A qualifying `main` push
   only queues the environment-protected migration job; Zack reviews the
   exact revision and backup posture before approving it. No schema change
   or migration is part of this draft.
5. **Zack-only smoke:** once approved configuration exists, test the complete
   Google -> Supabase -> frontend PKCE callback -> `GET /api/v1/me` flow
   with Zack's authorized disposable/production test identity as appropriate.
   Confirm a stable internal UUID, wrong/expired bearer 401, rejected foreign
   Origin, clean sign-out, and no token or secret in logs/URL. Record only
   sanitized results in restricted operational records. Do not onboard a
   second user until every gate below passes.

## Configuration map

| Location | Name / value shape | Handling |
| --- | --- | --- |
| Cloud Run runtime | `DATABASE_URL=postgresql+psycopg://...` | Secret manager reference or equivalent trusted runtime secret, not source, build args or browser; TLS and least privilege verified |
| Cloud Run runtime | `SUPABASE_JWT_ISSUER=https://<ref>.supabase.co/auth/v1`; `SUPABASE_JWT_AUDIENCE=authenticated`; `SUPABASE_JWKS_URL=https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` | Trusted configuration, exact project; verifier accepts ES256/P-256 only |
| Cloud Run runtime | `FRONTEND_ORIGINS=https://<canonical-frontend-domain>` | Comma-separated exact origins only if several are approved; no `*`, path, trailing slash or implicit Vercel previews |
| Vercel Production | `NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co`; `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>`; `NEXT_PUBLIC_API_URL=https://<api-domain>` | Public browser/build values, not service-role or Google secret; redeploy after changing build-time public values |
| GitHub `production` environment | `SUPABASE_DATABASE_URL=postgresql+psycopg://...` | Migration credential only; environment reviewers remain required; never echo URL |
| Google Cloud OAuth client | Google client ID and client secret | Enter into Supabase Google provider configuration through an authorized operator; never store in Vercel public variables or repo |

Do not read or write live credentials as part of this plan. Restrict access
to host, Supabase and GitHub secret settings; document owners/rotation and
verify no secret reaches client bundles, build logs or PR checks. The current
`backend/.env.example` and `frontend/.env.example` define names only.

## OAuth redirects and browser boundary

The two redirect hops are distinct ([Supabase Google guide](https://supabase.com/docs/guides/auth/social-login/auth-google),
[redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls)):

1. Create a Google web OAuth client with the correct consent/testing audience
   and authorized JavaScript origins. Its **Authorized redirect URI** is the
   exact Supabase Auth callback shown by the project's provider settings,
   normally `https://<ref>.supabase.co/auth/v1/callback`; it is **not**
   `/auth/callback` on Vercel or the FastAPI URL. Configure that client ID
   and secret in Supabase Auth's Google provider. Restrict test users while
   the consent app is in testing; confirm publication requirements before
   widening its audience.
2. Supabase Auth **Site URL** is the canonical production frontend origin.
   Its **Redirect URLs** allowlist contains the exact
   `https://<frontend-domain>/auth/callback`, plus the exact
   `http://localhost:3000/auth/callback` for local testing and any specifically
   approved additional local port. Avoid production wildcards and unprotected
   preview callbacks. Current client code supplies
   `redirectTo = window.location.origin + "/auth/callback"` and the Next.js
   route exchanges the one-time code for a session; the browser then sends
   a bearer access token to the API with `credentials: "omit"`.
3. CORS is enforced at FastAPI for the frontend's exact HTTPS origin via
   `FRONTEND_ORIGINS`. It allows GET and Authorization/Content-Type; no
   cookie-authenticated API request is introduced. Verify a valid preflight
   and deny another origin. CORS alone does not control who can call the API;
   JWT verification and per-user repository scope do.

**Admission constraint:** as implemented, any valid user of this Supabase
project can be auto-provisioned on `/me`. A public Google button plus enabled
signups is not a Zack-only gate. Before exposure, use an isolated project with
only Zack's Auth identity and an explicitly controlled signup/consent policy
or implement an approved server-side allowlist. Confirm no existing other
Auth users or usable access tokens from this project can bypass the intended
pilot restriction. Do not rely on an obscure URL, CORS, or Google testing mode
alone as a permanent admission control. Any code change for an allowlist
requires its own scoped spec/review.

## Before a second user

- [ ] Zack rechecks production **Data API OFF** in the actual Supabase project
  and records date/evidence privately. FastAPI stays the sole application
  data path; do not equate RLS enabled without tested policies/grants with
  safety. Any Data API re-enable needs a separate tested authorization plan.
- [ ] Record actual backup availability, retention and expiry for the
  project's **current** Supabase plan and any off-site exports, plus
  database/Auth log retention, access controls and restore procedure. Free
  currently has **no automatic database backups or PITR**; its listed
  API/database logs are 1 day and Auth Audit Logs 24 hours, but these are
  not a guarantee of deletion from every provider copy
  ([backups](https://supabase.com/docs/guides/platform/backups),
  [pricing](https://supabase.com/pricing)). Design and test a restricted
  off-site backup/restore path before relying on Free for real data; record
  owner, frequency, encryption and retention, including erasure reapplication.
- [ ] Walk [the operator erasure runbook](../../runbooks/erase-user.md) on
  disposable PostgreSQL and Supabase Auth identities: verify requester,
  insert committed deny marker under the shared advisory lock before
  deletion, remove scoped app data and Auth user, prove stale token denial,
  retry interrupted states and both lock orders, verify delayed token
  issuance and purge only after the last possible token lifetime following
  confirmed Auth deletion, and replay erasures after restore. Record a
  30-calendar-day deadline and restrict retained backups/logs until expiry.
- [ ] Exercise two-user isolation and unauthorized API requests with
  disposable identities, confirm account scoping once Feature 006 exists,
  and review the intended public signup policy. Stop at any missing gate.

## Approval boundary

Zack: approve or amend **Cloud Run Tokyo + conditional Vercel**, cost
exposure/budget, pilot admission control, database backup strategy, and the
handling of older pending migration runs. Approval of this draft is a
prerequisite to a separately tracked execution task; it is not itself an
authorization to inspect secrets, run production migrations or deploy.
