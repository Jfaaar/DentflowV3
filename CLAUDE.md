# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

DentFlow (package name `medineeo`) — multi-tenant clinic management SaaS: patients, scheduling,
clinical records, prescriptions, inventory, radiology, invoicing, reporting. Mobile-first,
dark-mode, i18n EN/FR/ES/IT/AR with RTL. Despite the name, the app is specialty-agnostic — a
clinic's `enabled_specialties` / `primary_specialty` turn dental-specific (or other) modules on
or off; see [SPECIALTY_FEATURES.md](SPECIALTY_FEATURES.md) for the full model.

npm workspace: [frontend/](frontend/) (React 18 + TS + Vite) and [backend/](backend/) (Express +
Postgres), driven from the root [package.json](package.json).

## Commands

Run from the repo root unless noted.

```bash
npm install
cp frontend/.env.example frontend/.env.local   # set VITE_API_BASE_URL=http://localhost:4000
docker compose up -d          # postgres :5432 + pgadmin :5050 (migrations + dev seed auto-apply)

npm run dev                   # vite (:3000) + express (:4000) together, via concurrently
npm run typecheck             # tsc --noEmit, both workspaces
npm run lint                  # eslint, both workspaces
npm run lint:fix
npm run format                # prettier --write
npm run build                 # frontend production build -> frontend/dist/
npm test                      # vitest run, both workspaces (frontend jsdom, backend node)
npm run test:e2e -w frontend  # playwright e2e (spawns its own vite dev server)
npm run screenshots           # scripts/capture-screenshots.mjs — landing-page marketing shots
```

Single-test invocations (vitest projects are separate per workspace — always pass `-w`):

```bash
npm test -w backend -- appointments.test        # filename filter, backend/__tests__/*.test.js
npm test -w frontend -- patients.test           # filename filter, frontend src/**/*.test.tsx
npx vitest run path/to/file.test.ts -w frontend # exact file
npx playwright test e2e/smoke.spec.ts -w frontend
```

`docker compose down -v` drops the Postgres volume for a clean-slate schema/reseed.

### Mock mode (no backend)

`npm run dev:mock -w frontend` / `npm run build:mock -w frontend` boot with
`VITE_ENABLE_MOCKS=true` ([frontend/.env.mock](frontend/.env.mock)). `main.tsx` then starts an
MSW browser worker ([frontend/src/mocks/browser.ts](frontend/src/mocks/browser.ts)) that
intercepts `/api/v1/*` with the in-memory handlers under
[frontend/src/mocks/handlers/](frontend/src/mocks/handlers/) (aggregated in `handlers/index.ts`,
one file per domain). This is what powers the backend-less Vercel demo deploy
([vercel.json](vercel.json)). Note `frontend/src/mocks/handlers.ts` (singular, no directory) is a
separate, smaller handler set used only by Vitest/MSW-node tests — don't confuse the two; the
`browser.ts` comment explains why the import is the explicit `./handlers/index`.

### Dev auth bypass

When `SUPABASE_URL`/`BACKEND_DEV_AUTH` leave dev auth on (default outside `NODE_ENV=production`
and outside tests), [backend/middleware/auth.js](backend/middleware/auth.js) skips token
validation and attaches a synthesized `clinic_admin` user matching the dev seed
([backend/db/init/99_dev_seed.sql](backend/db/init/99_dev_seed.sql)). The frontend login accepts
`demo`/`demo` and short-circuits the same way. Set `BACKEND_DEV_AUTH=false` to force the real JWT
path locally. **Production has no real auth provider today** — see the warning at the top of
[DEPLOY.md](DEPLOY.md) before ever pointing a deployment at real patient data.

## Architecture

### Backend — layered, Postgres-only

`routes/ → controllers/ → services/ → repositories/`, one file per domain in each layer
(e.g. `patients.js` route → `patientsController.js` → `patientsService.js` →
`patientsRepository.js`). [backend/index.js](backend/index.js) wires ~25 routers in one Express
app; helmet + CORS allowlist (`CORS_ORIGINS`) + rate limiting are applied globally.

- **Repositories are the only place SQL lives.** They take `db` (pg pool or client) as their
  first argument, use parameterized `$1, $2, …` queries (never string interpolation), and
  hand-roll snake_case-row → camelCase-DTO mapping (`fromDb()`). Canonical template:
  [backend/repositories/patientsRepository.js](backend/repositories/patientsRepository.js).
  A minority of repositories still use a legacy supabase-js client — new/touched ones should
  follow the pg-pool pattern.
- **`req.db` / `req.user`** are attached by `authenticateToken`
  ([backend/middleware/auth.js](backend/middleware/auth.js)) on every request — controllers and
  services never open their own connections.
- **Three independent gating layers**, stackable on any route, all requiring
  `authenticateToken` first:
  - `requireRole` / `requirePermission` — coarse static role→permission matrix
    ([backend/lib/permissions.js](backend/lib/permissions.js)).
  - `requireEffectivePermission` — fine-grained dotted permissions (`clinical.sign`,
    `payments.refund`, …) shared in spirit with the frontend; static default matrix
    ([backend/lib/rolePermissions.js](backend/lib/rolePermissions.js)) overridable per clinic via
    `role_permission_overrides`. Prefer this on new clinical/admin routes.
  - `requireFeature(featureKey)` — clinic-level module toggle (`clinic_feature_overrides` →
    `feature_definitions.default_specialties ∩ clinic_settings.enabled_specialties`); catalog in
    [backend/lib/features.js](backend/lib/features.js).
  - `requireSpecialty([...codes])` — gates by `clinic_settings.enabled_specialties` directly.
  - `super_admin` bypasses the effective-permission and feature gates (cross-clinic backoffice
    work); it does not bypass `requireRole`/`requirePermission` checks that don't list it.
- **Multi-tenancy**: every clinic-scoped table carries `clinic_id`; Postgres RLS policies
  ([backend/db/migrations/0003_rls_policies.sql](backend/db/migrations/0003_rls_policies.sql))
  enforce isolation at the DB layer, not just in application code.
- **Migrations** are plain numbered SQL files in
  [backend/db/migrations/](backend/db/migrations/), applied in order by
  [backend/db/migrate.js](backend/db/migrate.js) on every boot. In non-production it
  `DROP SCHEMA`s and rebuilds from scratch on every start (fast local iteration); in
  `NODE_ENV=production` it only applies pending migrations — never drops. Dev/demo seed data
  lives separately in [backend/db/init/](backend/db/init/) (`99_dev_seed.sql`,
  `99c_dev_seed_rich.sql`, `99e_showcase_seed.sql` — the last is idempotent and dates itself off
  `CURRENT_DATE` for a "live today" demo) and is **not** run in production; see
  [DEPLOY.md](DEPLOY.md) §3 for the manual seed step required after a fresh prod deploy.
- Request bodies are validated with zod schemas in [backend/validation/](backend/validation/) via
  the `validate` middleware; failures return structured `{ error, issues }`.

### Frontend — feature-sliced

Structure follows [ARCHITECTURE_BRIEF.md](ARCHITECTURE_BRIEF.md) (treat as a contract for new
code) under `frontend/src/`:

```
app/          App.tsx (react-router-dom v6 routes), providers, root shells
components/   ui/ (primitives) + layout/ + auth/ (cross-feature, not domain-specific)
features/     one folder per business domain — api/, components/, hooks/, store?/, types/, utils/, index.ts
services/api/ baseApi.ts — the single shared RTK Query instance
shared/       cross-feature: constants (routes.ts), storage (authStorage), i18n, hooks, utils
store/        configureStore — registers every feature's injectEndpoints + typed hooks
mocks/        MSW handlers for browser mock mode and for tests (see Mock mode above)
```

- **One shared `baseApi`** ([frontend/src/services/api/baseApi.ts](frontend/src/services/api/baseApi.ts)):
  `createApi` + `fetchBaseQuery`, reads the bearer token from `shared/storage/authStorage`, and
  centralizes every `tagTypes` entry. Each feature does
  `baseApi.injectEndpoints({ endpoints: build => ({...}) })` in `features/<x>/api/` and exports
  the generated `useXQuery`/`useXMutation` hooks — never a second `createApi` call.
  `frontend/src/store/index.ts` must eagerly `import` every feature's api module so
  `injectEndpoints` runs at startup, and its logout middleware calls
  `baseApi.util.resetApiState()`.
- **Routing** is centralized in [frontend/src/app/App.tsx](frontend/src/app/App.tsx): one
  `<Routes>` tree, `<ProtectedRoute>` for auth gating, separate shells for the clinic app vs. the
  super-admin `Backoffice`. Route path constants live in
  `shared/constants/routes.ts` (`ROUTES`, `APP_TAB_TO_PATH`, `BACKOFFICE_TAB_TO_PATH`).
- **Path aliases** `@/*`, `@/app/*`, `@/components/*`, `@/features/*`, `@/shared/*`,
  `@/services/*`, `@/assets/*` are defined in both `vite.config.ts` and `tsconfig.json` — keep
  them in sync if you add a new top-level `src/` folder. Prefer `@/...` imports for new code
  (some older files still use relative `../` paths across feature boundaries).
- **Forms**: react-hook-form + a zod schema per form; submit handlers call RTK Query mutations
  and surface errors via `shared/utils` error handling + `sonner` toasts.
- **i18n**: all user-facing strings go through `useTranslation()`; locale files under
  `shared/i18n/` / `lib/i18n/`.
- **Strict TypeScript** (`strict`, `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch`) — avoid `any`; DTOs belong in each feature's `types/`.
- Specialty/feature gating on the frontend mirrors the backend model (`useFeatureAccess`,
  `useClinicSpecialty`) — see [SPECIALTY_FEATURES.md](SPECIALTY_FEATURES.md) before adding a new
  clinical module or a specialty-conditional UI.

### Tests

- Backend: Vitest, `node` environment, files in `backend/__tests__/*.test.js`, hits a real
  Postgres (docker-compose) — not mocked.
- Frontend: Vitest, `jsdom`, co-located `*.test.ts(x)`, MSW (`frontend/src/mocks/handlers.ts`)
  for network mocking, setup in `frontend/src/test/setup.ts`.
- E2E: Playwright, `frontend/e2e/*.spec.ts`, spawns its own `vite dev` unless
  `E2E_REUSE_DEV`/`E2E_PORT`/`E2E_BASE_URL` point it at an already-running server.

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full walkthrough (Neon Postgres + Back4App container backend
+ Netlify/Vercel static frontend). Key gotchas if touching deploy-related code:

- The root [Dockerfile](Dockerfile) bakes `NODE_ENV=production` on purpose — do not override it;
  in any other mode the migration runner drops and rebuilds the schema on every boot.
- Radiology uploads ([backend/routes/uploads.js](backend/routes/uploads.js)) write to local disk
  via multer — ephemeral on redeploy in this container setup, not yet backed by object storage.
- `medicaments data/medicaments.jsonl` is intentionally not committed; the medicaments import
  (`npm run import:medicaments -w backend`) is a manual post-deploy step.
