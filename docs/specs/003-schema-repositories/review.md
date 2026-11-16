# PR #23 review

## Round 1

Must-fix: none.

Should-fix:

- `backend/alembic/versions/0002_core_persistence.py:119-121` (AC2, AC4): The transaction `NUMERIC` checks accept PostgreSQL `NaN`. On PostgreSQL 17, `SELECT 'NaN'::numeric(18,8) > 0, 'NaN'::numeric(20,6) > 0, 'NaN'::numeric(20,6) >= 0` returns `t|t|t`. Thus direct SQL can persist a BUY/SELL with `NaN` quantity, price, or fee despite the positive/nonnegative constraints, and subsequent repository hydration can pass that value into portfolio calculations. The adapter's `_exact` guard does not protect direct SQL or future bulk paths. Add database checks excluding `NaN` and direct-SQL regression tests in `backend/tests/integration/test_isolation.py`.

Nits: none.

CI: `gh pr checks 23` reports backend, frontend, and security passing for both listed runs. The same-session replacement check against a disposable PostgreSQL database returned the updated user value; it is not a finding.

VERDICT: CHANGES_REQUESTED
