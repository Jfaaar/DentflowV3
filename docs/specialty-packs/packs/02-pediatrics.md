# Pack: Pediatrics  ·  Phase 2  ·  Status: `planned`

> "Primary specialty = Pediatrics ⇒ a paediatric system." Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §4.3. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md). Mostly additive forms; reuses `vital_signs` and the live `vaccinations` module.

Specialty codes covered: `pediatrics`

---

## 1. Goal

Primary specialty Pediatrics → patient record shows **age in y/m/d** and a required
guardian block; tabs include **Growth charts** (WHO/CDC percentiles), **Milestones**
(Denver/ASQ), age-aware vitals, vaccination history + due-schedule recall, and the Rx
editor has a **mg/kg dosing helper** reading the latest weight. Dashboard surfaces
vaccinations due, well-baby visits, growth-flag alerts, newborn follow-ups.

## 2. Feature keys this pack adds

| Key | Cat | default_specialties | default_permission | New? |
|---|---|---|---|---|
| `vaccinations` | clinical | `['general_practice','pediatrics']` | `clinical.view` | no (live) |
| `growthCharts` | clinical | `['pediatrics']` | `clinical.view` | yes |
| `developmentMilestones` | clinical | `['pediatrics']` | `clinical.view` | yes |
| `newbornScreening` | clinical | `['pediatrics']` | `clinical.view` | yes |

Also relies on core: `vitals` (age-aware ranges), `prescriptions` (mg/kg helper), `patients` (age/guardian display).

## 3. Data model

| Table | Key columns | Notes |
|---|---|---|
| `vital_signs` (+col) | `head_circumference_cm NUMERIC(4,1)` | growth charts need HC for under-3s |
| `development_screenings` | `id, clinic_id, patient_id, screened_at, instrument(denver/asq/…), domain results jsonb, overall_result, screened_by, notes` | scored milestone checklist |
| `newborn_screenings` | `id, clinic_id, patient_id, apgar_1min, apgar_5min, metabolic_screen_result, hearing_screen_result, bilirubin readings jsonb, notes, recorded_by` | neonatal |

Growth **percentiles are computed** from `vital_signs` rows against bundled WHO/CDC LMS
reference tables — no table; ship the reference data as a JSON asset.

## 4. Layout profile — `SPECIALTY_PROFILES['pediatrics']`

- **recordTabs:** Overview (age y/m/d, guardian) · **Growth** (`growthCharts`) · Milestones (`developmentMilestones`) · Vitals (`vitals`, age-aware) · Vaccinations (`vaccinations`) · Problems (`problemList`) · Medications (`medicationList`, mg/kg) · Notes (`clinicalNotes`) · Documents · Billing
- **primaryChart:** `growthCharts`
- **dashboardPreset:** `pediatrics` — vaccines due this week, well-baby visits scheduled, growth-flag alerts (crossing ≥2 percentile bands), newborn follow-ups
- **appointmentTypes:** well-baby visit, sick visit, vaccination, newborn check, developmental assessment, follow-up
- **templates:** `prescription: pediatric` (mg/kg helper), `quote: generic`, `referral: pediatricSubspecialty`, `certificate: schoolAbsence` (+ vaccination certificate)

## 5. Tasks

### Module: `growthCharts` — Growth percentiles
- [ ] Catalog ×3 + seed (`['pediatrics']`, perm `clinical.view`)
- [ ] Migration: `head_circumference_cm` on `vital_signs`
- [ ] Bundle WHO 0–5y + CDC 2–20y LMS tables as a JSON asset (backend or frontend)
- [ ] Backend: extend vitals service to expose percentile/z-score; (no new route strictly needed — could be a computed field on `/vitals`)
- [ ] Frontend: `features/pediatrics/` · GrowthChartPage — weight-for-age, height-for-age, HC-for-age, BMI-for-age curves with the patient's points overlaid; percentile readout per measurement
- [ ] Route + ProtectedRoute(feature="growthCharts") + routes.ts · Sidebar NavItem · i18n
- [ ] Layout profile: primaryChart + Growth tab
- [ ] Tests: percentile math against known reference points · component · sidebar-hidden
- [ ] Verification

### Module: `developmentMilestones`
- [ ] Catalog ×3 + seed · Migration: `development_screenings`
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('developmentMilestones')`) · register
- [ ] Frontend: `features/pediatrics/` · `api/milestonesApi.ts` · MilestonesPage (instrument picker, domain checklist, scored result, history)
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Module: `newbornScreening`
- [ ] Catalog ×3 + seed · Migration: `newborn_screenings`
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('newbornScreening')`) · register
- [ ] Frontend: `features/pediatrics/` · `api/newbornApi.ts` · NewbornScreeningForm (Apgar, metabolic, hearing, bilirubin curve)
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n
- [ ] Tests · Verification

### Pack-level
- [ ] Patient record/header shows age in y/m/d when primary specialty `pediatrics`; guardian block required
- [ ] Age-aware vitals reference ranges (paediatric BP/HR/RR by age)
- [ ] Rx editor mg/kg dosing helper (reads latest `vital_signs.weight_kg`)
- [ ] Vaccination **due-schedule** recall logic (national EPI schedule by age) feeding the dashboard
- [ ] `SPECIALTY_PROFILES['pediatrics']` filled per §4 + `pediatrics` dashboard preset
- [ ] `seedSpecialtyDefaults(clinicId, ['pediatrics'])` — paediatric appointment types, vaccine fridge inventory catalog, paediatric Rx/cert templates
- [ ] Sidebar grouping reviewed · i18n complete (FR/EN/AR) · [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 6. Verification

- [ ] Primary specialty `pediatrics` → record opens on growth chart, age shows y/m/d, milestones tab present, Rx editor has mg/kg helper, dashboard shows vaccines-due
- [ ] Switch away → paediatric tabs/dashboard gone; switch back → restored; data preserved
- [ ] GP clinic: `vaccinations` already on (shared default); enabling `pediatrics` adds growth/milestones/newborn

## 7. Open questions / decisions

- [ ] Which growth reference — WHO only, or WHO 0–5 + CDC 2–20 (typical hybrid)? Affects the bundled asset.
- [ ] Vaccination schedule source — Morocco EPI? Configurable per clinic? (start with one national schedule, make it overridable later)
- [ ] mg/kg helper: a generic Rx-editor feature gated behind paediatric profile, or its own toggle? (recommend: profile-driven, no separate key)
