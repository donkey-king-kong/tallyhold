---
name: grill-me
description: Interview Zack to sharpen a Draft feature spec before Gate 1. Use when Zack asks to grill a feature or asks the Planner to do so.
disable-model-invocation: true
---

The [constitution](../../../docs/constitution.md) wins over this skill if instructions conflict.

Before Gate 1, read the Draft `docs/specs/NNN-name/spec.md` and relevant [product spec](../../../docs/spec.md). Zack or the Planner on Zack's request uses this interview to expose unstated decisions.

Map the spec's open decisions as a tree: each decision branches into choices that depend on it. Ask the whole **frontier** (questions whose prerequisites are settled) in one numbered round, each with a recommended answer. Phrase each so "yes" accepts the recommendation. Wait for Zack's answers; recompute the frontier and repeat until no branches remain. Find facts in the repo yourself; ask Zack for decisions, not facts. Do not silently resolve unanswered questions.

Write agreed answers into that feature spec's Open questions and Acceptance criteria as applicable. Leave unresolved decisions under Open questions and Status: Draft. The interview ends when Zack confirms shared understanding; only Zack can approve the spec at Gate 1. Follow [commit cadence](../../../docs/conventions.md#commit-cadence) for any edits.
