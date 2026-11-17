# PR #32 review, round 1: Feature 005 auth

CI: `gh pr checks 32` reports backend, frontend and security passing (two runs); production-migrations is skipped. Review evidence is the PR diff and the approved Feature 005 spec/plan/tasks.

## Must-fix

1. `docs/runbooks/erase-user.md:92-95,111-114` — The marker can be purged 3600 seconds after its last upsert, even when Supabase Auth user deletion occurs later. For example, insert the marker at 00:00, let an active session receive a new one-hour access token at 00:20, delete the Auth user at 00:30, and purge at 01:00. That token remains valid until 01:20; `ResolveCurrentUser` then sees neither marker nor identity and provisions a new app user. This breaks AC5's stale-token erasure guarantee. Require the full maximum token lifetime to elapse after the last possible issuance (at least after confirmed Auth deletion), and test/document that delayed-deletion sequence.

2. `frontend/components/auth-status.tsx:58-64,100-112` — A valid `SIGNED_IN`/session-change event updates the token but retains the previous `user` and `"signed-in"` state until the new `/me` fetch completes. When a shared browser switches from user A to user B, A's protected details remain visible under B's session, potentially indefinitely if the request stalls. Clear or segregate the displayed user immediately when the authenticated identity changes, then show the newly resolved user only after the new response; add a deferred-fetch account-switch test. This is contrary to AC1/AC4's protected-data isolation.

## Should-fix

None.

## Nit

None.

VERDICT: CHANGES_REQUESTED
