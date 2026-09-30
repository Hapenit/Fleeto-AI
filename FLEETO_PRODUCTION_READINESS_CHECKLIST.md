# Fleeto Production Readiness Checklist

This checklist reflects the current repository snapshot and the audit findings in [FLEETO_AUDIT_REPORT.md](./FLEETO_AUDIT_REPORT.md).
For exact local file locations, production secret handling, and the current environment-variable inventory, see [FLEETO_ENVIRONMENT_SETUP.md](./FLEETO_ENVIRONMENT_SETUP.md).

## Production Launch Runbook

For a provider-specific deployment walkthrough, use the
[Railway + Vercel Deployment Guide](./FLEETO_DEPLOYMENT_GUIDE.md). Deployment
configuration does not by itself make this application production-ready or
enable the mocked voice integrations.

### Important: credentials alone do not enable live calling

The current voice integrations are placeholders, not production connectors:

- `ExotelProvider` returns a generated mock call ID and does not contact Exotel.
- `SarvamSTTProvider` and `SarvamTTSProvider` return mock transcript/audio data.
- The conversation provider uses Gemini, but has simulation behavior and needs real provider-path testing.
- There is no WhatsApp Business API sender/webhook integration in the current backend; a vendor WhatsApp phone field is not an integration.

Do not enable outbound vendor calls or represent the app as live until real provider implementations, callback verification, and end-to-end tests are complete. Adding API keys to environment variables will not turn the mock Exotel or Sarvam classes into live integrations.

### Phase 1: Prepare production services

- [ ] Create a managed PostgreSQL database with backups, TLS, restricted network access, and a dedicated least-privilege app user.
- [ ] Choose deployment hosting for the Next.js frontend and NestJS backend; configure HTTPS domains for both.
- [ ] Provision a secrets manager or protected deployment environment variables. Do not put production secrets in source control, frontend variables, logs, or shared chat.
- [ ] Choose and contract the telephony provider (the current code names Exotel) and complete any required Indian business, caller-ID, consent, and outbound-calling approvals.
- [ ] Create provider accounts for Gemini and Sarvam if those providers remain the chosen AI and speech services.
- [ ] If WhatsApp outreach is required, provision an approved WhatsApp Business Platform account, sender number, message templates, and webhook subscription.
- [ ] Decide retention, access, and deletion rules for call recordings, transcripts, vendor contact details, and client shipment data.

### Phase 2: Configure secrets and public URLs

Set these on the backend deployment unless noted otherwise:

| Variable | Required | Purpose / notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Production PostgreSQL connection string; use TLS and a least-privilege DB user. |
| `JWT_ACCESS_SECRET` | Yes | Unique, high-entropy secret used to sign access tokens. Replace the development fallback before deployment. |
| `JWT_REFRESH_SECRET` | Not currently used | Refresh tokens are opaque random values stored hashed in the database; this secret is not read by the current code. |
| `ACCESS_TOKEN_EXPIRES_IN` | Not currently used | Access-token lifetime is currently hardcoded to `15m` in the JWT module. |
| `REFRESH_TOKEN_EXPIRES_IN` | Not currently used | Refresh-token lifetime is currently hardcoded to 7 days in the auth service and cookie. |
| `NODE_ENV` | Yes | Set to `production` for secure cookie behavior. |
| `PORT` | Usually platform-provided | Backend listen port; default is `3001`. |
| `NEXT_PUBLIC_API_URL` | Yes, frontend build/runtime config | Public backend API origin including `/api`, e.g. `https://api.example.com/api`. This is public, not a secret. It is read by the frontend only. |
| `FRONTEND_URL` | Yes for deployed web app | Frontend origin (or comma-separated origins), e.g. `https://app.example.com`; the backend uses it for HTTP CORS and live voice WebSocket origin restrictions. |
| `GEMINI_API_KEY` | If Gemini features are enabled | Server-side key for AI, analysis, and negotiation providers. |
| `CONVERSATION_AI_API_KEY` | Optional | Conversation provider key override; otherwise the conversation provider uses `GEMINI_API_KEY`. |
| `GEMINI_MODEL` | Optional | AI requirement extraction model; defaults in code. |
| `AI_ANALYSIS_MODEL` | Optional | Conversation-analysis model; defaults in code. |
| `AI_NEGOTIATION_MODEL` | Optional | Negotiation model; defaults in code. |
| `VOICE_AGENT_MODE` | Yes for voice environment | Use `SIMULATION` only for tests/demo. A non-simulation value does not make the mock telephony/STT/TTS providers live. |
| `VOICE_WEBHOOK_PUBLIC_URL` | Required for real telephony | Public HTTPS callback URL reachable by the provider. Configure only after a real provider webhook endpoint is implemented and secured. |
| Sarvam credentials/config | Only after integration | No Sarvam environment variables are currently read by the mock STT/TTS providers. Add the actual documented key/base URL variables when implementing the live connector. |
| Telephony credentials/config | Only after integration | No Exotel credentials are currently consumed by the mock provider. Add provider-specific account/key/token values only with a real connector. |
| WhatsApp credentials/config | Only after integration | No WhatsApp provider credentials/webhook variables are currently consumed by the backend. Add them with the approved integration. |

Generate JWT secrets securely in the deployment environment (for example, use a cryptographically secure secret generator); never use the sample or development values. Keep all provider keys backend-only.

### Phase 3: Deploy backend and database

- [ ] Provision the database and verify network/TLS connectivity from the backend runtime.
- [ ] Apply reviewed Prisma migrations to the production database using the deployment migration command (`prisma migrate deploy`); do not use `prisma db push` as the production migration process.
- [ ] Deploy the backend with the production environment variables and HTTPS enabled.
- [ ] Confirm the API health endpoint, database connectivity, authentication, CORS, cookie settings, and WebSocket origin restrictions.
- [ ] Confirm backups and perform a restore rehearsal before accepting live procurement data.

### Phase 4: Complete live provider integrations before activating outreach

- [ ] Implement and test the actual telephony API for outbound calls, status lookup, call termination, and provider error mapping.
- [ ] Implement authenticated/signed telephony webhooks, replay/idempotency protection, call-state reconciliation, and observable failure handling.
- [ ] Implement live Sarvam speech-to-text and text-to-speech connectors using supported audio formats, language/voice selection, timeouts, retries, and rate-limit handling.
- [ ] Implement WhatsApp Business messaging and inbound webhook handling if WhatsApp outreach/replies are in scope; support approved templates, opt-out, delivery status, and idempotency.
- [ ] Verify that a vendor voice note or call audio can be safely captured, transcribed, linked to the correct vendor/requirement, extracted into a normalized quote, and reviewed when confidence is low.
- [ ] Keep human approval in the loop for quotation corrections, top-3 selection, client L1 approval, and final booking until business owners explicitly approve safe automation rules.
- [ ] Ensure a booking is created only after the client-approved price and vendor acceptance are both recorded; preserve the audit trail.
- [ ] Implement trip milestones (pickup/loading, departure, in transit, arrival, unloading, POD, closure) and define how each status is supplied and verified.

### Phase 5: Verify launch gates

- [ ] Run backend build and unit tests, frontend lint and production build, and database migration checks in CI.
- [ ] Run role/permission tests for marketing, sales, operations, admin, and any client-facing users.
- [ ] In a controlled provider test account, verify the complete flow: requirement → eligible vendors → outreach → vendor voice/text quote → normalized comparison → sales/client approval → vendor final acceptance → booking → trip milestones.
- [ ] Test no-answer, busy, invalid number, provider outage, duplicate/replayed webhook, malformed transcript, low-confidence quote, vendor rejection, client rejection, and retry exhaustion.
- [ ] Verify rate limits, spending limits, call windows, consent/opt-out handling, and a kill switch for outbound outreach.
- [ ] Verify monitoring/alerts for API, database, queue (if introduced), AI, telephony, WhatsApp, webhook failures, and unexpected provider spend.
- [ ] Document rollback, incident response, support ownership, and how to stop outbound calls immediately.
- [ ] Enable production outreach gradually with internal test numbers and explicit business sign-off before broad vendor campaigns.

### Example configuration shape (placeholders only)

Use a secret manager or deployment environment, not a committed production `.env` file:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://<app-user>:<password>@<db-host>:5432/<database>?sslmode=require
JWT_ACCESS_SECRET=<generated-secret>
FRONTEND_URL=https://app.example.com
NEXT_PUBLIC_API_URL=https://api.example.com/api
GEMINI_API_KEY=<server-side-provider-key>
VOICE_AGENT_MODE=LIVE
VOICE_WEBHOOK_PUBLIC_URL=https://api.example.com/api/webhooks/telephony/<provider>
```

The `VOICE_AGENT_MODE=LIVE` value above is a deployment intent label only: existing providers only use `SIMULATION` as a simulation check and do not establish that live integrations are selected. Add explicit provider selection and reject startup if live mode is requested while mock providers are configured. Do not configure real vendor phone numbers for testing until that guard and the real connectors exist.

## 1. Architecture & Module Ownership
- [ ] Confirm a single clear module boundary for each of the 16 domains.
- [ ] Ensure no business logic is embedded directly in React components.
- [ ] Ensure controllers do not directly access Prisma or provider SDKs beyond thin orchestration.
- [ ] Keep service logic in domain services, not UI state or DTO layers.
- [ ] Remove duplicated DTOs, enums, and domain models across modules.
- [ ] Validate that dependency flow is: Frontend -> API -> NestJS module -> Service -> Prisma -> PostgreSQL.
- [ ] Confirm vendor eligibility, matching, ranking, negotiation, and procurement modules consume the same canonical data contracts.

## 2. Authentication & Authorization
- [ ] Verify authentication is required for all protected routes.
- [ ] Verify session or JWT lifecycle is clean, revocable, and timeout-based.
- [ ] Confirm admin-only actions are protected by explicit role checks.
- [ ] Confirm user ownership checks exist for user-scoped records.
- [ ] Audit logs must capture auth failures, privileged actions, and state changes.
- [ ] Verify failed login attempts, lockouts, and password hashing are implemented correctly.
- [ ] Enforce least-privilege access for AI config, vendor management, procurement decisions, and admin analytics.

## 3. Validation & API Contracts
- [ ] Validate all DTOs with request validation (`class-validator`/Zod where appropriate).
- [ ] Enforce consistent error payloads across all endpoints.
- [ ] Confirm 400/401/403/404/409/500 responses are consistently mapped.
- [ ] Ensure API responses do not leak internal errors or implementation details.
- [ ] Validate all mutation endpoints require explicit business validation before DB writes.
- [ ] Verify pagination, sorting, filtering, and query limits are applied consistently.

## 4. Prisma & Database Integrity
- [ ] Confirm every domain model is backed by Prisma with correct relations and cascades.
- [ ] Validate uniqueness constraints for identifiers such as vendor codes, requirement numbers, and evaluation numbers.
- [ ] Review all foreign-key relations for proper delete/update behavior.
- [ ] Confirm status enums are used consistently across modules.
- [ ] Ensure reports and analytics read from the canonical DB rather than stale cache or UI-only state.
- [ ] Verify the migration history is consistent with the schema definition.
- [ ] Confirm index coverage supports query paths for vendor eligibility, ranking, follow-up, and call history.

## 5. Eligibility, Matching, Ranking, Quoting
- [ ] Verify eligibility runs produce consistent status outcomes for eligible/ineligible/review cases.
- [ ] Ensure vendor suitability uses concrete requirement fields with conversions (weight, distance, capacity, region, cargo type).
- [ ] Confirm mandatory vs conditional rules are evaluated correctly.
- [ ] Verify `VendorEligibilityRun` and `VendorEligibilityEvaluation` are persisted correctly and counted accurately.
- [ ] Ensure ranking weights are deterministic and versioned.
- [ ] Confirm shortlisted vendors are derived from actual eligible vendors and not stale UI state.
- [ ] Verify quotation lifecycle matches requirement status transitions and procurement flow.
- [ ] Confirm quote comparison logic does not rely on frontend-only values.

## 6. AI & Voice Telephony
- [ ] Validate AI extraction pipeline: UI -> API -> orchestrator -> provider -> persistence -> UI refresh.
- [ ] Confirm AI provider keys are stored in environment config and never hardcoded.
- [ ] Check provider failure handling for retries, fallbacks, and user-visible errors.
- [ ] Verify extracted requirement data is persisted before UI displays it as final.
- [ ] Validate call lifecycle states: queued, initiating, ringing, connected, conversation, completed.
- [ ] Ensure transcripts, logs, and recordings are tied to the correct call and user.
- [ ] Verify webhook/socket events update the database and UI in the same transaction boundary where possible.
- [ ] Validate real-time voice states are resilient to reconnects and dropped events.

## 7. Data Quality & Business Rules
- [ ] Requirement validation must reject incomplete or contradictory transport details.
- [ ] Vendor capacity and cargo capability rules must be enforced with proper unit conversion logic.
- [ ] Ensure call/availability logic distinguishes active, busy, unknown, and disabled vendor states.
- [ ] Validate special handling, loading, unloading, and vehicle body constraints are not ignored.
- [ ] Verify requirement source and AI-assisted flows explicitly preserve traceability and audit history.

## 8. Observability & Operations
- [x] Emit structured HTTP request logs with a correlation ID, controller, route template, status, and latency without logging request bodies or credentials.
- [x] Add liveness and PostgreSQL readiness probes; expose protected Prometheus request counters and latency histograms.
- [ ] Configure centralized log retention, a Prometheus-compatible metrics collector, alert thresholds, and actionable incident notifications.
- [ ] Add health checks for live critical provider integrations after those providers are implemented.
- [x] Include request IDs in HTTP responses and backend request logs.
- [ ] Capture audit logs for procurement decisions, vendor changes, follow-ups, and AI actions.
- [ ] Validate retry and backoff behavior for background jobs and webhook processing.
- [ ] Confirm non-blocking failures degrade gracefully without silently losing work.

## 9. Security & Compliance
- [ ] Remove placeholder/mock provider implementations from production paths.
- [ ] Validate all secrets are externalized via environment config and not committed to source.
- [ ] Ensure CSRF and cookie protections are configured correctly for authenticated web workflows.
- [ ] Check for SQL injection, unsafe query construction, and unsafe input handling.
- [ ] Validate all user-generated content is sanitized/encoded when rendered.
- [ ] Confirm audit trail exists for high-risk operations.
- [ ] Review access control around recordings, follow-up management, and vendor records.

## 10. Frontend Readiness
- [ ] Validate every button and action is backed by real API behavior, not just local UI state.
- [ ] Confirm loading, empty, error, and success states exist on critical flows.
- [ ] Ensure forms do not allow invalid submissions silently.
- [ ] Ensure real-data binding is used instead of hardcoded placeholders in screens.
- [ ] Check route-level access for authenticated/admin-only screens.
- [ ] Confirm realtime UI updates reflect backend state changes consistently.
- [ ] Check bundle, network, and runtime error handling for production builds.

## 11. Release Readiness Gate
- [ ] Backend unit and integration tests pass.
- [ ] Frontend build passes without warnings that block deployment.
- [ ] Linting and formatting are clean.
- [ ] DB migrations have been tested in a disposable environment.
- [ ] Seed and environment setup instructions are documented and reproducible.
- [ ] Production environment variables are explicitly defined and verified.
- [ ] Critical user journeys have been smoke-tested end-to-end.
- [ ] AI and telephony flows have been tested with stubbed and real provider paths.
- [ ] Rollback and incident handling are documented.

## 12. Current Status Against this Repo
- [x] Core project structure exists.
- [x] Backend build and unit tests passed in the latest local validation (9 test files, 28 tests).
- [x] Frontend lint and production build passed in the latest local validation.
- [x] One critical eligibility defect was found and fixed in the current repo.
- [ ] Full end-to-end validation across all 16 modules is still required before production sign-off.
- [ ] Real telephony, Sarvam STT/TTS, and WhatsApp integrations are not implemented by the current mock providers; production credentials alone are insufficient.
- [x] Separate backend CORS allowlist configuration (`FRONTEND_URL`) from frontend API endpoint (`NEXT_PUBLIC_API_URL`).
- [x] Add Railway backend deployment config, production environment validation, database migration pre-deploy, and Vercel deployment instructions.
- [x] Mark unimplemented provider adapters as mocked in the admin health view rather than healthy.
- [x] Load backend `.env` at application startup with dotenv; this does not replace setting secrets in the production hosting platform.
- [ ] AI provider behavior, authentication/RBAC, webhook security, operational safeguards, and real-provider golden path still require explicit validation before production sign-off.
- [ ] Security review, auth policy enforcement, and operational safeguards need explicit confirmation before production launch.

## 13. Recommended Next Actions
1. Complete a targeted security review of auth, AI provider calls, and webhook processing.
2. Validate all 16 modules end-to-end through real requirement flows.
3. Add missing tests for business rule transitions in eligibility, ranking, quote comparison, and procurement decisions.
4. Formalize routing and access policies for admin/customer/vendor roles.
5. Configure and verify external log/metrics retention, alerting, and uptime monitoring before go-live.
