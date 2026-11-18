# T-0058: Independent RED review for Agent Monitor UI

## Assignment

- Status: blocked
- Owner actor: R-0056/coordinator
- Role: Coordinator for fresh independent RED Reviewer
- Run: [R-0056](../runs/R-0056.md)
- Feature: [approved spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), [RED evidence](../../specs/008-agent-monitor-ui/red-test-run.md)
- Authorization: Zack approved the architecture plan on 2026-11-18 at `f90265e`. **No constitution rule 15 reviewer/provider cost approvals have been obtained.** Neither that plan nor this RED request authorizes a paid model invocation.
- Dependencies: [T-0057](T-0057-agent-monitor-ui-red.md), [red-review procedure](../../skills/red-review.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested.
- Updated: 2026-11-18T05:17:01Z

## Scope

After Zack separately grants `COST APPROVAL 1/2` and `COST APPROVAL 2/2`,
launch a fresh independent RED Reviewer via headless Claude Code first;
only if unavailable/unauthenticated/failed to launch use a fresh Trae
subagent, subject to the same cost gate. Give the Reviewer only the inputs
per the reviewer role/procedure, not Agent Flow telemetry, private logs,
this ticket or coordinator history. Review one round, fix and use a
**different** fresh reviewer for round 2 if needed. Stop for Zack if round 2
is not APPROVE or findings require changing spec/plan.

## Acceptance

- [ ] Two separate Zack cost approvals recorded before invoking any model.
- [ ] Round 1 fresh reviewer verdict and type recorded externally.
- [ ] Independent APPROVE before GREEN, or hand off required escalation.

## Checkpoint

- Last completed action: pushed RED head `1105aac` with test SHA `1522e5f` and evidence.
- Evidence: 25 new expected RED; 77 existing extension and 6 adapter tests pass; lint/typecheck/format pass. `claude` executable available locally, but it has not been invoked.
- Worktree state: clean at `1105aac` before this checkpoint; reviewer ticket pending commit/push.
- Remaining work: secure both separate cost approvals; then start fresh reviewer round 1.
- Blocker / unblock action: Zack must send `COST APPROVAL 1/2` and, separately, `COST APPROVAL 2/2` for the usage-priced reviewer invocation. No provider action before both.
- Next action: request first explicit cost approval. If received, request the second separately; only then launch the reviewer.
- Handoff recipient: Zack for cost decision, then fresh independent RED Reviewer.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T05:17:01Z | R-0056/coordinator | RED pushed at `1105aac`; reviewer dispatch paused under constitution rule 15 | Ask Zack for the first of two separate cost approvals |
