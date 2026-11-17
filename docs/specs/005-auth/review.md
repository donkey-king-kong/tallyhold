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

# PR #32 review, round 2: Feature 005 auth

CI: `gh pr checks 32` reports backend, frontend and security passing (two runs); production-migrations is skipped. Reviewed the PR diff against the approved spec, plan, tasks, constitution and conventions.

## Prior findings

1. **Resolved** (`docs/runbooks/erase-user.md:21-27,95-100,114-124`): The disposable walkthrough includes delayed Auth deletion and a token issued after marker insertion. Purge now requires the full maximum token lifetime after confirmed Auth deletion and the last marker upsert, plus elapsed `expires_at`; uncertain issuance leaves the marker in place. The marker check continues to deny until manual purge (`backend/app/modules/identity/infrastructure/repositories.py:94-103`).
2. **Resolved** (`frontend/components/auth-status.tsx:59-65,104-115`; `frontend/components/auth-status.test.tsx:148-198`): Auth changes abort the outstanding request and clear the prior user and signed-in display before fetching `/me` for the new token. The deferred-fetch account-switch test verifies the old currency is hidden until the new response arrives.

## Must-fix

None.

## Should-fix

None.

## Nit

None.

VERDICT: APPROVE
