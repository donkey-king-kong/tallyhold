---
name: improve-codebase-architecture
description: Analyze architecture for deepening opportunities without code changes. Use when the Architect or Reviewer is asked, or at a build phase end.
disable-model-invocation: true
---

The [constitution](../../../docs/constitution.md) wins over this skill if instructions conflict.

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities**: refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability. This is read-only code analysis for the Architect or Reviewer on request or at the end of a build phase; write findings, not code.

Use the project's domain language and the shared design vocabulary:

- A **module** hides its implementation behind an **interface**; its **depth** is the useful behavior hidden per interface concept. A **seam** is a public test surface, an **adapter** sits behind it; **locality** concentrates related logic, and **leverage** measures how many callers benefit.
- Apply the **deletion test**: would deleting a shallow module concentrate complexity, or merely move it? Two real adapters justify a seam more strongly than one hypothetical adapter.
- Read `GLOSSARY.md` if present and relevant `docs/adr/` decisions. The [product spec](../../../docs/spec.md) defines Tallyhold's layers and modules.

## Process

### 1. Explore

**Scope before you scan: YAGNI.** Prefer the user-named module or pain point; otherwise inspect recent commit history for frequently changed areas. If no hot spot emerges, widen the scan.

Read the relevant code and tests without editing them. Note where understanding a concept requires bouncing between shallow modules, where interfaces expose nearly as much complexity as implementations, where logic leaks across seams, and where tests cannot exercise behavior through a public interface. Apply the deletion test to each candidate. Respect ADRs; flag a real conflict explicitly instead of silently re-litigating it.

### 2. Present candidates in a report

Write `docs/specs/NNN-name/architecture-review.md` for an existing feature, or a Draft `docs/specs/NNN-name/spec.md` proposal for a new architecture feature, using the repo templates. A GitHub issue may link to the report. Do not invent an issue number; obtain one before naming a new feature directory. Record decisions as ADR proposals in the report; an approved significant decision belongs in `docs/adr/NNNN-name.md`.

For each candidate, include files, problem, proposed deepening, testability/locality/leverage benefits, before/after diagram and recommendation strength (`Strong`, `Worth exploring`, `Speculative`). End with one top recommendation and why. Use [report guidance](HTML-REPORT.md) for visual structure without network dependencies.

Do not commit to new interfaces in the analysis; ask Zack which candidate to explore. Findings are proposals, not approval to implement.

### 3. Discuss the chosen candidate

Use [grill-me](../grill-me/SKILL.md)'s decision-tree interview for constraints, dependencies, interface shape and surviving tests when Zack asks to explore one. Record conclusions as proposed acceptance criteria or a GitHub issue for the Planner; don't change code, declare approval or silently rewrite the domain model. Follow [commit cadence](../../../docs/conventions.md#commit-cadence) for reports and proposals.
