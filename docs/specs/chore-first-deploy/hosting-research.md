# First-deploy hosting research

Research checked 2026-11-17 (UTC). This is source material for the coordinator's
plan, not a hosting decision or authorization to deploy. Prices, quotas, region
capacity, and plan terms should be rechecked before approval and setup. All
links below are first-party documentation or pricing.

## FastAPI in or near Tokyo

| Option | Tokyo and recurring free allowance | Limits and cost caveats |
| --- | --- | --- |
| Google Cloud Run | `asia-northeast1` (Tokyo) is supported and is a Tier 1 pricing region. Request-based services have a **monthly free tier**, measured across projects under a billing account: 180,000 vCPU-seconds, 360,000 GiB-seconds, and 2 million requests. The allowance is applied as a spending discount using Tier 1 prices; it is not a reserved always-on VM. [Locations](https://cloud.google.com/run/docs/locations), [pricing](https://cloud.google.com/run/pricing#services-requests-based-billing) | Billing configuration matters; usage beyond the allowance is charged. Outbound internet transfer and optional networking/build dependencies have separate pricing; the cited 1 GiB internet-transfer allowance is **within North America**, so do not assume it covers Tokyo egress. Keep minimum instances at zero for scale-to-zero economics; warm minimum instances have billable idle time. The separate Google Cloud new-customer **$300/90-day trial credit** is temporary, not the Cloud Run monthly free tier. [Pricing](https://cloud.google.com/run/pricing#pricing-considerations), [minimum-instance billing](https://cloud.google.com/run/pricing#billable-time), [Google Cloud free program](https://cloud.google.com/free/docs/free-cloud-features#free-trial) |
| Render Free web service | Render lists **Singapore**, not Tokyo, among its service regions. A Free Python web service is a recurring free compute plan (0.1 CPU, 512 MB RAM); the workspace receives 750 Free instance hours per calendar month, shared across running Free web services. Spun-down services do not consume these hours. [Regions](https://render.com/docs/regions), [compute plans](https://render.com/docs/compute-plans#web-service-plans), [Free limits](https://render.com/docs/free#free-instance-hours) | Spins down after 15 minutes without inbound traffic and takes about a minute to wake. Free instances are explicitly **not recommended for production**; ephemeral local files are lost on restart/spin-down, free hours exhaustion suspends services, and bandwidth/build usage has separate limits or charges/suspension. Hobby workspace at $0/month does not make paid compute free; select the Free instance explicitly. [Free services](https://render.com/docs/free), [pricing](https://render.com/pricing) |
| Fly.io Machines | `nrt` is a supported Tokyo region. **No ongoing free Machine tier for new organizations** is described in current pricing: Machines are billed by provisioned resources and region, including started and stopped Machine pricing. [Regions](https://fly.io/docs/reference/regions/), [resource pricing](https://fly.io/docs/about/pricing/) | The **free trial**, not a permanent free tier or recurring credit, lasts at most 7 days or 2 aggregate VM-hours, whichever comes first; trial Machines auto-stop after 5 minutes. Apps stop when exhausted unless billing is configured; adding a card ends the trial and starts usage billing. Most organizations require a credit card for continued service. Check the Tokyo selector and actual resource/egress charges before choosing it. [Free trial](https://fly.io/docs/about/free-trial/), [pricing](https://fly.io/docs/about/pricing/) |

For a Tokyo API under a continuing free usage allowance, Cloud Run is the
documented candidate, subject to workload and egress; Render is a Singapore
prototype option with cold starts, and Fly.io is Tokyo-capable but usage-paid
after a short trial. This is an inference from the cited terms, not a cost
guarantee or a measured latency comparison.

## Next.js frontend

Vercel Hobby is **$0/month**, not a temporary credit, for personal,
non-commercial projects. Its monthly included usage includes 100 GB Fast Data
Transfer, 10 GB Fast Origin Transfer, 1 million CDN requests, 1 million
Function invocations, 4 active CPU-hours and 360 GB-hours provisioned memory.
Next.js server behavior can consume Function allowances even when static
content is delivered by the CDN. Hobby generally pauses the affected feature
on exceeding limits until its usage window resets; it is not a promise of
unlimited hosting. Confirm the project's eligibility for Vercel's
non-commercial/personal-use restriction before making it a multi-user public
service. The separate 14-day Pro trial with $20 credits is **not** Hobby's free
tier. [Hobby plan and limits](https://vercel.com/docs/plans/hobby),
[pricing](https://vercel.com/pricing).

## Supabase Google sign-in and redirects

- The Google OAuth **Authorized redirect URI** is the Supabase project's
  callback URL shown on its Google provider settings page (typically
  `https://<project-ref>.supabase.co/auth/v1/callback`), **not** the Vercel
  frontend callback or FastAPI URL. Google Authorized JavaScript origins
  include the app origin; Supabase documents a separate
  `http://127.0.0.1:54321/auth/v1/callback` for local Supabase development.
  The Google client ID/secret are entered in the provider settings, not in
  this note. [Google provider guide](https://supabase.com/docs/guides/auth/social-login/auth-google#configuration)
- After Google returns to Supabase, the application's `redirectTo` must match
  Supabase Auth's **Redirect URLs** allowlist. **Site URL** is the default when
  `redirectTo` is omitted; set it to the canonical production frontend URL,
  and allowlist the exact production callback path. A PKCE/SSR Next.js flow
  needs an app callback route to exchange the code. Add only the local and
  preview URLs actually required; Supabase documents a Vercel preview wildcard
  but recommends exact production paths. Preview deployment protection and
  redirect behavior need a separate smoke test. [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls),
  [Google PKCE callback](https://supabase.com/docs/guides/auth/social-login/auth-google#application-code)

## Supabase data exposure and retention

The product contract makes FastAPI the only application data path and records
the Data API as OFF. Supabase's current [Data API security
guide](https://supabase.com/docs/guides/api/securing-your-api#disable-the-data-api)
says to turn **Enable Data API** off in the Data API integration overview when
REST/GraphQL data endpoints are unused; then autogenerated REST endpoints do
not respond regardless of grants or RLS. This is distinct from disabling
**Automatically expose new tables**. If ever re-enabled, exposed objects need
explicit grants and tested RLS policies; older `public` defaults may grant
`anon` and `authenticated` access. Supabase Auth and direct Postgres access
are separate from the disabled Data API. [Security model and defaults](https://supabase.com/docs/guides/api/securing-your-api),
[local product contract](../../spec.md#auth-and-multi-user-design).

Supabase Free has **no automatic database backups and no PITR**; Supabase
recommends regular `supabase db dump` exports and off-site copies for Free
projects. Paid Pro daily backups are accessible for 7 days, Team for 14 days,
and Enterprise up to 30 days; PITR is a paid add-on. Database backups exclude
Storage API objects. Do not treat Free as a recoverable production backup
service. [Backup documentation](https://supabase.com/docs/guides/platform/backups),
[plan comparison](https://supabase.com/pricing).

Supabase Free pricing lists **1 day of API/database log retention** and
**24 hours of Auth Audit Logs**; Pro lists 7-day logs, Team 28-day logs.
The [logging guide](https://supabase.com/docs/guides/platform/logs) says
retention depends on plan. These are product access/retention windows, not a
guarantee that every provider-side copy disappears at that instant. Free
projects may pause after one week of inactivity. Any future multi-user
erasure/restore runbook must separately account for exported backups and
remaining logs, as required by the [product spec](../../spec.md#auth-and-multi-user-design).
[Supabase pricing](https://supabase.com/pricing).

## Coordinator handoff

Before selecting a host: estimate request CPU/memory and Tokyo outbound
transfer for Cloud Run, check Vercel Hobby eligibility, confirm the actual
Supabase project region and current Data API setting without sharing secrets,
and decide on an off-site backup/restore and erasure procedure. No live
configuration or credential verification was performed in this research.
