# 002: Core domain model and calculations tasks

Gate 1 is approved. This pure-Python feature requires no separate plan
approval. Keep the Test writer's RED commit separate, complete each GREEN task
in order, and run all five backend checks after every implementation task.

- [x] **Architecture, Architect:** Write and commit `plan.md` and this ordered
  task list. Map module ownership, public seams, classes, five repository ABCs,
  calculations, purity constraints, and every AC (AC1-AC11).
- [x] **Complete RED contract, Test writer:** Add collecting pytest tests in
  `backend/tests/domain/` covering AC1-AC11.
  Tests must fail inside test execution because public behavior is absent, not
  because of collection or syntax errors. Commit `test: add failing core domain
  contract`.
- [x] **Money and owned entities, Implementer:** Implement shared `Money` plus
  `User`, `Broker`, `Account`, and `Instrument`, including exact Decimal and
  currency/ownership invariants (AC1, AC2, AC9). Run full checks, check off this
  task, and commit `feat: add core domain entities`.
- [x] **Transactions and repository ports, Implementer:** Implement immutable
  BUY/SELL `Transaction`, reject invalid/unsupported trades, and add the five
  pure abstract repository interfaces (AC2, AC9, AC10 and the Feature 003
  dependency). Run full checks, check off this task, and commit
  `feat: add transaction and repository contracts`.
- [x] **Average-cost positions, Implementer:** Implement immutable derived
  `Position`, `RealisedResult`, abstract `CostBasisStrategy`, concrete
  `AverageCostStrategy`, and `derive_positions()` with stable date ordering,
  partial/full sells, oversell rejection, and post-close reset (AC3-AC5). Run
  full checks, check off this task, and commit
  `feat: derive average-cost positions`.
- [x] **Profit, loss, and weights, Implementer:** Implement
  `calculate_realised_pnl()`, `calculate_unrealised_pnl()`, and
  `calculate_portfolio_weights()` with exact Decimal and strict currency
  behavior (AC6-AC9). Run full checks, check off this task, and commit
  `feat: calculate portfolio profit and weights`.
- [ ] **Final verification and ship, coordinator:** Confirm every AC and task,
  all five backend checks, clean domain imports, and no schema/API/external
  scope. Push and run the full ship workflow with a fresh Reviewer; merge only
  if every gate passes.
- [ ] **Feature 003 architecture gate, coordinator / Architect:** After Feature
  002 merges and its worktree is cleaned up, create a separate Feature 003
  worktree and architecture ticket. Write its plan and tasks, then stop for
  Zack's required schema-plan approval before tests or implementation.
