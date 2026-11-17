# T-0060: Ship first-deploy maintenance

## Assignment

- Status: in_progress
- Owner actor: R-0060/coordinator
- Role: coordinator / DevOps
- Run: [R-0060](../runs/R-0060.md)
- Feature / task: [maintenance scope](../../specs/chore-first-deploy/spec.md)
- Authorization: Zack's explicit Track C implementation and ship request, 2026-11-17
- Dependencies: none
- Branch / worktree: `chore/first-deploy`, `../tallyhold-chore-first-deploy`
- Issue / PR: #35 / pending
- Updated: 2026-11-17T07:01:48Z

## Scope

Restrict production migration triggers, parameterize Compose host ports and
document local use. No live deployment, secret access or schema revisions.

## Acceptance

- [x] Local checks pass; CI pending PR.
- [ ] Independent review approves and ship gate merges PR.

## Checkpoint

- Last completed action: verified migration path detection and alternate Compose ports; full local checks passed.
- Evidence: actionlint; Compose config default/alternate; matching historical migration diff and empty diff; 146 backend tests at 94.73% coverage, 13 frontend tests, lint/format/type/build, audits and gitleaks green.
- Worktree state: uncommitted implementation and tracking.
- Remaining work: commit, push, PR, CI, review and merge.
- Blocker / unblock action: none.
- Next action: commit and push the verified maintenance changes, then open PR.
- Handoff recipient: fresh Reviewer after green CI.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T06:57:27Z | R-0060/coordinator | Claimed Track C on clean `main`, created branch and issue #35 | Validate edits, then commit and ship |
| 2026-11-17T07:01:48Z | R-0060/coordinator | Local checks green; default DB port occupied, alternate 55433 used successfully | Commit and push, then open PR |
