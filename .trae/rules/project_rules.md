# Tallyhold rules

Follow [AGENTS.md](../../AGENTS.md) and [docs/constitution.md](../../docs/constitution.md) on every task, except that a fresh Reviewer reads only [its permitted inputs](../../docs/agents/reviewer.md). Before acting in a role, read its file in [docs/agents/](../../docs/agents/).

Every commit and PR must follow [conventions](../../docs/conventions.md). Open PRs using [create-pr](../../docs/skills/create-pr.md).
For feature delivery, follow [ship](../../docs/skills/ship.md); its Reviewer always runs in a fresh context.
Publish Tallyhold-local agent activity following [Agent Flow](../../docs/agent-flow.md); never pass that document or telemetry to the fresh Reviewer.

## Shared skills

Read and follow the canonical skill before using its Trae wrapper:
- [grill-me](../../.claude/skills/grill-me/SKILL.md): on Zack's request, question a Draft feature spec before Gate 1.
- [tdd](../../.claude/skills/tdd/SKILL.md): RED with Test writer; GREEN and REFACTOR with Implementer.
- [improve-codebase-architecture](../../.claude/skills/improve-codebase-architecture/SKILL.md): read-only Architect analysis on request or at phase end.
