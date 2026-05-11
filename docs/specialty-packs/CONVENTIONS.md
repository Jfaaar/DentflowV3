# Conventions — adding a specialty pack / feature module

This is the **recipe**. Follow it for every new feature key so the catalog, the
backend enforcement, the frontend gating, and the layout profiles stay in sync.
Most of the machinery already exists (see "What's already there" at the bottom) —
you're filling in slots, not inventing structure.

---

## 0. Vocabulary

- **Feature key** — a short camelCase string (`perioChart`, `cardiacStudies`). The unit
  of enable/disable. Lives in `feature_definitions` (DB), `backend/lib/features.js`,
  `frontend/src/lib/features.ts`.
- **Pack** — the bundle a specialty contributes: its feature keys + layout profile +
  templates + seed data. Tracked by one `packs/NN-<name>.md` doc.
- **Layout profile** — the per-`primary_specialty` "skin": record tab order, the visual
  chart shown, the dashboard preset, the appointment-type seed list, template ids.
  Lives in `frontend/src/features/settings/specialtyProfiles.ts` (`SPECIALTY_PROFILES`).
- **Auto-enabled** — `default_specialties ∩ clinic.enabled_specialties ≠ ∅`.
- **Override** — a `clinic_feature_overrides` row pinning the key on/off; always wins.

---

## 1. The 11 specialty codes (do not invent more without a migration)

`general_practice` · `dental` · `pediatrics` · `gynecology` · `cardiology` ·
`dermatology` · `ent` · `ophthalmology` · `orthopedics` · `psychiatry` · `other`

Whitelisted by CHECK constraints in `0008_medical_mvp.sql` (`clinic_settings`) and
`0011_feature_access.sql` (`feature_definitions.default_specialties`). Adding a code =
a new migration that updates *both* constraints, the `SPECIALTY_CODES` arrays
(`backend/validation/settings.js`, `frontend/src/features/settings/api/settingsApi.ts`),
the i18n label keys, and `SPECIALTY_PROFILES`.

---

## 2. Categories & default permission

- `category ∈ {clinical, operations, admin}` — used for grouping in the Features page and the Sidebar.
- `default_permission` — an existing dotted permission from `backend/lib/rolePermissions.js`
  (`clinical.view`, `treatments.view`, `documents.view`, …). Reuse before adding. A new
  permission means: add to `ALL_PERMISSIONS` + the relevant role Sets in
  `backend/lib/rolePermissions.js`, mirror in `frontend/src/lib/permissions.ts`, and it
  shows up automatically in the Roles page matrix.

---

## 3. Recipe — add one feature key end to end

### 3a. Catalog (always, even if the UI lands later)
1. Add a row to [`FEATURE-CATALOG.md`](FEATURE-CATALOG.md): key, display name, category, `default_specialties`, `default_permission`, status `planned`, phase, pack doc.
2. Add the key to `backend/lib/features.js` `FEATURE_KEYS` (alpha-ish / grouped to match the file's existing order).
3. Add the key to `frontend/src/lib/features.ts` `FEATURE_KEYS` (same order).
4. Add/extend a migration `00XX_<pack>_features.sql`: `INSERT INTO feature_definitions (...) VALUES (...) ON CONFLICT (feature_key) DO UPDATE SET ...` — keep it re-runnable.
5. Run the catalog test (`backend/__tests__/…`): every `FEATURE_KEYS` entry ↔ one seeded row ↔ one `FEATURE-CATALOG.md` row; `default_specialties` ⊆ the 11 codes.

### 3b. Backend module
6. Migration for the module's table(s): tenant-scoped, `clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE`, `created_at/updated_at`, `set_updated_at()` trigger, indexes on `(clinic_id)` and `(patient_id, …)`. Enable RLS and add `_select/_insert/_update/_delete` policies mirroring the `DO $$ … FOREACH` block in `0011` (`is_super_admin() OR clinic_id = current_clinic_id()`). Copy the pattern from `0008_medical_mvp.sql` / `0003_rls_policies.sql`.
7. `backend/repositories/<name>Repository.js` — pg queries (mirror an existing repo's style).
8. `backend/services/<name>Service.js` — business logic.
9. `backend/controllers/<name>Controller.js` — `list/get/create/update/remove` handlers.
10. `backend/validation/<name>.js` — Zod schemas (mirror `backend/validation/treatmentPlans.js`).
11. `backend/routes/<name>.js` — `router.use(authenticateToken)` then routes wrapped in `requireFeature('<key>')` and `asyncHandler(...)`. For a CRUD-uniform module, copy the `mount(prefix, featureKey, handlers)` helper from `backend/routes/medical.js`.
12. Register in `backend/index.js` (`app.use('/api/v1/<path>', require('./routes/<name>'))`).
13. If new permissions: edit `backend/lib/rolePermissions.js` (`ALL_PERMISSIONS` + role Sets).

### 3c. Frontend module
14. `frontend/src/features/<pack>/` — folder per pack (`dental/`, `cardiology/`, …; reuse existing `clinical/` where the data is generic clinical).
15. `frontend/src/features/<pack>/api/<name>Api.ts` — `baseApi.injectEndpoints` (mirror `frontend/src/features/settings/api/featuresApi.ts`).
16. Page + components; gate page-level actions with `useFeatureAccess('<key>')` / `useFeatureAccessApi().access('<key>')`.
17. Route in `frontend/src/app/App.tsx` under `<ProtectedRoute feature="<key>">` (see how existing routes are wrapped). Add the path to `frontend/src/shared/constants/routes.ts`.
18. Sidebar: add a `NavItem` with `feature: '<key>'` in the right `NavGroup` in `frontend/src/components/layout/Sidebar.tsx` (it auto-hides on disabled/no-permission). If new permissions: also add to `frontend/src/lib/permissions.ts` so the Roles page lists them.
19. i18n: add labels for the feature key, the page title, every button/field/empty-state to `frontend/src/lib/i18n/translations.ts` in **all** locales present (FR/EN/AR).

### 3d. Layout profile (the "skin")
20. In `frontend/src/features/settings/specialtyProfiles.ts`, add the pack's feature keys to the relevant specialties' `recordTabs`; set `primaryChart`/`dashboardPreset`/`appointmentTypes`/`templates` as needed.
21. Make the patient record (`PatientDetailsModal` / patient dashboard), `DashboardPage`, and `AppointmentModal` read these from `SPECIALTY_PROFILES[primarySpecialty]` rather than hard-coding.

### 3e. Seeding
22. In `backend/services/settingsService.js#update`, extend `seedSpecialtyDefaults(clinicId, addedCodes)` to insert this pack's clinic-scoped defaults (appointment types, doc kinds, certificate/referral templates) when one of its specialties is newly enabled. **Never delete on disable** — keep historical data; just stop surfacing.

### 3f. Tests & docs
23. Backend: route smoke test (200 with feature enabled, 403 with it disabled), repo/service unit tests for non-trivial logic.
24. Frontend: component test for the new page; assert sidebar hides the item when the feature is off.
25. Update the pack doc checklist, [`README.md`](README.md) status board, and the `Status` column in [`FEATURE-CATALOG.md`](FEATURE-CATALOG.md).

---

## 4. Module checklist template (copy into a pack doc per module)

```markdown
### Module: <featureKey> — <Display name>

- [ ] Catalog: FEATURE-CATALOG.md row · backend/lib/features.js · frontend/src/lib/features.ts · feature_definitions seed
- [ ] Migration: tables + RLS (mirror 0003/0008)
- [ ] Backend: repository · service · controller · validation · route (requireFeature) · registered in index.js
- [ ] Permissions: <new perms?> added to backend/lib/rolePermissions.js + frontend/src/lib/permissions.ts (or "reuses <perm>")
- [ ] Frontend: feature folder · api slice · page · components
- [ ] Route in App.tsx wrapped in ProtectedRoute feature="<featureKey>" · path in routes.ts
- [ ] Sidebar NavItem (feature="<featureKey>")
- [ ] i18n keys (FR/EN/AR)
- [ ] Layout profile: SPECIALTY_PROFILES entries (recordTabs / primaryChart / dashboardPreset / appointmentTypes / templates)
- [ ] Seed: seedSpecialtyDefaults handles this pack's clinic-scoped defaults
- [ ] Tests: route 200/403 · repo/service units · frontend component · sidebar-hidden
- [ ] Verification: walkthrough recorded
```

---

## 5. Naming & file conventions

- **Feature key:** camelCase, noun-ish, singular-ish (`audiogram` → `audiometry` if it's a module of records; `cardiacStudies` plural is fine when it's a collection module). Match the vibe of the existing 19.
- **Tables:** snake_case, plural (`perio_charts`, `cardiac_studies`); always `clinic_id`, `patient_id` (where applicable), `created_at`, `updated_at`.
- **Routes:** kebab path under `/api/v1/` (`/api/v1/cardiac-studies`).
- **Frontend folder:** the pack name (`dental`, `cardiology`, `pediatrics`, `ent`, `ophthalmology`, `orthopedics`, `gynecology`, `psychiatry`); generic clinical data → `clinical/`.
- **i18n keys:** `<feature><Thing>` camelCase, with an English fallback string passed to `t()` (matches existing usage).
- **Migrations:** next free `00NN_` number; descriptive suffix; idempotent (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE`, `DROP CONSTRAINT IF EXISTS`).

---

## 6. Anti-patterns — don't

- ❌ Couple a feature key to a role. Specialty/feature gating and role/permission gating
  are orthogonal — a `doctor` in a dental clinic and a `doctor` in a cardiology clinic
  have the same permissions; the *features* differ.
- ❌ Add a clinical surface only to a pack when every specialty needs it. Vitals,
  allergies, problem list, medication list, SOAP notes are **core** — packs *add* tabs.
- ❌ Delete clinic data when a specialty is disabled. Hide it; keep the rows.
- ❌ Hard-code a specialty branch in a component (`if (isDental) …`). Read
  `SPECIALTY_PROFILES[primarySpecialty]` instead.
- ❌ Ship a feature key without updating all three catalog locations + the catalog test.
- ❌ Forget AR/FR i18n. The app ships FR/EN/AR; English-only strings are a regression.

---

## 7. What's already there (don't rebuild)

- Specialty config: `clinic_settings.primary_specialty` + `enabled_specialties` (11-code CHECK) — `0008_medical_mvp.sql`
- Feature plumbing: `feature_definitions`, `clinic_feature_overrides`, `role_permission_overrides` — `0011_feature_access.sql`
- Resolution: `backend/services/featuresService.js` + `frontend/src/features/settings/useFeatureAccess.ts` (`access(key)` = enabled ∧ permission), `frontend/src/features/settings/useClinicSpecialty.ts`
- Backend gate: `backend/middleware/featureGuard.js` (`requireFeature(key)`); CRUD `mount()` helper in `backend/routes/medical.js`
- Role overrides: `backend/middleware/permissions.js` (`requireEffectivePermission`), `backend/lib/rolePermissions.js`
- Settings UI: `frontend/src/features/settings/` — `SettingsLayout` (Specialty / Features / Roles tabs), `SpecialtyPage` (with live "features that change on save" preview), `FeaturesPage` (per-key overrides), `RolesPage` (role × permission matrix)
- Sidebar: `frontend/src/components/layout/Sidebar.tsx` already filters `NavItem`s by `feature` (enabled ∧ permission)
- Clinical MVP: `vital_signs`, `problem_list`, `vaccinations`, `body_region_findings` tables; SOAP fields on `clinical_notes` — `0008_medical_mvp.sql`
- Catalog mirrors: `backend/lib/features.js` + `frontend/src/lib/features.ts` (`FEATURE_KEYS`, ~19 entries today)

If you find yourself building one of the above from scratch, stop — extend it instead.
