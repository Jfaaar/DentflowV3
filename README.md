# DentFlow

Multi-tenant clinic management SaaS — patients, scheduling, clinical records, prescriptions, inventory, radiology, invoicing, and reporting. Mobile-first, dark-mode, EN/FR/ES/IT/AR with RTL.

## Stack

- React 18 + TypeScript + Vite + Tailwind
- Supabase (Postgres + Auth + Storage, RLS-isolated per clinic)
- Express API ([server/](server/)) for admin operations and file uploads
- React Router for client routing, role + permission guards

## Prerequisites

- Node ≥ 18
- A Supabase project (free tier is enough for dev)

## Setup

```bash
npm install
cp .env.example .env.local
# fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
```

Run the SQL bootstrap once in the Supabase SQL editor:

1. [supabase/bootstrap.sql](supabase/bootstrap.sql) — profiles, clinics, invitations, RLS, signup trigger
2. [supabase/migrations/](supabase/migrations/) — apply files in order for the full schema (Phase 2)
3. [supabase/phone_auth_migration.sql](supabase/phone_auth_migration.sql) — only if enabling phone OTP

## Run

```bash
npm run dev          # Vite (frontend) + Express (API) via concurrently
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm run format       # prettier --write
npm run build        # production build to dist/
```

The frontend reads its API base from `VITE_API_BASE_URL` (defaults to `http://localhost:3001` in dev).

## Documentation

- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) — feature overview and module map
- [ARCHITECTURE.md](ARCHITECTURE.md) — multi-phase migration plan, schema design, RLS strategy

## Deployment

Frontend → Vercel ([vercel.json](vercel.json)). Backend (Express) needs a separate host (Fly / Render / Railway) **or** convert to Supabase Edge Functions — see [ARCHITECTURE.md](ARCHITECTURE.md#deployment).
