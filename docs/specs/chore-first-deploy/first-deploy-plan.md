# First-deploy decision (deferred)

Issue [#35](https://github.com/donkey-king-kong/tallyhold/issues/35).
Prepared 2026-11-17; updated on Zack's explicit direction. **Execution is
deferred until Phase 4.** This document authorizes no provisioning, provider
configuration, credential access, migration or deployment.

**Target candidates: Cloud Run Tokyo or Render Singapore, decided at Phase 4.**
Neither host, frontend provider nor billing path is selected now. The
[primary-source hosting research](hosting-research.md) is background for that
later decision; its pricing, free-tier limits and terms must be rechecked
at Phase 4. Fly.io is not a candidate for this decision because its Tokyo
trial is not an ongoing free tier.

At Phase 4, scope a new issue and plan for the selected backend and frontend
hosts, environment/secret wiring, Google OAuth client and Supabase provider
configuration, redirect URLs, CORS origins and a real sign-in smoke test.
Obtain Zack's separate cost approvals for potentially billable actions and
keep the existing production migration approval separate. Before admitting
anyone other than Zack, satisfy the
existing [Data API, retention and erasure gates](../../runbooks/erase-user.md).
There is no console checklist or deployment work in this phase.
