# Skills

Shared procedures are in `docs/skills/`; Claude skill entrypoints are in `.claude/skills/`. Trae's project skill wrappers in `.trae/skills/` point to the same canonical files.

| Skill and path | Purpose | When | Role |
| --- | --- | --- | --- |
| [create-pr](create-pr.md) ([Claude wrapper](../../.claude/skills/create-pr/SKILL.md)) | Open a PR using repo checks and template | Before independent review | Agent opening PR |
| [ship](ship.md) ([Claude wrapper](../../.claude/skills/ship/SKILL.md), [Trae wrapper](../../.trae/skills/ship/SKILL.md)) | Coordinate PR, fresh-context review and Zack's merge gate | After implementation and checks | Coordinator; fresh Reviewer subagent |
| [grill-me](../../.claude/skills/grill-me/SKILL.md) ([Trae wrapper](../../.trae/skills/grill-me/SKILL.md)) | Expose unsettled decisions in a Draft spec | Zack requests it before Gate 1 | Zack / Planner on request |
| [tdd](../../.claude/skills/tdd/SKILL.md) ([Trae wrapper](../../.trae/skills/tdd/SKILL.md)) | Test through public seams in RED/GREEN/REFACTOR slices | After approved plan, during implementation | Test writer (RED), Implementer (GREEN/REFACTOR) |
| [improve-codebase-architecture](../../.claude/skills/improve-codebase-architecture/SKILL.md) ([Trae wrapper](../../.trae/skills/improve-codebase-architecture/SKILL.md)) | Read-only deep-module analysis and proposals | On request or at a build phase end | Architect |

Third-party attribution and local changes: [THIRD_PARTY.md](../../.claude/skills/THIRD_PARTY.md).
