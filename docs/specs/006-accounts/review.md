# PR #43 Review, Round 1

## Must-fix

None.

## Should-fix

1. `frontend/components/account-manager.tsx:91-107,153-163,291-365` (AC6): If `/brokers` succeeds but `GET /accounts` returns 503, the list enters its unavailable state while the create form remains enabled. A successful POST then builds the displayed list from `previous ?? []` and sets `loadedFor`, so an investor with existing accounts sees only the newly created account as though the list were complete. Keep the list unavailable until a successful reload, or disable creation while its initial read has failed; add a test with existing accounts behind the failed read.

## Nits

None.

CI: `gh pr checks 43` reports backend, frontend and security passing; migration-related jobs are skipped. Reviewed the PR diff against the approved 006 spec/plan/tasks, constitution and conventions.

VERDICT: CHANGES_REQUESTED

# PR #43 Review, Round 2

## Prior finding

Resolved. `frontend/components/account-manager.tsx:135-162` reloads the owned
list after a successful create when the initial list was unavailable, and
leaves it unavailable if that reload fails. The existing-account and failed
reload cases are covered at
`frontend/components/account-manager.test.tsx:215-296`.

## Must-fix

None.

## Should-fix

1. `frontend/components/account-manager.tsx:80-87,135-151,393-395` (AC6):
   Creation is enabled while the initial account read is pending. If POST
   succeeds and its follow-up GET returns the complete list before the
   original GET resolves, the original response can then overwrite that
   list and mark it loaded for the same user/token. A stale initial `[]`
   can therefore hide existing and newly created accounts as a true empty
   list. Serialize or invalidate the earlier read when a write begins, or
   disable writes until the initial read completes; test this response order.

## Nits

None.

CI: `gh pr checks 43` reports backend, frontend and security passing;
migration-related jobs are skipped. Reviewed the PR diff against the approved
006 spec/plan/tasks, constitution and conventions.

VERDICT: CHANGES_REQUESTED

# PR #43 Review, Round 3

## Prior findings

Resolved. `frontend/components/account-manager.tsx:110-111,390-394`
prevents creation while the initial account read is pending, including the
late-response order identified in round 2. The response-order test at
`frontend/components/account-manager.test.tsx:297-350` verifies that no POST
starts until the initial list arrives and both the existing and new accounts
remain visible. The round-1 failed-read case remains covered by
`frontend/components/account-manager.tsx:135-162` and
`frontend/components/account-manager.test.tsx:215-296`.

## Must-fix

None.

## Should-fix

None.

## Nits

None.

CI: `gh pr checks 43` reports backend, frontend and security passing;
migration-related jobs are skipped. Reviewed the PR diff against the approved
006 spec/plan/tasks, constitution and conventions. No unresolved findings
remain after round 3.

VERDICT: APPROVE
