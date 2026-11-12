# Tallyhold rules

Follow [AGENTS.md](../../AGENTS.md) and [docs/constitution.md](../../docs/constitution.md) on every task. Before acting as Planner, Architect, Test writer, Implementer, Reviewer or DevOps, read the corresponding file in [docs/agents/](../../docs/agents/).

Every commit and PR must follow [conventions](../../docs/conventions.md). Open PRs using [create-pr](../../docs/skills/create-pr.md).

## Shared skills

Read and follow the canonical skill before using its Trae wrapper:
- [grill-me](../../.claude/skills/grill-me/SKILL.md): on Zack's request, question a Draft feature spec before Gate 1.
- [tdd](../../.claude/skills/tdd/SKILL.md): RED with Test writer; GREEN and REFACTOR with Implementer.
- [improve-codebase-architecture](../../.claude/skills/improve-codebase-architecture/SKILL.md): read-only Architect/Reviewer analysis on request or at phase end.
