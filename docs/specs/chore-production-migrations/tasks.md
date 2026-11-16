# Production Alembic migrations tasks

- [x] Record Zack's maintenance scope in [spec](spec.md), [plan](plan.md),
  issue #24 and T-0018.
- [x] Gate the production upgrade on `main`, all CI jobs and environment
  approval; retain local CI migration round-trip.
- [x] Document the workflow and Supabase integration prerequisite in README.
- [x] Verify the `production` environment approval rule and local checks.
- [ ] Verify PR CI on the pushed branch.
- [ ] Ship the PR with independent review and merge gates.
