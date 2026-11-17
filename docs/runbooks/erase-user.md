# Operator erasure: verified Supabase identity

This is an **operator-only** procedure for Feature 005, not an API endpoint or
automation. Use it only after testing the entire sequence with disposable
PostgreSQL and Supabase Auth identities. Never paste credentials, JWTs, email
addresses or production identifiers into tickets, logs or this repository.
Production access and deletion require an authorized human operator.

## Before onboarding another user

- Zack verifies in the **production Supabase project** that the Data API is
  **OFF**, records the date and evidence in restricted operational records,
  and confirms FastAPI is the only application-data path. RLS without tested
  policies and privileges is not a substitute. Do not re-enable the Data API
  under this feature.
- An operator records the actual Supabase backup and log retention/expiry
  periods from the project's current plan, dashboard and provider terms in a
  restricted operational record, with source/date and access controls. These
  periods are **not yet verified**; do not promise immediate removal from
  retained copies. Confirm restoration procedures reapply pending erasures.
- An operator walks this runbook through on disposable PostgreSQL 17 and
  disposable Supabase Auth users, including interrupted steps, stale-token
  denial, both provisioning/marker lock orders and marker purge. Include a
  delayed-deletion case: insert a marker at 00:00, issue a token at 00:20,
  delete Auth at 00:30 and verify the marker still denies at 01:00; do not
  purge before 01:30 when the 3600-second lifetime after confirmed deletion
  has elapsed. Record the result outside this repository. Until these gates
  pass, do not onboard anyone other than Zack.

## Verify and prepare

1. Authenticate and verify the requester through the authorized support
   process; record the request time, verification time, 30-calendar-day
   completion deadline, operator, case ID and approvals in a restricted
   erasure register. A raw email alone is not proof of identity.
2. Obtain the exact trusted JWT issuer and Supabase Auth subject for the
   verified requester through the authenticated account/operator record.
   The subject is the Supabase Auth user ID, **not** Google's provider subject
   or email. Confirm the project matches the configured API issuer. Confirm
   this pair resolves to the expected internal UUID and Supabase Auth user;
   separately review any other identities linked to that internal UUID.
   Stop and escalate any ambiguity or additional mapping before deletion.
3. Confirm the production project's maximum access-token lifetime (approved
   value: 3600 seconds). If it changed, extend the marker lifetime and revisit
   this procedure before proceeding. Arrange restricted access to the app
   database and Supabase Auth admin deletion; never use the public Data API.
   Take the approved backup/restore precautions without expanding access to
   retained copies.

## Block re-provisioning first

In a dedicated database transaction, substitute the **verified** issuer and
subject as bound text parameters (not SQL string concatenation). The lock
expression must match `SqlAlchemyIdentityRepository.serialize_provisioning`
exactly. Inspect the selected `user_id` against the verified record before
committing; stop on a mismatch. Commit the marker **before** deleting anything.

```sql
BEGIN ISOLATION LEVEL READ COMMITTED;
SELECT pg_advisory_xact_lock(
  hashtextextended(
    jsonb_build_array(CAST(:issuer AS text), CAST(:subject AS text))::text, 0
  )
);
SELECT user_id FROM identities
 WHERE issuer = :issuer AND subject = :subject;
INSERT INTO erasure_deny_markers (issuer, subject, expires_at)
VALUES (:issuer, :subject, now() + interval '3600 seconds')
ON CONFLICT (issuer, subject) DO UPDATE
  SET created_at = now(),
      expires_at = GREATEST(
        erasure_deny_markers.expires_at, now() + interval '3600 seconds'
      );
COMMIT;
```

Here `:issuer` and `:subject` stand for driver-bound parameters; use your
SQL client's binding syntax, preserving the exact `jsonb_build_array` inputs
and seed `0`. Confirm a still-valid JWT now returns 401 and cannot create an
identity. A waiting first-login rechecks the marker after this commit; an
earlier first-login completes before the marker and is removed below. Marker
presence denies even after `expires_at` until a deliberate purge.

## Delete and confirm

1. In a new transaction, re-read the identity by the verified pair and
   compare its `user_id` to the recorded UUID. If missing, inspect the prior
   case state rather than selecting by email. Confirm no other identity for
   that `user_id` is linked; stop and escalate if there is one. Confirm the
   marker exists. Delete in FK-safe order, **always scoped to that UUID**:
   `transactions`, `broker_accounts`, `identities`, then `users`. Do not
   delete shared `brokers` or `instruments`. Verify zero remaining rows for
   the UUID and pair before committing. Roll back on any mismatch or error.
   No app deletion may precede the committed deny marker.
2. Delete the corresponding Supabase Auth user by the verified Auth user ID
   with the authorized admin mechanism, then confirm it is absent. Record
   the confirmation time in the restricted case register: this is the
   earliest reliable bound on the last possible token issuance. Do not delete
   by email or provider label. If deletion or confirmation fails, retain the
   marker, record the partial state and retry; never call it complete.
3. Confirm `GET /api/v1/me` with any still-valid token for that pair is
   denied, there is no app user/identity or user-owned transaction/account,
   and the Auth user is absent. Record the completion date and evidence in
   the restricted register within **30 calendar days of verification**.
   Restrict access to retained backups/logs until their verified expiry.

An interrupted run is idempotent at the human checkpoint level: inspect the
marker, app rows and Auth user independently; re-upsert the marker under the
same lock before resuming any app/Auth deletion. Never treat zero app rows as
proof that Auth deletion or retained-copy expiry has occurred. If a backup is
restored, **reapply the marker and all applicable erasures before exposing
restored data**; review the restricted case register against restored records.

## Purge the minimal marker

Only after the Auth user is confirmed deleted, no app identity remains, and
the maximum configured token lifetime has elapsed **after confirmed Auth
deletion** and **after the last marker upsert**, and `expires_at` has passed,
may an authorized operator delete this pair's marker. A token issued shortly
before Auth deletion may remain valid after the marker's original expiry; do
not count from marker insertion alone. Confirm the project token lifetime has
not grown and record the purge separately. If the last possible issuance or
deletion time is uncertain, leave the marker in place: it is a minimal
security control and its existence is fail-closed. Retained backups/logs
remain restricted until their actual provider expiry, independently of the
marker purge.
