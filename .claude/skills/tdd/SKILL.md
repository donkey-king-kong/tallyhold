---
name: tdd
description: Guide the Test writer and Implementer through red-green-refactor. Use for approved feature work, test-first fixes, or integration tests.
---

The [constitution](../../../docs/constitution.md) wins over this skill if instructions conflict.

# Test-Driven Development

TDD is the red -> green loop, followed by review-stage refactoring. Use the approved `docs/specs/NNN-name/{spec,plan,tasks}.md` and [commit cadence](../../../docs/conventions.md#commit-cadence). The Test writer owns RED; after a committed handoff the Implementer owns GREEN and REFACTOR. They remain separate roles.

When exploring, read `GLOSSARY.md` if present so test names match domain language, and respect relevant `docs/adr/` decisions.

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification: "buying shares updates the derived position" describes a capability and survives internal refactors.

See [tests.md](tests.md) for Python/pytest examples (Vitest for frontend tests) and [mocking.md](mocking.md) for boundary isolation.

## Seams: where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

**Test only at pre-agreed seams.** The approved feature plan must name the public interfaces under test; if it does not, ask Zack to confirm the seams before writing tests. Give each proposed seam a one-line note on what it catches and misses.

Ask: "What's the public interface, and which seams should we test?" Record the answer in `docs/specs/NNN-name/plan.md`.

When the interface itself is in question, ask the Architect to resolve it in the plan before testing.

## Anti-patterns

- **Implementation-coupled**: mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological**: the assertion recomputes the expected value the way the code does (`assert add(a, b) == a + b`), so it passes by construction. Expected values must come from an independent source: a known-good literal, a worked example, the spec.
- **Horizontal slicing**: writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior. Work in **vertical slices**: one test -> one implementation -> repeat. The Test writer and Implementer hand off each slice with separate commits; one agent never absorbs the other's role.

## Rules of the loop

- **Red before green.** The Test writer writes a failing pytest test, verifies it fails for missing behavior, and commits `test: ...` before handing off. The Implementer writes only enough code to pass, commits `feat: ...` or `fix: ...`, and never edits tests to make them pass.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Refactor after green.** At the review stage, the Implementer may make behavior-preserving changes in separate `refactor: ...` commits, keeping tests green. Follow the [reviewer handoff](../../../docs/workflow.md); keep refactoring separate from behavior changes.
