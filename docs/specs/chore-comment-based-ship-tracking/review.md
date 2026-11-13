# Review round 1

## Must-fix

None.

## Should-fix

None.

## Nits

None.

## Evidence

- `docs/skills/ship.md:35-38` requires the final repository checkpoint before
  review and prohibits lifecycle-only branches after dispatch.
- `docs/skills/ship.md:40-75` keeps Reviewer inputs isolated, records factual
  review checkpoints in PR comments and Agent Flow, and sends a requested-review
  report and its fixes in one push.
- `docs/skills/ship.md:82-100` records merge-gate and completed-merge checkpoints
  in PR comments while retaining all existing merge conditions.
- `docs/work/README.md:115-130` makes PR comments and current GitHub state the
  post-dispatch recovery evidence and requires inspecting both before repeating
  review, CI, or merge operations.
- `docs/agent-flow.md:72-81` labels isolated Reviewer waiting as review work
  after green coordinator CI without inventing Reviewer progress.
- `docs/agents/reviewer.md:1-24` contains no telemetry instructions and retains
  the restricted-input and output contract.
- `gh pr checks 14` reports `backend`, `frontend`, and `security` passing.
- `git diff --check` passes.

VERDICT: APPROVE
