# T-0060: Ship first-deploy maintenance

## Assignment

- Status: in_review
- Owner actor: R-0060/coordinator
- Role: coordinator / DevOps
- Run: [R-0060](../runs/R-0060.md)
- Feature / task: [maintenance scope](../../specs/chore-first-deploy/spec.md)
- Authorization: Zack's explicit Track C implementation and ship request, 2026-11-17
- Dependencies: none
- Branch / worktree: `chore/first-deploy`, `../tallyhold-chore-first-deploy`
- Issue / PR: #35 / [#37](https://github.com/donkey-king-kong/tallyhold/pull/37)
- Updated: 2026-11-17T07:03:52Z

## Scope

Restrict production migration triggers, parameterize Compose host ports and
document local use. No live deployment, secret access or schema revisions.

## Acceptance

- [x] Local checks and PR CI pass.
- [ ] Independent review approves and ship gate merges PR.

## Checkpoint

- Last completed action: pushed `121b70d`, opened assigned PR #37; backend/frontend/security CI green, migration jobs skipped on PR.
- Evidence: PR #37 at `121b70d1d4e8a2b7626f574874d7c6a60eea260d`; local actionlint, Compose, path cases, 146 backend tests at 94.73% coverage, 13 frontend tests, lint/format/type/build, audits and gitleaks green.
- Worktree state: pre-review tracking checkpoint pending commit.
- Remaining work: push checkpoint, confirm new-head CI, fresh review and merge gate.
- Blocker / unblock action: none.
- Next action: commit/push this checkpoint, wait for CI at new head, freeze tracking and dispatch fresh Reviewer on PR #37.
- Handoff recipient: fresh Reviewer after green CI.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T06:57:27Z | R-0060/coordinator | Claimed Track C on clean `main`, created branch and issue #35 | Validate edits, then commit and ship |
| 2026-11-17T07:01:48Z | R-0060/coordinator | Local checks green; default DB port occupied, alternate 55433 used successfully | Commit and push, then open PR |
| 2026-11-17T07:03:52Z | R-0060/coordinator | PR #37 opened at `121b70d`, assignee verified; CI green, migration jobs skipped | Push final checkpoint and dispatch fresh review after new-head CI |
