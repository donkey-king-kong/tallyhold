# Track C first-deploy maintenance

Status: approved maintenance scope from Zack's request on 2026-11-17.
Issue: [#35](https://github.com/donkey-king-kong/tallyhold/issues/35).

## Acceptance

1. Only pushes to `main` changing `backend/alembic/**` or
   `backend/app/**/infrastructure/models.py` can schedule production migrations.
   The backend, frontend and security jobs must pass first; production
   environment approval remains mandatory.
2. Compose database and API host ports are configurable, with existing
   loopback bindings and 55432/8000 defaults. Distinct project names allow
   concurrent local worktrees.
3. The README describes the trigger and local port/origin configuration.
4. First-deploy execution is deferred until Phase 4. Cloud Run Tokyo and
   Render Singapore remain candidates; the host is decided then. No hosting,
   provider, secret, database or production deployment action is authorized
   by this scope.
