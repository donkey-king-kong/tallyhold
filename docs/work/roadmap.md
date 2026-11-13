# Project roadmap

The [product build phases](../spec.md#build-phases) define scope. This index
tracks delivery and priorities; a future phase is not an approved assignment.
Ticket status and next actions live in the linked tickets, not this table.

| Priority / phase | State | Evidence or next gate |
| --- | --- | --- |
| Phase 0: foundations | Scaffold delivered | [Feature 001](../specs/001-project-scaffold/spec.md), [tasks](../specs/001-project-scaffold/tasks.md), [review](../specs/001-project-scaffold/review.md); PR #4 merged at `6a106a832ed7f57fcf6bf1ce339a53741a8d18f3` |
| Current maintenance | Track through ticket | [T-0001: durable work tracking](tickets/T-0001-durable-work-tracking.md) |
| Current maintenance | Merged | [T-0008: granular Agent Flow role telemetry](tickets/T-0008-agent-flow-granularity.md); PR #12 merged at `fc523cd532a4167ed7afc8dff09f265ddb1fc0a8` |
| Current: phase 1, core domain | Draft at Gate 1 | [Feature 002 Draft](../specs/002-core-domain/spec.md), [issue #7](https://github.com/donkey-king-kong/tallyhold/issues/7), [T-0004](tickets/T-0004-draft-core-domain-spec.md); revise to the current assignment, then await Zack's approval |
| Phase 2: auth and accounts | Future | Depends on core domain foundations; no implementation approval recorded |
| Phase 3: transactions and import | Future | Depends on core domain and authenticated accounts |
| Phase 4: dashboard MVP | Future | Depends on transaction data and valuation; hosting decision remains open |
| Phase 5: expansion | Future | Prioritize after MVP use |
| Phase 6+: additional asset types and integrations | Future | Requires separate feature contracts |

## History

- 2026-11-13: Initialized from the product spec and locally recorded PR #4 merge.
  This is a reconstructed delivery baseline, not a reconstruction of every
  historical agent action. Older evidence remains in Git and feature documents.
  No historical agent identities or unpublished approvals have been inferred.
- 2026-11-13: Feature 002 entered Draft specification and pre-Gate-1 grilling;
  no plan or implementation is authorized.
