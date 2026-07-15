# Deploying MediNEEO

- **Frontend** — static site (Netlify / Vercel), built from `frontend/`.
- **Backend** — Docker container on **Back4App Containers**, built from the
  [`Dockerfile`](Dockerfile) at the repo root.
- **Database** — managed Postgres (**Neon** free tier recommended). Back4App does
  not host Postgres, and neither does Netlify or Vercel.

---

## ⚠️ Read this first: there is no authentication

The app currently has **no auth provider**. Nothing in the backend issues a JWT
(`grep jwt.sign` returns nothing), the frontend login only accepts `demo`/`demo`
locally, and registration is disabled.

The only way to make the deployed app usable is `BACKEND_DEV_AUTH=true`, which
makes the API treat **every caller as `clinic_admin`**. That means:

- ✅ Fine for a **public demo with fabricated data**.
- ❌ **Never put real patient data on this deployment.** It would be world-readable
  and world-writable. This is health data.

Wiring a real auth provider (the code is already shaped for Supabase —
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`) is a prerequisite for a real launch.

---

## 1. Database (Neon)

Create a free project and copy the **pooled** connection string (the one with
`-pooler` in the host). The pooled one matters: the API opens up to 10
connections per instance.

Neon is plain Postgres, which is what this schema needs —
[`00_local_stubs.sql`](backend/db/init/00_local_stubs.sql) creates the `auth`
schema the RLS policies depend on. On Supabase that schema already exists and the
stub would be skipped, which is why Neon is the safer target.

## 2. Backend (Back4App Containers)

Point a new Container App at this GitHub repo. Back4App reads the root
`Dockerfile` — no build command to configure.

**Exposed port: `3001`.**

Environment variables:

| Variable | Value | Why |
| --- | --- | --- |
| `DATABASE_URL` | Neon **pooled** URL | Must include `?sslmode=require` |
| `BACKEND_DEV_AUTH` | `true` | Demo only — see the warning above |
| `CORS_ORIGINS` | `https://<your-site>.netlify.app` | Comma-separated. If unset, CORS is wide open |
| `SKIP_MEDICAMENTS_SEED` | `true` | See §4 |

`NODE_ENV=production` is **baked into the Dockerfile on purpose — do not
override it.** In any other mode the migration runner performs a
`DROP SCHEMA` of every user schema on **every boot**
([migrate.js](backend/db/migrate.js)). In production it refuses to reset and only
applies pending migrations.

On first boot the container applies the 15 migrations itself. Verify:

```bash
curl https://<your-app>.b4a.run/api/health   # → {"ok":true,"version":"1.0.0"}
```

## 3. Seed the database — it will be empty otherwise

Production **skips the dev seeds by design**, so after the first boot you have a
correct schema and **zero rows** — no clinic, no users, no demo data. The app
will look broken until you seed it. Run once, against the Neon URL:

```bash
psql "$DATABASE_URL" -f backend/db/init/99_dev_seed.sql        # dev clinic + demo user
psql "$DATABASE_URL" -f backend/db/init/99c_dev_seed_rich.sql  # baseline clinical data
psql "$DATABASE_URL" -f backend/db/init/99e_showcase_seed.sql  # busy demo clinic
```

`99e_showcase_seed.sql` is idempotent and dates everything relative to
`CURRENT_DATE`, so re-running it refreshes the demo to look "live today".

## 4. Drug catalogue

`medicaments data/medicaments.jsonl` (3.8 MB) is **not committed to git**, so it
will not exist in the container. The backend detects this and skips the import
instead of crashing — the Medicaments page will simply be empty.

To populate it, either commit the file, or import it once from your machine:

```bash
DATABASE_URL="<neon-url>" npm run import:medicaments -w backend
```

## 5. Frontend (Netlify)

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `frontend/dist` |
| Env var | `VITE_API_BASE_URL = https://<your-app>.b4a.run` |

The SPA redirect in [`netlify.toml`](netlify.toml) is required — without it any
deep link (`/app/patients`) 404s.

Then set `CORS_ORIGINS` on Back4App to the Netlify URL and redeploy the backend.

---

## Known limits of this deployment

- **Radiology uploads are ephemeral.** Multer writes to the container filesystem
  ([routes/uploads.js](backend/routes/uploads.js)); every redeploy or restart
  wipes them. A real deployment needs object storage (Supabase Storage, R2, S3).
- **Rate limiting is per-instance** (in-memory), so it weakens if the container
  is scaled out.
- **No auth** — see the top of this file.
