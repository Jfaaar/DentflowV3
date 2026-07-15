# DentFlow

Multi-tenant clinic management SaaS — patients, scheduling, clinical records, prescriptions, inventory, radiology, invoicing, and reporting. Mobile-first, dark-mode, EN/FR/ES/IT/AR with RTL.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind, Redux Toolkit + RTK Query, react-router-dom v6, i18next.
- **Backend**: Express, layered controllers / services / repositories, zod validation, JWT auth.
- **Database**: Postgres 16 (local Docker stack). Schema lives in [backend/db/migrations/](backend/db/migrations/) and is applied automatically on first container start.
- **Tooling**: Vitest + Testing Library + MSW (unit), Playwright (e2e), strict TS.

Repo is an **npm workspace** — frontend at [frontend/](frontend/), backend at [backend/](backend/).

## Prerequisites

- Node ≥ 18
- Docker Desktop (for local Postgres + pgAdmin)

## First-time setup

```bash
npm install
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local — at minimum set VITE_API_BASE_URL=http://localhost:4000

# Bring up the data tier (postgres :5432, pgadmin :5050)
docker compose up -d
```

The Postgres container auto-runs the migration files under [backend/db/migrations/](backend/db/migrations/) (and seeds a dev clinic + sample patients via [backend/db/init/](backend/db/init/)) on the first start. To reset everything to a virgin schema:

```bash
docker compose down -v   # drops the named volumes
docker compose up -d
```

### pgAdmin

Open http://localhost:5050 (no login required — single-user mode). The `Dentflow Local` server is pre-registered; the password on first connect is `dentflow`.

### Dev auth bypass

In dev (when `SUPABASE_URL` is unset), the backend auth middleware skips token validation and synthesizes a `clinic_admin` user matching the dev seed. The frontend's login page accepts `demo` / `demo` and short-circuits the same way. To force the production auth path locally, set `BACKEND_DEV_AUTH=false`.

## Run

```bash
npm run dev          # Vite frontend (:3000) + Express backend (:4000) via concurrently
npm run typecheck    # tsc --noEmit across both workspaces
npm run lint         # eslint
npm run format       # prettier --write
npm run build        # frontend production build → frontend/dist/
npm test             # vitest run (unit) for both workspaces
npm run test:e2e -w frontend   # playwright e2e
```

## Database connections

The backend reads (in order):

1. `DATABASE_URL` (single connection string)
2. `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE`
3. Compose defaults: `localhost:5432`, user/password/db all `dentflow`

The pg pool lives at [backend/db/pg.js](backend/db/pg.js). Repositories accept a `db` argument (the pool) as their first parameter — see [backend/repositories/patientsRepository.js](backend/repositories/patientsRepository.js) as the canonical pg-driven repository template.

## Documentation

- [ARCHITECTURE_BRIEF.md](ARCHITECTURE_BRIEF.md) — target architecture (workspace shape, RTK Query, layered backend, etc.)
- [ARCHITECTURE.md](ARCHITECTURE.md) — multi-phase migration plan, schema design, RLS strategy
- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) — feature overview and module map
