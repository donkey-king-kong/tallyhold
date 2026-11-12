---
name: ship
description: Run the full PR, fresh-review and gated-merge workflow when asked to create, open or ship a PR.
---

Follow [the ship procedure](../../../docs/skills/ship.md) end to end. At step 4 delegate to a new [Reviewer subagent](../../agents/reviewer.md) for every round, passing only the PR number, round and feature path. Merge only when every gate passes; Zack merges constitution changes.
