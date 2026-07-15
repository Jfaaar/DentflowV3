# Pack: <Name>  ·  Phase <N>  ·  Status: `planned`

> Work order for the **<specialty>** pack. Design rationale lives in
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §<x>. Recipe & module-checklist
> template in [`../CONVENTIONS.md`](../CONVENTIONS.md). Update [`../README.md`](../README.md)'s
> status board and [`../FEATURE-CATALOG.md`](../FEATURE-CATALOG.md) `Status` columns as boxes get ticked.

Specialty codes covered: `<code(s)>`

---

## 1. Goal

One paragraph: what does "primary specialty = <code> ⇒ a <specialty> system" mean? What
does the user see that they didn't before?

## 2. Feature keys this pack adds

| Key | Cat | default_specialties | default_permission | New? |
|---|---|---|---|---|
| `<key>` | clinical | `[...]` | `clinical.view` | yes/no |

(Plus any shared keys it also turns on, and any it deliberately reuses — e.g. `bodyRegionChart`, `documents`, `treatments`.)

## 3. Data model

New / changed tables (tenant-scoped, RLS per `0003`/`0008`):

| Table | Key columns | Notes |
|---|---|---|
| `<table>` | `id, clinic_id, patient_id, …` | |

Reuse where possible (note it explicitly).

## 4. Layout profile (`SPECIALTY_PROFILES['<code>']`)

- **recordTabs:** Overview · … · Billing
- **primaryChart:** `dentalChart` / `bodyRegionChart` / `growthCharts` / `eyeExam` / `none`
- **dashboardPreset:** widgets list
- **appointmentTypes:** [...]
- **templates:** prescription / quote / referral / certificate ids

## 5. Tasks

### Module: `<featureKey>` — <Display name>
- [ ] Catalog: FEATURE-CATALOG.md row · backend/lib/features.js · frontend/src/lib/features.ts · feature_definitions seed
- [ ] Migration: tables + RLS (mirror 0003/0008)
- [ ] Backend: repository · service · controller · validation · route (requireFeature) · registered in index.js
- [ ] Permissions: <new perms? else "reuses <perm>">
- [ ] Frontend: feature folder · api slice · page · components
- [ ] Route in App.tsx wrapped in ProtectedRoute feature="<featureKey>" · path in routes.ts
- [ ] Sidebar NavItem (feature="<featureKey>")
- [ ] i18n keys (FR/EN/AR)
- [ ] Layout profile: SPECIALTY_PROFILES entries
- [ ] Seed: seedSpecialtyDefaults handles this pack's clinic-scoped defaults
- [ ] Tests: route 200/403 · repo/service units · frontend component · sidebar-hidden
- [ ] Verification: walkthrough recorded

*(repeat per module)*

### Pack-level
- [ ] `SPECIALTY_PROFILES['<code>']` filled (record tabs, chart, dashboard, appt types, templates)
- [ ] `seedSpecialtyDefaults` seeds this pack's clinic-scoped defaults
- [ ] Inventory catalog seed (if any)
- [ ] Dashboard preset implemented
- [ ] Sidebar grouping reviewed
- [ ] i18n complete (FR/EN/AR) for the whole pack
- [ ] [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 6. Verification

Steps performed to confirm the pack works end to end (switch primary specialty, toggle in
enabled_specialties, set a clinic override) — fill in when done.

## 7. Open questions / decisions

- …
