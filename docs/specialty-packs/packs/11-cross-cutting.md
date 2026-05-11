# Pack: Cross-cutting templates & config  ·  Phase 6  ·  Status: `planned`

> Pulls per-specialty wording — **appointment types, document/imaging kinds, certificate
> & referral templates, dashboard presets** — out of code and into **clinic-editable**
> tables. Earlier phases seed code-level defaults via `seedSpecialtyDefaults`; this phase
> turns those into first-class, admin-editable config. Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §7. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md).

Specialty codes covered: all (this is infrastructure, not a clinical pack — no new feature keys).

---

## 1. Goal

Today (after Phase 0–5) each specialty's appointment types, document kinds, certificate
and referral wording, and dashboard widget set live as **code defaults** keyed by
`primary_specialty` in `SPECIALTY_PROFILES` and seeded by `seedSpecialtyDefaults`. This
phase makes them **clinic-scoped rows** an admin can edit (rename appointment types, tweak
certificate text, rearrange dashboard widgets) — while keeping the code defaults as the
seed/fallback so switching specialty still applies sensible presets and nothing is lost.

## 2. Data model — new clinic-scoped tables (RLS per `0011`)

| Table | Key columns | Notes |
|---|---|---|
| `appointment_types` | `id, clinic_id, code, label, default_duration_min, color, sort_order, active, specialty_origin` | seeded per primary specialty; calendar/`AppointmentModal` read these |
| `document_kinds` | `id, clinic_id, code, label, category(imaging/report/consent/photo/other), sort_order, active, specialty_origin` | `documents`/uploads tag against these |
| `certificate_templates` | `id, clinic_id, code, title, body (templated text w/ placeholders), specialty_origin, active` | sick note, fitness, travel, school absence, etc. |
| `referral_templates` | `id, clinic_id, code, title, body, default_recipient_specialty, specialty_origin, active` | referral / counter-referral letters |
| `dashboard_presets` | `id, clinic_id, code, widgets jsonb (ordered list of widget ids + options), specialty_origin, is_default` | the dashboard becomes a configurable widget list |

`specialty_origin` records which pack's seed produced the row (so a re-seed can update
un-edited rows but leave edited ones alone — same spirit as `ON CONFLICT DO UPDATE`).

## 3. Tasks

- [ ] Migration `00NN_clinic_config_tables.sql`: the five tables above + RLS + triggers + indexes
- [ ] Backend: repo/service/controller/validation/route for each (`/api/v1/appointment-types`, `/api/v1/document-kinds`, `/api/v1/certificate-templates`, `/api/v1/referral-templates`, `/api/v1/dashboard-presets`); CRUD gated by `settings.update` (admin); `requireFeature('settings')`
- [ ] Migrate the code seeds: change `seedSpecialtyDefaults(clinicId, addedCodes)` to **insert rows** into these tables (it was a stub in Phase 0, then per-pack seeds in code); keep the code defaults as the source of the seed values
- [ ] `SPECIALTY_PROFILES`: the `appointmentTypes` / `templates` / `dashboardPreset` ids now **resolve to clinic rows** at runtime, falling back to the code defaults if the clinic has no rows (e.g. just-created clinic before the seed ran)
- [ ] Calendar / `AppointmentModal`: appointment-type dropdown reads `appointment_types` (clinic rows)
- [ ] Documents/uploads: kind picker reads `document_kinds`
- [ ] Certificate & referral generation: pick a template from `certificate_templates` / `referral_templates`, fill placeholders (patient, clinic, doctor, date, …), output a `documents` entry
- [ ] `DashboardPage`: render the clinic's `dashboard_presets` default — widgets become a reorderable list; widget catalog is code (each pack registered widgets in its phase)
- [ ] Settings UI: new tabs (or sub-pages) under Settings — "Appointment types", "Document kinds", "Certificates", "Referrals", "Dashboard" — admin-only editors
- [ ] i18n (FR/EN/AR) for the new UI; default template bodies provided per locale
- [ ] Tests: CRUD 200/403 (admin vs not); seed-on-specialty-enable inserts rows; re-seed doesn't clobber edited rows; calendar/docs/dashboard read clinic rows with code fallback
- [ ] [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §7/§10 updated; [`../FEATURE-CATALOG.md`](../FEATURE-CATALOG.md) "Non-key configurable entities" section marked done

## 4. Verification

- [ ] Admin renames an appointment type / edits a certificate body / reorders dashboard widgets → changes persist per clinic and show up in the calendar / certificate output / dashboard
- [ ] New clinic with primary specialty X → gets X's seeded appointment types/templates/dashboard automatically
- [ ] Switching primary specialty from X to Y → Y's defaults are applied (additively for appointment types; the *default* dashboard preset switches) and nothing from X is deleted (its rows just become inactive / non-default)
- [ ] A clinic with edited rows that later re-runs the seed (e.g. after an app update adds a new default appointment type) → the new default is added, the edited ones are untouched

## 5. Open questions / decisions

- [ ] On specialty *switch*, should the previous specialty's seeded appointment types be deactivated, or kept active? (recommend: kept active but de-prioritised in sort order; never auto-deactivate things a clinic might be using)
- [ ] Template placeholder syntax — simple `{{patient.name}}` mustache-ish, or a small expression set? (mustache-ish, fixed placeholder list, no logic)
- [ ] Dashboard widget catalog: a registry in code (each pack adds its widgets) with `dashboard_presets.widgets` referencing widget ids — confirm this is the model
- [ ] Should `dashboard_presets` be per-role too (admin vs doctor vs assistant see different widgets)? (out of scope for v1 — single default preset per clinic; revisit later)
