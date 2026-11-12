# Third-party skills

- Source: https://github.com/mattpocock/skills
- Upstream commit: `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`
- License: MIT; verbatim notice at [LICENSE](LICENSE).
- Imported folders: `skills/productivity/grill-me`, `skills/engineering/tdd`, `skills/engineering/improve-codebase-architecture`. Names are unchanged.
- Import baseline: commit `7fe1e6e` contains verbatim folders, including OpenAI metadata YAML, and the license. No executable script files were present or copied.

## Local modifications after the import baseline

- `grill-me/SKILL.md`: replaced the external `grilling` skill call with its decision-tree/frontier interview method; constrained it to Draft specs before Gate 1, recorded answers in the feature spec, retained Zack's approval authority, and added constitution/commit links.
- `tdd/SKILL.md`: clarified the Test writer RED and Implementer GREEN/REFACTOR handoff, approved seam selection and separate Conventional Commits; added constitution/repo links and Python/pytest guidance.
- `tdd/tests.md`: translated TypeScript/Jest examples to illustrative Python/pytest examples using Decimal; noted Vitest for frontend tests.
- `tdd/mocking.md`: translated TypeScript examples to Python domain-interface/provider examples with infrastructure boundaries.
- `improve-codebase-architecture/SKILL.md`: made its vocabulary self-contained, removed dependencies on other upstream skills and sub-agent requirements, limited use to read-only Architect/Reviewer analysis, and routed reports/proposals into `docs/specs/` and decisions through `docs/adr/`.
- `improve-codebase-architecture/HTML-REPORT.md`: replaced temporary HTML/CDN JavaScript scaffolding with repository Markdown and Mermaid guidance; retained before/after diagrams, candidate strengths and a top recommendation.

The `agents/openai.yaml` files and the MIT notice are unchanged upstream copies. Trae discovery wrappers live in `.trae/skills/` and point to these canonical Claude skill files; they are local integration files, not upstream copies.
