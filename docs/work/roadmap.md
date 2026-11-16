# Project roadmap

The [product build phases](../spec.md#build-phases) define scope. This index
tracks delivery and priorities; a future phase is not an approved assignment.
Ticket status and next actions live in the linked tickets, not this table.

| Priority / phase | State | Evidence or next gate |
| --- | --- | --- |
| Phase 0: foundations | Scaffold delivered | [Feature 001](../specs/001-project-scaffold/spec.md), [tasks](../specs/001-project-scaffold/tasks.md), [review](../specs/001-project-scaffold/review.md); PR #4 merged at `6a106a832ed7f57fcf6bf1ce339a53741a8d18f3` |
| Current maintenance | Track through ticket | [T-0001: durable work tracking](tickets/T-0001-durable-work-tracking.md) |
| Current maintenance | Merged | [T-0008: granular Agent Flow role telemetry](tickets/T-0008-agent-flow-granularity.md); PR #12 merged at `fc523cd532a4167ed7afc8dff09f265ddb1fc0a8` |
| Phase 1: core domain | Done | [Feature 002](../specs/002-core-domain/spec.md), [issue #7](https://github.com/donkey-king-kong/tallyhold/issues/7); domain contract PR #18 merged at `cfd22ff4b1c51de54cce3d3a731f27468d3e9451`, implementation PR #21 merged at `272d0a9c0cecbf18f27edc471ce957963cfbaf62` |
| Phase 1: persistence | Done | [Feature 003](../specs/003-schema-repositories/spec.md), [plan](../specs/003-schema-repositories/plan.md), [issue #17](https://github.com/donkey-king-kong/tallyhold/issues/17); PR #23 merged at `d74e1c569e4fc4b371e212cfa43f5d38ebe3b7c3` |
| Production migrations | Workflow merged | [Maintenance scope](../specs/chore-production-migrations/spec.md); PR #25 merged at `ce00ed18120dd22d17c595b836f4dd75dd552129`. Production upgrades remain gated on CI and environment approval; this merge alone does not establish that an upgrade ran. |
| Next: Phase 2, auth and accounts | Spec drafting | Feature 005: authentication and identity; Feature 006: broker account CRUD, dependent on 005. Gate 1 is pending for 005; neither feature has implementation approval. |
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
- 2026-11-13: Zack approved Feature 002 at Gate 1; PR #18 carries the approved
  contract, while implementation still awaits architecture-plan approval.
- 2026-11-13: PR #18 merged the Feature 002 contract. Feature 003 has Gate 1
  approval but remains blocked on approved domain repository interfaces.
- 2026-11-16: PR #21 merged Feature 002 repository ports. Feature 003
  architecture Q1 is resolved; schema/architecture plan awaits Zack's approval.
- 2026-11-16: Zack approved Feature 003 plan/tasks at `15d27fa` as written;
  RED may proceed, then stop for checkpoint review before GREEN.
- 2026-11-16: Feature 002 implementation merged in PR #21, Feature 003 merged
  in PR #23 at `d74e1c5`, and production migration automation merged in
  PR #25 at `ce00ed1`. Phase 1 is complete; Phase 2 spec drafting is next.
