# GPT-6 Sol: Agent monitor handoff

## Entry point

Worktree: `/Users/bytedance/Desktop/tallyhold-feature-004-agent-monitor`  
Branch: `feature/004-agent-monitor`  
Issue: [#20](https://github.com/donkey-king-kong/tallyhold/issues/20)  
Requirements: [spec.md](spec.md)  
Assignment: [T-0013](../../work/tickets/T-0013-agent-monitor-spec.md)  
Predecessor session: [R-0015](../../work/runs/R-0015.md)

This is a gated action checklist, not an approved architecture plan. Both
grilling rounds are settled and written-spec Gate 1 is approved.
Architecture-plan approval remains pending. GPT-6 Sol has not been launched or
assigned ownership yet.

## 1. Recover and confirm authority

Read [AGENTS.md](../../../AGENTS.md),
[constitution](../../constitution.md), [product spec](../../spec.md), and
[work tracking](../../work/README.md), then the assignment and its latest run.
Inspect actual Git state before writing; this worktree contains uncommitted
planning artifacts that must be preserved. Do not create a competing worktree
or assume the documents have reached another device.

Record the new session and ownership following work tracking. Read the relevant
role before each role transition. One actor changing roles remains one actor.
Publishing lifecycle events must not imply a subagent was dispatched.

Done when the current owner, working branch, approvals, and exact next action
are verified and recorded.

## 2. Confirm Gate 1

Confirm [spec.md](spec.md) records Zack's 2026-11-16 approval. Treat that
approval as authority for architecture planning only, not approval of an unseen
technical design.

Done when the approved contract and still-pending architecture gate are
reconciled.

## 3. Produce the executable technical plan

After Gate 1, act as [Architect](../../agents/architect.md). Write `plan.md` and
ordered `tasks.md` beside this file, mapping every acceptance criterion to
implementation responsibilities and verification. Choose source location,
dependencies, extension API baseline, and packaging independently of the
portfolio app.

Resolve these evidence-sensitive questions in the plan:

- Stream identity and file-generation handling across switching and replacement.
- Event ordering, repeated reads, reactivation intervals, orphan relationships,
  and ambiguous tool pairing under the unchanged publisher.
- Whether companion snapshots are used, and how races, missing session identity,
  and coarse timestamp precision are handled without claiming certainty.
- Persistent node positions, incremental updates, viewport restoration, and
  keyboard access to a graph that may exceed the viewport.
- Extension host ownership of file access and a restricted, untrusted-data
  webview boundary; local assets, validated messages, and explicit trust policy.
- Bounded resource use and measurable ingest/update targets for representative
  synthetic logs; documented behavior when limits are reached.
- How to verify actual Trae and VS Code compatibility, not just browser rendering.

Consult the `impeccable` skill before UI design. The chosen interaction is
settled in the spec; do not reopen graph versus tree or add a public website.
Keep design documentation scoped to this developer extension.

Done when every criterion has a testable delivery task and Zack has approved
the architecture plan. Stop before tests or implementation if approval is absent.

## 4. Execute approved tasks through TDD

Follow the canonical [TDD skill](../../../.claude/skills/tdd/SKILL.md) with
[Test writer](../../agents/test-writer.md) and
[Implementer](../../agents/implementer.md) role boundaries. Create the task
tickets required by the approved plan. Start each behavior with a failing test,
then implement and refactor.

Use synthetic fixtures, especially for completed-history replay, reactivation,
partial UTF-8 writes, malformed records, duplicate watcher notifications,
replacement/truncation, snapshot conflict, missing parents, and injected markup.
Unit-test data behavior independently of the editor, then verify editor wiring.

Done when all approved tasks pass their acceptance-linked tests and required
checks. Record failures and exact next actions in the assigned tickets.

## 5. Package and prove the result

Run the extension's approved lint, formatting, type, build, coverage, and security
checks, existing adapter tests, and repository checks required by the workflow.
Package a VSIX and inspect its contents for accidental inclusion of private
runtime data. Document repeatable installation and stream-selection steps.

Install and smoke-test the actual VSIX in both editors using synthetic telemetry:
open completed history, append activity, inspect a failure, reactivate an ID,
switch streams, reload, and recover from a read error. Record actual versions
and results. Browser-only checks do not establish extension-host compatibility;
an unavailable editor remains an explicit verification gap.

Done when the VSIX and verification evidence satisfy spec criterion 16.

## 6. Deliver within granted permissions

Give Zack the package, installation instructions, verification summary, remaining
limitations, and exact worktree state. Commit/push only with explicit permission;
the drafting request did not grant it. When Zack requests shipping, follow the
full [ship procedure](../../skills/ship.md), including fresh review and merge
gates. Keep this handoff, work tracking, and private telemetry out of a fresh
Reviewer's input bundle.

Done when the requested delivery is complete and its evidence is recorded.
Do not equate a locally passing build with an approved or merged feature.
