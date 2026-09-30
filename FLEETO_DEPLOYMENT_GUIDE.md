# Fleeto Deployment Guide (Railway + Vercel)

This guide deploys the NestJS API and PostgreSQL database on Railway and the
Next.js web application on Vercel. It does not activate the mocked Exotel,
Sarvam STT/TTS, or WhatsApp integrations. Production remains **not ready for
live vendor outreach** until the provider and security launch gates below pass.

**Exotel credential warning:** API credentials were exposed in chat. Revoke and
rotate them in Exotel immediately; do not deploy or reuse those values. No
Exotel credentials are stored in this repository or used by the current mock.

## 1. Before deploying

1. Push the reviewed source to a private GitHub repository. Do not commit
   `.env`, `.env.local`, database URLs, provider credentials, or real vendor data.
2. Run the release checks locally:

   ```bash
   npm --prefix backend test
   npm --prefix backend run build
   npm --prefix frontend run lint
   npm --prefix frontend run build
   ```

3. Confirm `backend/pnpm-lock.yaml` matches `backend/package.json`. The checked-in
   lockfile currently appears out of sync with the manifest; a frozen install
   must pass before Railway can build reproducibly. With the repository's
   configured pnpm/Corepack version, update and commit the lockfile:

   ```bash
   cd backend
   corepack pnpm install --prod=false --config.lockfile=true
   corepack pnpm install --prod=false --config.lockfile=true --frozen-lockfile
   ```

   Review the lockfile diff before committing it. Do not remove the frozen
   install from the Railway build to work around a stale lockfile.
4. Provision production PostgreSQL with backups, TLS, restricted access, and a
   tested restore process. Use a separate production database and app account.
5. Choose the production frontend and API domains. The frontend URL must be an
   HTTPS origin (for example `https://app.example.com`); the API base URL must
   end in `/api` (for example `https://api.example.com/api`).

## 2. Deploy the API and database on Railway

1. Create a Railway project from the GitHub repository and add a PostgreSQL
   service. Keep the database and API service in the same Railway project.
2. Add a service from the same repository. In the service settings set the
   **Root Directory** to `/backend`; Railway will read
   [`backend/railway.json`](./backend/railway.json).
3. Confirm the Railway service uses the checked-in build, pre-deploy migration,
   start command, and `/health/ready` health check. The pre-deploy command
   applies committed Prisma migrations; it does not run the demo seed.
4. Set the following backend service variables. Use Railway's reference picker
   for the database variable instead of copying credentials:

   | Variable | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Reference to the PostgreSQL service's private connection URL |
   | `JWT_ACCESS_SECRET` | Fresh random secret of at least 32 characters |
   | `FRONTEND_URL` | Comma-separated HTTPS frontend origins; include the Vercel production domain |
   | `GEMINI_API_KEY` | Optional; configure only when live Gemini features are approved |
   | `METRICS_TOKEN` | Optional but required to scrape `/metrics`; use a separate high-entropy secret |
   | `ENABLE_API_DOCS` | Leave unset/`false` unless API docs are deliberately enabled and access-restricted |

   Generate secrets locally with `openssl rand -base64 48` and paste them
   directly into Railway's secret fields. Do not paste them into source control
   or chat. Never set the demo seed passwords or run the Prisma demo seed on
   production data.
   
   Do **not** set Exotel API keys or enable live calling yet. Exotel Connect
   Voice AI additionally requires the account SID, approved ExoPhone caller ID,
   and a publicly reachable bidirectional AgentStream WSS endpoint. Fleeto's
   current Socket.IO live-voice gateway is not that AgentStream endpoint, and
   the Exotel provider and callback handler remain mocks. A local
   `EXOTEL_WEBHOOK_SECRET` was generated in ignored `backend/.env`; it is not
   deployed and is not consumed by the current code. Configure a production
   callback secret only after implementing and verifying Exotel's actual
   callback-authentication contract.
5. Generate a Railway public domain or attach your API domain and enable HTTPS.
   The service must listen on Railway's assigned `PORT`; the API binds to
   `0.0.0.0`.
6. Deploy and inspect the build/deploy logs. A successful deploy applies
   `prisma migrate deploy`, starts the API, and must pass the readiness check.
   Verify:

   ```text
   https://<api-domain>/health/live
   https://<api-domain>/health/ready
   ```

   Liveness should return HTTP 200 while the process is running. Readiness
   returns HTTP 200 only when PostgreSQL is reachable; a failed database probe
   returns HTTP 503 without exposing connection details.

## 3. Deploy the web app on Vercel

1. Import the same GitHub repository into Vercel.
2. Set the Vercel project's **Root Directory** to `frontend` and keep the
   detected Next.js framework/build settings.
3. Add `NEXT_PUBLIC_API_URL=https://<api-domain>/api` to the Production
   environment. It is public browser configuration, not a secret.
4. Deploy a preview first. After verifying login and the core workflow, attach
   the production frontend domain and deploy Production.
5. Add the final Vercel production origin to Railway's `FRONTEND_URL`, preserving
   any approved comma-separated origins, and redeploy the API. Do not include
   paths such as `/api` in `FRONTEND_URL`.
6. Confirm API CORS permits the production site and that the browser's
   authenticated requests/cookies work over HTTPS. Keep API and frontend
   domains on the same site where feasible because refresh cookies are
   cross-site sensitive.

## 4. Telemetry and operational checks

- Every HTTP request is logged to the backend's standard output as a structured
  JSON record with request ID, controller, route template, method, status, and
  duration. Request/response bodies, cookies, query values, and authorization
  headers are intentionally excluded.
- Handled live-voice WebSocket events also emit structured outcome and duration
  telemetry. Socket IDs, user IDs, call IDs, tokens, and event payloads are
  intentionally excluded.
- Responses include `x-request-id`; use that value to correlate browser/API
  reports with Railway logs. Caller-supplied IDs are accepted only when they
  contain safe characters and are limited to 128 characters; otherwise a UUID
  is generated.
- `/health/live` is a process liveness probe. `/health/ready` checks PostgreSQL
  readiness and is used as the Railway health check.
- `/metrics` exposes Prometheus HTTP request counters and latency histograms per
  controller, route template, method, and status code, plus WebSocket event
  counters and latency histograms per gateway, event, and outcome. In
  production it returns 404 until `METRICS_TOKEN` is configured, then requires
  `Authorization: Bearer <METRICS_TOKEN>`. Keep the endpoint behind a trusted
  scraper/network policy and configure an external Prometheus-compatible
  collector if metrics retention/alerting is required. Counters are per-process
  and reset on restart; they are not a replacement for a durable collector.
- The admin System Health page reports database availability and marks
  unimplemented voice providers as `MOCKED`, rather than reporting them healthy.
- Exotel credentials must be rotated after the chat disclosure. Do not enable
  outbound calling until a raw bidirectional AgentStream bridge, approved
  caller ID, provider-authenticated callback processing, call-state
  reconciliation, and end-to-end test calls are implemented.
- Swagger is disabled in production unless `ENABLE_API_DOCS=true`; do not enable
  it publicly without a separate access restriction.

## 5. Go-live verification and rollback

Before accepting production data:

- [ ] Confirm a successful database backup and restore rehearsal.
- [ ] Confirm migrations are applied and no demo seed accounts/data exist.
- [ ] Test login, logout/refresh, role restrictions, CORS, and cookie behavior
      using production domains and non-demo accounts.
- [ ] Exercise a requirement-to-quotation workflow with test data and confirm
      audit records and error paths.
- [ ] Review structured logs and verify no secrets, cookies, tokens, or vendor
      PII are present.
- [ ] Configure and test external uptime/alerting for `/health/live` and
      `/health/ready`; configure a protected metrics scraper if needed.
- [ ] Agree on database migration rollback/forward-fix and application rollback
      procedures before the first production release.
- [ ] Keep `VOICE_AGENT_MODE=SIMULATION` and do not start outbound outreach.
      Real Exotel, Sarvam, and WhatsApp integrations, callback authentication,
      consent/opt-out, rate/spend controls, and end-to-end verification remain
      release blockers.

For environment variable definitions and local setup, see
[`FLEETO_ENVIRONMENT_SETUP.md`](./FLEETO_ENVIRONMENT_SETUP.md). See
[`FLEETO_PRODUCTION_READINESS_CHECKLIST.md`](./FLEETO_PRODUCTION_READINESS_CHECKLIST.md)
for the broader launch gates.
