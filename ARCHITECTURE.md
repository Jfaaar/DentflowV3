# DentFlow Architecture

This document describes the target architecture for DentFlow once the
Supabase-backed cloud mode is live alongside the existing local-first MVP.
The phased rollout (Phase 1 auth → Phase 2 data → Phase 3 storage +
notifications → Phase 4 server consolidation) is tracked here.

## 1. Frontend

- React 18 + TypeScript + Vite
- Tailwind CSS, Lucide icons (`lucide-react`)
- Context-based state (`AuthProvider`, `ThemeProvider`, `LanguageProvider`)
- A single Supabase client lives in `lib/supabase.ts` and is used everywhere
  on the frontend.

## 2. Backend overview

- Supabase Postgres (managed) is the system of record for all clinic data.
- Supabase Auth handles email/password and phone/OTP login.
- Supabase Storage holds patient documents (radiology + everything else).
- Supabase Edge Functions handle scheduled / async work (notifications).
- A small Express server (`server/index.js`) is kept around for legacy
  multipart uploads and admin RPCs. It is being phased out in Phase 4.

## 3. Modules

### 3.1 Auth (Phase 1) — DONE

Email + phone auth. See `features/auth/`.

### 3.2 Tenant data (Phase 2)

Patients, appointments, treatments, invoices, payments, prescriptions —
all stored in Postgres tables defined in
`supabase/migrations/0002_clinical_tables.sql` with tenant-scoped RLS in
`supabase/migrations/0003_rls_policies.sql`.

The frontend reads/writes through `lib/api.ts` and (for direct Supabase
calls) `lib/storage.ts`. These remain Phase 2's territory.

### 3.6 Storage & documents

DentFlow stores all per-patient files (radiology, consents, insurance
cards, medical certificates, etc.) in a single private Supabase Storage
bucket called **`medical`**. The bucket and its RLS policies are created
in `supabase/migrations/0004_storage_buckets.sql`. Object paths follow:

```
${clinicId}/${patientId}/${docId}.${ext}
```

Metadata for each upload is mirrored in the `documents` table
(`supabase/migrations/0002_clinical_tables.sql`) so we can list, filter
by category, archive (soft-delete), and audit who uploaded what.

The frontend never talks to the bucket directly. Instead it goes through
**`lib/services/documents.ts`**, which exposes:

- `upload(file, patientId, category)` — uploads bytes to storage and
  inserts the matching `documents` row.
- `list(patientId, opts)` — selects active rows for a patient and
  returns each row joined with a freshly minted signed URL
  (`expiresIn = 600s`). Optional `category` filter.
- `signedUrl(documentId)` — re-signs a single document on demand.
- `archive(id)` — sets `archived_at = now()` (soft delete).

The radiology UI in `features/patients/components/RadiologyGalleryModal.tsx`
calls this service. A generic
`features/patients/components/DocumentsTab.tsx` component reuses it for
non-image categories (consent, insurance, certificate). The legacy
multer route in `server/index.js` (`POST /api/patients/:id/radios`) is
left in place as a deprecated fallback for clinics whose Supabase project
hasn't been provisioned yet.

### 3.7 Notifications

DentFlow sends out appointment reminders, payment reminders, and
internal alerts. All outbound messaging is queued in the `notifications`
table and dispatched by a Supabase Edge Function on a 1-minute cron.

- **Templates** — `notification_templates` (key, locale, channel, body).
  Default rows are seeded in
  `supabase/migrations/0006_notification_templates_seed.sql`
  (appointment_reminder + payment_reminder, in `en` and `fr`,
  `channel='email'`).
- **Queue** — `notifications` row has
  `(recipient_user_id?, patient_id?, channel, template_key, payload,
  status, scheduled_for, sent_at, error)`.
- **Service** — `lib/services/notifications.ts` exposes
  `enqueue(...)` and `listForCurrentUser()`.
- **Dispatcher** — `supabase/functions/dispatch-notifications/index.ts`
  selects rows where `status = 'queued'` and `scheduled_for <= now()`,
  resolves each row's template (matching `key + channel` and falling
  back across locales), simulates delivery (logs a line — real provider
  integration is out of Phase 3 scope), and marks the row
  `status='sent'` with `sent_at = now()`. On error the row goes to
  `status='failed'` with the message captured in `error`.
- **Service-role client** — the function imports
  `supabase/functions/_shared/supabase.ts`, which constructs a
  service-role `SupabaseClient` from the standard Edge Function env
  vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Deploy** —

  ```sh
  supabase functions deploy dispatch-notifications --schedule "* * * * *"
  ```

  See `supabase/functions/dispatch-notifications/README.md` for details.

## 4. Phase status

- **Phase 1 — DONE** — Email + phone auth.
- **Phase 2 — IN PROGRESS** — Migrating clinic data from `localStorage`
  to Supabase tables.
- **Phase 3.6 / 3.7 — DONE** — Storage bucket + `documents` service
  (`lib/services/documents.ts`) wired into the radiology UI and a new
  generic `DocumentsTab`. Notifications queue +
  `lib/services/notifications.ts` + Edge Function dispatcher
  (`supabase/functions/dispatch-notifications/index.ts`) backed by the
  shared service-role client at `supabase/functions/_shared/supabase.ts`
  and seeded templates in
  `supabase/migrations/0006_notification_templates_seed.sql`. The
  legacy multer route in `server/index.js` remains as a fallback.
- **Phase 4 — PLANNED** — Retire `server/index.js` admin code in favor
  of Edge Functions.
