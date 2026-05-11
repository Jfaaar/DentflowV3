# Pack: Dental  ·  Phase 1  ·  Status: `planned`

> "Primary specialty = Dental ⇒ the original Dentflow system." Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §4.2. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md). `dentalChart` is already live — this pack completes the dental workflow.

Specialty codes covered: `dental`

---

## 1. Goal

When a clinic's primary specialty is **Dental**: the patient record opens on the
**odontogram**, has a **perio chart** tab, treatment-plan items carry tooth + surface,
the dashboard shows chair utilisation / plan-acceptance / 6-month-recall / outstanding
estimates / lab-case tracker, prescriptions and the treatment **estimate** use dental
templates, and the inventory catalog is dental consumables + lab cases. Non-dental
clinics see none of it unless they enable `dental` or override the keys on.

## 2. Feature keys this pack adds

| Key | Cat | default_specialties | default_permission | New? |
|---|---|---|---|---|
| `dentalChart` | clinical | `['dental']` | `dentalChart.view` | no (live) |
| `perioChart` | clinical | `['dental']` | `dentalChart.view` | yes |
| `endoChart` | clinical | `['dental']` | `clinical.view` | yes |
| `orthoModule` | clinical | `['dental']` | `clinical.view` | yes |

Also turns on (core, already there): `treatments` (with tooth/surface UI), `quotes`
(dental estimate), `prescriptions` (dental presets), `documents` (panoramic/PA/BW/CBCT
kinds), `inventory` (dental catalog). Hides `bodyRegionChart` in the dental profile.

## 3. Data model

| Table | Key columns | Notes |
|---|---|---|
| `perio_charts` | `id, clinic_id, patient_id, charted_at, charted_by, notes` | one charting session |
| `perio_sites` | `id, perio_chart_id, tooth_number, position(buccal/lingual×mesial/mid/distal=6 sites), pocket_depth_mm, recession_mm, bleeding_on_probing bool, mobility, furcation, suppuration bool` | 6 rows per tooth |
| `endo_records` | `id, clinic_id, patient_id, tooth_number, treatment_date, canals jsonb (per-canal working length / file size / obturation), diagnosis, notes, treated_by` | |
| `ortho_episodes` | `id, clinic_id, patient_id, start_date, end_date, appliance_type, plan, status, photo_file_ids uuid[]` | a course of treatment |
| `ortho_visits` | `id, ortho_episode_id, visit_date, wire/bracket changes, adjustments, notes, photo_file_ids` | timeline entries |
| `dental_lab_cases` | `id, clinic_id, patient_id, treatment_plan_item_id?, lab_name, case_type(crown/bridge/denture/…), sent_date, due_date, received_date, status, notes` | lab-case board |

Existing dental tables (`dental_chart_entries`, treatment `tooth`/`surface` columns)
stay as-is. RLS for the new tables: copy the `DO $$ … FOREACH` block from `0011`.

## 4. Layout profile — `SPECIALTY_PROFILES['dental']`

- **recordTabs:** Overview · **Odontogram** (`dentalChart`) · Perio (`perioChart`) · Treatment plan (`treatments`, tooth/surface) · Notes (`clinicalNotes`) · Imaging (`documents`) · Estimates (`quotes`) · Billing
- **primaryChart:** `dentalChart`
- **dashboardPreset:** `dental` — chair utilisation, treatment-plan acceptance %, 6-month recall list, outstanding estimates, lab-case tracker, today's appointments
- **appointmentTypes:** exam/check-up, cleaning/scaling, filling, root canal, extraction, crown/bridge, implant, orthodontic adjustment, whitening, emergency
- **templates:** `prescription: dental` (analgesics / antibiotics / chlorhexidine presets), `quote: dentalEstimate` (per-tooth line items), `referral: dental` (oral surgeon / orthodontist), `certificate: generic` (+ a `post-op instructions` document)

## 5. Tasks

### Module: `perioChart` — Periodontal chart
- [ ] Catalog: FEATURE-CATALOG.md row · backend/lib/features.js · frontend/src/lib/features.ts · feature_definitions seed (`default_specialties=['dental']`, perm `dentalChart.view`)
- [ ] Migration: `perio_charts` + `perio_sites` (+ RLS, triggers, indexes)
- [ ] Backend: `perioRepository` · `perioService` · `perioController` (list/get/create/update/remove charts; sites created with the chart) · `validation/perio.js` · `routes/perio.js` (`requireFeature('perioChart')`) · register in `index.js`
- [ ] Permissions: reuses `dentalChart.view` / `dentalChart.update`
- [ ] Frontend: `features/dental/` · `api/perioApi.ts` · PerioChartPage · `<ToothSite6Point>` grid component, pocket-depth heatmap, history selector
- [ ] Route in App.tsx `<ProtectedRoute feature="perioChart">` · path in routes.ts
- [ ] Sidebar NavItem (clinical group, `feature="perioChart"`)
- [ ] i18n keys (FR/EN/AR)
- [ ] Layout profile: add to dental `recordTabs`
- [ ] Tests: route 200/403 · service unit (6-sites-per-tooth invariant) · frontend component · sidebar-hidden
- [ ] Verification: walkthrough

### Module: `endoChart` — Endodontic record
- [ ] Catalog (×3 locations + seed; perm `clinical.view`)
- [ ] Migration: `endo_records` (+ RLS/triggers/indexes)
- [ ] Backend: repo/service/controller/validation/route (`requireFeature('endoChart')`) · register
- [ ] Frontend: `features/dental/` · `api/endoApi.ts` · EndoRecordForm (per-canal table), tooth picker
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n
- [ ] Layout profile: optional sub-tab under Odontogram or its own tab
- [ ] Tests · Verification

### Module: `orthoModule` — Orthodontic tracking
- [ ] Catalog (×3 + seed; perm `clinical.view`)
- [ ] Migration: `ortho_episodes` + `ortho_visits` (+ RLS/triggers/indexes)
- [ ] Backend: repo/service/controller/validation/route (`requireFeature('orthoModule')`) · register
- [ ] Frontend: `features/dental/` · `api/orthoApi.ts` · OrthoEpisodePage (episode + visit timeline, photo gallery via `documents`)
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n
- [ ] Layout profile: add to dental `recordTabs` (conditionally — only if episode exists?)
- [ ] Tests · Verification

### Pack-level
- [ ] `SPECIALTY_PROFILES['dental']` filled per §4
- [ ] Treatment-plan item editor shows tooth + surface selector when `primaryChart === 'dentalChart'` (or `dentalChart` enabled)
- [ ] Dental estimate (`quote: dentalEstimate`) template — per-tooth line items, dental fee schedule
- [ ] Dental prescription presets (analgesics / antibiotics / chlorhexidine mouthwash)
- [ ] `dental_lab_cases` table + repo/service/controller/route + a Lab Cases board page (sidebar under operations); link items to `treatment_plan_items`
- [ ] Dental dashboard preset (`dental`) — chair utilisation, plan acceptance %, recall list, outstanding estimates, lab-case tracker
- [ ] `seedSpecialtyDefaults(clinicId, ['dental'])` — dental appointment types, dental document kinds, dental Rx/estimate/referral templates, dental consumable inventory catalog
- [ ] Sidebar grouping reviewed (dental clinical items appear; `bodyRegionChart` item hidden by its `default_specialties`)
- [ ] i18n complete (FR/EN/AR) for the whole pack
- [ ] [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 6. Verification

- [ ] New clinic, primary specialty `dental` → record opens on odontogram, has Perio tab, treatment plan has tooth/surface, dashboard = dental preset, Rx editor shows dental presets, inventory pre-seeded with dental items, Lab Cases board present
- [ ] Switch the same clinic's primary specialty to `general_practice` → dental tabs gone, generic dashboard, no tooth/surface; switch back → dental system returns; data preserved
- [ ] A GP clinic enables `dental` in `enabled_specialties` → odontogram/perio tabs appear but the *profile* (tab order/dashboard) stays GP unless it makes dental primary
- [ ] Clinic override: pin `perioChart` off in a dental clinic → Perio tab disappears, route 403s

## 7. Open questions / decisions

- [ ] Reuse existing `dental_chart_entries` for perio, or separate `perio_charts`/`perio_sites`? (recommend separate — perio is a 6-site-per-tooth time series, different shape)
- [ ] Lab cases: feature key (`dentalLab`) or just a sub-page under `inventory`/`treatments`? (leaning: a small feature key `dentalLab` so it can be toggled; add to catalog if so)
- [ ] Ortho: a feature key now, or fold into `treatments` with an "ortho plan" type? (keeping `orthoModule` as a key — photo timeline + visit cadence is distinct)
- [ ] Migrate the legacy free-form dental notes onto the SOAP fields, or leave both? (per `0008` comment, both stay)
