# T-0070: Implement Feature 008 Agent Monitor UI

## Assignment

- Status: in_progress
- Owner actor: R-0070/coordinator
- Role: Implementer / coordinator
- Run: [R-0070](../runs/R-0070.md), after [R-0059](../runs/R-0059.md)
- Feature: [approved spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), [tasks](../../specs/008-agent-monitor-ui/tasks.md)
- Authorization: Zack confirmed RED at `e734489` on 2026-11-18 after resolving the round-2 test defect. No further RED review; GREEN authorized. Stop before PR pending hands-on VSIX smoke.
- Dependencies: [T-0057](T-0057-agent-monitor-ui-red.md), [T-0058](T-0058-review-agent-monitor-ui-red.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested.
- Updated: 2026-11-18T06:01:35Z

## Scope

Implement approved projection fields, protocol validation, presentation,
lane graph and webview. Preserve every RED assertion, 004 behavior, publisher
and source reader. Run all requested checks, audit compatible dev dependency
fixes, package a VSIX and stop for Zack's theme/width/keyboard smoke.

## Acceptance

- [ ] All 34 new RED cases and 77 existing extension tests pass with >=80% coverage.
- [ ] Lint, format, typecheck, build, package, six adapter tests and representative plus 25-agent multi-lane benchmark pass.
- [ ] Compatible npm audit fixes applied where available; remainder recorded.
- [ ] GREEN commits pushed; VSIX path and exact smoke checklist reported. No PR before Zack reports smoke.

## Checkpoint

- Last completed action: `npm ci` succeeded; optional projection/protocol fields implemented and all 32 core/packaging tests, lint, typecheck and format passed.
- Evidence: Zack explicitly confirmed RED `e734489`; dependency install reports 17 high-severity audit advisories pending compatible-fix assessment.
- Worktree state: projection and protocol source plus tasks/tracking modified; no RED assertion changed.
- Remaining work: commit projection slice, implement presentation/graph/shell, full verification, audit and VSIX handoff.
- Blocker / unblock action: none for local GREEN; hands-on smoke is a required stop.
- Next action: commit projection slice; implement pure presentation formatting and run selection.
- Handoff recipient: Zack after packaged VSIX.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T05:59:27Z | R-0070/coordinator | Claimed GREEN after Zack's explicit RED confirmation, on fetched clean `6e5d973` | Implement plan in slices; no reviewer or PR dispatched |
| 2026-11-18T06:01:35Z | R-0070/coordinator | Locked `npm ci` passed with 17 high audit advisories; projection and protocol implementation passes 32 core/packaging tests, lint, typecheck, format | Commit first slice and implement presentation model; assess nonbreaking audit later |
