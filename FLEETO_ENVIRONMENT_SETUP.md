# Fleeto Environment Variables and Secrets Setup

This guide identifies where to create local environment files, where production secrets belong, which values the current code reads, and which provider settings are future-only. It is based on the environment reads currently present in this repository.

For the step-by-step Railway + Vercel deployment and operational verification
runbook, see [`FLEETO_DEPLOYMENT_GUIDE.md`](./FLEETO_DEPLOYMENT_GUIDE.md).

> **Important:** API keys do not activate integrations that are still mocks. Sarvam STT/TTS and Exotel calling are currently mock implementations; WhatsApp integration is not implemented. Do not send real vendor calls or claim a live provider connection until those adapters and their webhook flows are implemented and tested.

> **Credential incident:** Exotel API credentials were shared in chat. Treat
> them as compromised: revoke/rotate them in Exotel immediately and do not copy
> the old values into local files or hosting secrets. This repository does not
> use those credentials.

## 1. Which files to create

### Local development

Create two separate files:

1. Backend: copy [`backend/.env.example`](./backend/.env.example) to `backend/.env`.
2. Frontend: copy [`frontend/.env.example`](./frontend/.env.example) to `frontend/.env.local`.

Run these commands from the project root:

```bash
cp -n backend/.env.example backend/.env
cp -n frontend/.env.example frontend/.env.local
```

The `-n` option avoids replacing an existing file. Edit the new local files with your own local database credentials and settings. Do not replace an existing `backend/.env`; it may contain local configuration. The backend loads its `.env` at startup, and the frontend loads `.env.local` through Next.js.

Files named `.env` and `.env.local` are ignored by Git. The checked-in `.env.example` files contain placeholders only and are safe templates.

Start both applications from the project root:

```bash
npm run dev:all
```

The frontend should be available on port `3000` and the backend on port `3001`. If port `3000` is already occupied by another Next.js process, stop that existing process before running the combined command.

### Production deployment

Do **not** deploy a committed `.env` file. Add environment values using the deployment provider's encrypted environment-variable/secret settings:

- Backend variables belong in the backend service's runtime environment/secrets panel.
- `NEXT_PUBLIC_API_URL` belongs in the frontend service's build/runtime environment because Next.js embeds `NEXT_PUBLIC_*` values into browser code.
- Database credentials belong in the backend service secret store and, when required, the migration job environment.
- Keep production and staging secrets separate.

If the platform supports secret references (for example, linking a managed database URL to the backend service), prefer that over manually copying credentials.

## 2. Current application variables

### Backend

| Variable | Required / default | What it is for | Where to create or obtain it |
| --- | --- | --- | --- |
| `DATABASE_URL` | Required | Prisma/PostgreSQL connection URL. Use a dedicated database and least-privilege application account. | Local PostgreSQL credentials locally; managed database service connection details for deployment. Require TLS for remote production connections. |
| `JWT_ACCESS_SECRET` | Required for secure deployment; code currently has an insecure development fallback | Signs access JWTs for HTTP and WebSocket authentication. | Generate a unique random secret locally or in the deployment secret manager. Never use the fallback in production. |
| `NODE_ENV` | Optional locally; set `production` in production | Controls secure flags on refresh-token cookies. | Set as a plain environment value in the backend runtime. |
| `PORT` | Optional; defaults to `3001` | HTTP server port. | Usually supplied by the hosting platform; use `3001` locally. |
| `METRICS_TOKEN` | Optional locally; required to scrape metrics in production | Protects the Prometheus `/metrics` endpoint with a bearer token. In production, the endpoint returns 404 when unset. | Generate a unique secret and store it in the backend secret manager. |
| `ENABLE_API_DOCS` | Optional; defaults to disabled in production | Enables the unauthenticated Swagger docs endpoint at `/api/docs` when explicitly set to `true`. Do not enable publicly without access restriction. | Set only when docs access is protected by a trusted proxy or equivalent control. |
| `FRONTEND_URL` | Optional; defaults to `http://localhost:3000` | Comma-separated allowed frontend origins for backend HTTP CORS and live-voice WebSocket CORS. Use origins only, no API path. | Your deployed frontend URL, such as `https://app.example.com`; use local default for development. |
| `GEMINI_API_KEY` | Optional for simulation; required for live Gemini features | Server-side Gemini key for requirement extraction, analysis, negotiation, and as the default conversation-provider key. | Create an API key in Google AI Studio or the Google Cloud configuration chosen for your Gemini account. Restrict/monitor it where available. |
| `CONVERSATION_AI_API_KEY` | Optional | Overrides `GEMINI_API_KEY` for the voice conversation provider. | Use a server-side Gemini key if you need a separate key; otherwise leave blank. |
| `GEMINI_MODEL` | Optional; code defaults to `gemini-2.5-flash` | Model selection for AI requirement extraction. | Plain configuration value; use a model enabled for your provider account. |
| `AI_ANALYSIS_MODEL` | Optional; code defaults to `gemini-2.5-flash` | Model selection for conversation analysis. | Plain configuration value; use a model enabled for your provider account. |
| `AI_NEGOTIATION_MODEL` | Optional; code defaults to `gemini-2.5-flash` | Model selection for negotiation generation. | Plain configuration value; use a model enabled for your provider account. |
| `VOICE_AGENT_MODE` | Optional; use `SIMULATION` for local/test operation | Conversation and AI analysis code check this flag to select simulation paths. This flag does not select real telephony or speech providers. | Set `SIMULATION` locally. Do not treat another value as proof that the full live voice stack is enabled. |
| `VOICE_WEBHOOK_PUBLIC_URL` | Optional; defaults to a localhost Exotel-looking URL | URL passed to the telephony provider when initiating a call. | A public HTTPS backend callback URL, only after a real telephony adapter and secured webhook route exist. Current Exotel provider is mock. |
| `EXOTEL_API_KEY` | Not currently read | Exotel API username for HTTP Basic authentication once the live connector is implemented. | Create a rotated API key in Exotel and store it only in the backend secret manager. |
| `EXOTEL_API_TOKEN` | Not currently read | Exotel API password/token for HTTP Basic authentication once the live connector is implemented. | Rotate the exposed token in Exotel and store the replacement only in the backend secret manager. |
| `EXOTEL_ACCOUNT_SID` | Not currently read | Account SID in the Exotel Connect Voice AI API path; do not assume a generic “SSID” is this account identifier. | Copy the Account SID shown in the Exotel account/API settings. |
| `EXOTEL_WEBHOOK_SECRET` | Not currently read | Reserved for authenticating callbacks after the exact Exotel callback signing contract and webhook route are implemented. A random local value has been created in ignored `backend/.env`; it is not deployed or currently used. | For production, create a distinct secret in the backend secret manager only after callback verification is implemented and tested. |
| `ADMIN_PASSWORD` | Optional for seed only; seed currently defaults to a weak password | Password assigned to demo admin when running the Prisma seed. | Set a unique strong value in a disposable local/test environment before seeding. Do not run the demo seed in production. |
| `MARKETING_PASSWORD` | Optional for seed only; seed currently defaults to a weak password | Password assigned to demo marketing user when running the Prisma seed. | Set a unique strong value in a disposable local/test environment before seeding. Do not run the demo seed in production. |

`DATABASE_URL` is also read by Prisma from [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma). Seed passwords are read by [`backend/prisma/seed.ts`](./backend/prisma/seed.ts).

### Frontend

| Variable | Required / default | What it is for | Where to create or obtain it |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Optional; defaults to `http://localhost:3001/api` | Public API base URL used by the browser application. Include `/api`. | Set in `frontend/.env.local` locally and in the frontend hosting service's build environment in deployment. It is **not a secret** and must never contain a password, token, or API key. |

## 3. Generate secrets safely

For local development, generate a fresh access-token signing secret in a terminal:

```bash
openssl rand -base64 48
```

Copy the generated output directly into `JWT_ACCESS_SECRET` in `backend/.env`. Generate a different value for each environment. Never paste the output into chat, source files, screenshots, or logs.

The current authentication code uses only `JWT_ACCESS_SECRET` for signing and validation. Refresh tokens are random opaque values stored hashed in the database; `JWT_REFRESH_SECRET` is not currently read. Likewise, `ACCESS_TOKEN_EXPIRES_IN` and `REFRESH_TOKEN_EXPIRES_IN` are not currently read: access token expiry is configured in code as 15 minutes, while refresh token expiry is set in code as 7 days. Do not expect adding those three variables to change behavior until code is updated.

## 4. Example local templates

### `backend/.env`

Start from `backend/.env.example` and fill in local values. Example shape:

```env
DATABASE_URL="postgresql://fleeto_user:local-password@localhost:5432/fleeto?schema=public"
JWT_ACCESS_SECRET="<paste-a-newly-generated-random-secret>"
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
GEMINI_API_KEY=""
CONVERSATION_AI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
AI_ANALYSIS_MODEL="gemini-2.5-flash"
AI_NEGOTIATION_MODEL="gemini-2.5-flash"
VOICE_AGENT_MODE="SIMULATION"
VOICE_WEBHOOK_PUBLIC_URL="http://localhost:3001/api/webhooks/telephony/exotel"
ADMIN_PASSWORD="<unique-local-seed-password>"
MARKETING_PASSWORD="<different-local-seed-password>"
```

The webhook URL above is only a placeholder while the telephony implementation is a mock.

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

## 5. Production values and secret locations

Before production, create/provision these resources:

1. **PostgreSQL**: create a production database, a least-privilege application user, TLS/network restrictions, backups, and a tested restore procedure. Put its connection URL into the backend runtime secret named `DATABASE_URL`.
2. **JWT signing secret**: generate a unique high-entropy value for production and put it into the backend secret named `JWT_ACCESS_SECRET`. Do not use any local/dev fallback.
3. **Gemini** (if the AI functions are enabled): create/restrict/monitor a server-side API key in the appropriate Google AI Studio or Cloud account and put it in backend secret `GEMINI_API_KEY`. Optionally use a separate key in `CONVERSATION_AI_API_KEY`.
4. **Frontend/backend origins**: set backend `FRONTEND_URL` to the browser frontend origin(s), e.g. `https://app.example.com`; set frontend `NEXT_PUBLIC_API_URL` to the API base, e.g. `https://api.example.com/api`. These values are URLs, not secrets.
5. **Telephony**: rotate any credentials exposed in chat, then obtain the Exotel Account SID, approved ExoPhone caller ID, regional API host, and a compatible bidirectional AgentStream WebSocket URL. The current Exotel class does not consume credentials or make calls. The existing live-voice gateway is Socket.IO, not Exotel's raw AgentStream WebSocket protocol; implement and test that bridge and the provider's documented callback-signature contract before adding production telephony secrets.
6. **Sarvam**: obtain the API key/account access and supported service/model settings from Sarvam for the selected speech services. The current Sarvam classes are mocks and do not read any Sarvam variables. Add names and validation only alongside implementing the connector; do not put assumed variable names into production and expect them to work.
7. **WhatsApp** (if required): provision Meta WhatsApp Business Platform access, sender number, approved templates, webhook subscription, and application credentials. The repository currently has no WhatsApp sender or inbound webhook integration.
8. **Public callback address**: configure `VOICE_WEBHOOK_PUBLIC_URL` only after the real telephony webhook route exists, is HTTPS-reachable, authenticates provider callbacks, and is tested for replay/idempotency.
9. **Telemetry**: backend HTTP requests emit structured JSON logs with a response `x-request-id`; `/health/live` and database-dependent `/health/ready` support platform probes. Configure `METRICS_TOKEN` before scraping `/metrics` in production. The built-in counters are process-local; use an external Prometheus-compatible collector for retention and alerting.

Do not run the demo Prisma seed in a production database: it creates default demo accounts and demo procurement data. The seed currently has weak fallback passwords if its variables are not set; production seeding needs a separate reviewed process.

## 6. Future provider variables are not active today

The following are reasonable categories of credentials/configuration to provision when implementation begins, but **the current code does not read them**:

```env
# Not active until a Sarvam STT/TTS adapter is implemented
SARVAM_API_KEY=
SARVAM_BASE_URL=
SARVAM_STT_MODEL=
SARVAM_TTS_MODEL=

# Not active until a real Exotel AgentStream adapter and verified webhook exist.
# Do not reuse the Exotel credentials shared in chat; revoke and rotate them.
EXOTEL_ACCOUNT_SID=
EXOTEL_API_KEY=
EXOTEL_API_TOKEN=
EXOTEL_WEBHOOK_SECRET=

# Not active until WhatsApp Business integration is implemented
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
```

These are illustrative names only. Confirm the official provider API's required credential names and security scheme during implementation. Do not add them to deployment as if they were already wired.

## 7. Current gaps and go-live blockers

- Sarvam STT/TTS classes currently return mock output and do not make network requests.
- Exotel provider currently returns a generated mock call ID and does not make outbound calls or verify callbacks.
- No WhatsApp Business sending, reply parsing, or webhook integration is currently present.
- `VOICE_AGENT_MODE` only affects selected AI simulation branches; it does not switch the mock telephony/Sarvam providers to live providers.
- `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, and `REFRESH_TOKEN_EXPIRES_IN` are currently unused environment variables.
- The seed script has weak default passwords; do not use it for production.
- Real-provider golden-path, security, monitoring, consent/opt-out, spending controls, and incident/kill-switch checks are required before enabling outreach.

## 8. Safe handling checklist

- [ ] Keep `.env`, `.env.local`, database URLs, and provider keys out of Git.
- [ ] Never put a secret under a `NEXT_PUBLIC_` name; those values are public in the browser.
- [ ] Use separate keys and secrets for local, staging, and production.
- [ ] Restrict API keys to required services and rotate them if exposed.
- [ ] Restrict database network access and use TLS for production traffic.
- [ ] Avoid logging authorization headers, cookies, API keys, complete connection strings, or raw secret values.
- [ ] Do not paste secret values into chat. Share only variable names and whether they are configured.
- [ ] Confirm live provider implementations before attempting a real call, sending a WhatsApp message, or processing vendor audio.

## Related files

- [Backend environment template](./backend/.env.example)
- [Frontend environment template](./frontend/.env.example)
- [Combined development command](./package.json)
- [Production readiness checklist](./FLEETO_PRODUCTION_READINESS_CHECKLIST.md)
- [Railway + Vercel deployment guide](./FLEETO_DEPLOYMENT_GUIDE.md)
