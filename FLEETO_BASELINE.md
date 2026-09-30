# Fleeto Baseline

Date: 2026-09-29
Git commit/hash: not available in this workspace (not a git repository)
Node version: v22.23.1
npm version: 10.9.8

## Backend
- Test result: PASS
  - Command: `cd "/Users/jameeru/Desktop/Fleeto AI " && cd backend && npm test`
  - Result: 9 test files passed, 28 tests passed
- Lint result: PASS with warnings
  - Command: `cd "/Users/jameeru/Desktop/Fleeto AI " && cd backend && npm run lint`
  - Result: warnings only; no blocking lint failure from the baseline run
- Build result: FAIL
  - Command: `cd "/Users/jameeru/Desktop/Fleeto AI " && cd backend && npm run build`
  - Result: TypeScript build errors in decorated controller DTO typing and AI provider typing
- Prisma validation: PASS
  - Command: `cd "/Users/jameeru/Desktop/Fleeto AI " && cd backend && npx prisma validate`
  - Result: Prisma schema valid
- Prisma generate: PASS
  - Command: `cd "/Users/jameeru/Desktop/Fleeto AI " && cd backend && npx prisma generate`
  - Result: generated Prisma Client successfully

## Frontend
- Lint result: FAIL
  - Command: `cd "/Users/jameeru/Desktop/Fleeto AI " && cd frontend && npm run lint`
  - Result: multiple TypeScript `any` violations and unused-variable warnings across pages
- Build result: NOT VERIFIED because lint failure blocks clean production build; build command was not cleanly relied upon as a pass result
  - Command: `cd "/Users/jameeru/Desktop/Fleeto AI " && cd frontend && npm run build`
  - Result: not recorded as passing in the baseline due lint/type issues already blocking the app from clean release readiness

## Known Failures / Blockers
1. Backend build fails in decorated DTO typing (`import type` requirement) in files such as:
   - [backend/src/ai/ai.controller.ts](backend/src/ai/ai.controller.ts)
   - [backend/src/auth/auth.controller.ts](backend/src/auth/auth.controller.ts)
2. Backend AI provider typing is failing in:
   - [backend/src/ai/providers/gemini.provider.ts](backend/src/ai/providers/gemini.provider.ts)
3. Frontend lint/type issues are widespread, dominated by `no-explicit-any` usage across pages under:
   - [frontend/src/app](frontend/src/app)
4. Real telephony and full end-to-end golden-path verification are still not complete.
5. Security review and webhook/WebSocket authorization checks remain incomplete for production sign-off.

## Baseline Conclusion
The current repository is not production-ready. The backend is partially validated, but both the backend build and frontend lint/type hygiene remain blockers. The eligibility issue previously reported was fixed and the backend unit suite is green, but the broader production readiness work is still incomplete.
