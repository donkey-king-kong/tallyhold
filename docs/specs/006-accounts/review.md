# PR #43 Review, Round 1

## Must-fix

None.

## Should-fix

1. `frontend/components/account-manager.tsx:91-107,153-163,291-365` (AC6): If `/brokers` succeeds but `GET /accounts` returns 503, the list enters its unavailable state while the create form remains enabled. A successful POST then builds the displayed list from `previous ?? []` and sets `loadedFor`, so an investor with existing accounts sees only the newly created account as though the list were complete. Keep the list unavailable until a successful reload, or disable creation while its initial read has failed; add a test with existing accounts behind the failed read.

## Nits

None.

CI: `gh pr checks 43` reports backend, frontend and security passing; migration-related jobs are skipped. Reviewed the PR diff against the approved 006 spec/plan/tasks, constitution and conventions.

VERDICT: CHANGES_REQUESTED
