# Maintenance implementation

1. Add a push-to-main path detection job to CI; make production migrations
   depend on its positive result and existing green checks. Keep the
   `production` environment on the migration job. Dispatches run checks only.
2. Parameterize loopback host ports in Compose and allow the local frontend
   origin to follow an alternate frontend port; retain existing defaults.
3. Document both behaviors in README. Validate positive/negative Git path
   cases, Compose interpolation and the available repository checks.
4. Ship this maintenance PR, then draft a separate first-deploy plan without
   running deployments or accessing secrets.

No schema or application architecture change is planned.
