# Pack: Cardiology  ·  Phase 4  ·  Status: `planned`

> "Primary specialty = Cardiology ⇒ a cardiology system." Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §4.5. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md). Note `cardioRiskScores` + `bpTrends` are **shared with `general_practice`** (see [10-general-practice](10-general-practice.md)).

Specialty codes covered: `cardiology` (+ shares two keys with `general_practice`)

---

## 1. Goal

Primary specialty Cardiology → patient record has a **Cardiac studies** tab (ECG /
echocardiogram / stress test / Holter — structured findings + media attachment), **risk
scores** (ASCVD / Framingham / CHA₂DS₂-VASc / HAS-BLED auto-filled from vitals + labs),
**BP / lipid / HbA1c trend graphs** with home-BP-log import, and an **anticoagulation
clinic** (INR tracking + warfarin dosing log). Dashboard: studies pending report, INR
reviews due, BP-not-at-target panel, high-risk list, device follow-ups.

## 2. Feature keys this pack adds

| Key | Cat | default_specialties | default_permission | New? |
|---|---|---|---|---|
| `cardiacStudies` | clinical | `['cardiology']` | `clinical.view` | yes |
| `cardioRiskScores` | clinical | `['cardiology','general_practice']` | `clinical.view` | yes (shared) |
| `bpTrends` | clinical | `['cardiology','general_practice']` | `clinical.view` | yes (shared) |
| `anticoagClinic` | clinical | `['cardiology']` | `clinical.view` | yes |

Reuses: `vitals` (BP feeds trends + scores), `documents` (ECG strips, echo loops), `problemList`/`medicationList` (cardiac classes).

## 3. Data model

| Table | Key columns | Notes |
|---|---|---|
| `cardiac_studies` | `id, clinic_id, patient_id, study_type(ecg/echo/stress/holter/device_check), performed_at, performed_by, findings jsonb, conclusion, file_ids uuid[], report_status(pending/finalised)` | structured + media |
| `anticoag_logs` | `id, clinic_id, patient_id, drug(warfarin/…), measured_at, inr, target_range, dose_mg, next_review_date, notes, recorded_by` | INR/dosing time series |
| `home_bp_readings` *(optional)* | `id, clinic_id, patient_id, measured_at, systolic, diastolic, heart_rate, source(home/clinic)` | or extend `vital_signs` with a `source` column |

Risk scores: **computed** (no table) from `vital_signs` + lab values + `problem_list`;
optionally persist a `risk_score_snapshots` row when clinician records one.

## 4. Layout profile — `SPECIALTY_PROFILES['cardiology']`

- **recordTabs:** Overview · **Cardiac studies** (`cardiacStudies`) · BP/lipid trends (`bpTrends`) · Risk scores (`cardioRiskScores`) · Vitals (`vitals`) · Problems (`problemList`, cardiac) · Medications (`medicationList`, cardiac classes) · Notes (`clinicalNotes`) · Imaging (`documents`) · Billing
- **primaryChart:** `none` (trend graphs instead of a body chart)
- **dashboardPreset:** `cardiology` — studies pending report, INR reviews due, BP-not-at-target panel, high-risk (ASCVD ≥20%) list, device follow-ups
- **appointmentTypes:** cardiology consultation, ECG, echocardiogram, stress test, Holter fit/removal, pacemaker check, anticoagulation review, follow-up
- **templates:** `prescription: cardio`, `quote: generic`, `referral: cardio` (consultation letter / counter-referral), `certificate: surgicalClearance` (fitness-for-surgery)

## 5. Tasks

### Module: `cardiacStudies`
- [ ] Catalog ×3 + seed (`['cardiology']`, perm `clinical.view`)
- [ ] Migration: `cardiac_studies` + RLS/triggers/indexes
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('cardiacStudies')`) · register; media via `documents`
- [ ] Frontend: `features/cardiology/` · `api/cardiacStudiesApi.ts` · StudiesPage (study-type-specific structured forms, media attach, report-status workflow)
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Module: `cardioRiskScores` (shared with GP)
- [ ] Catalog ×3 + seed (`['cardiology','general_practice']`, perm `clinical.view`)
- [ ] No table (computed); optional `risk_score_snapshots` migration
- [ ] Backend: a `riskScoresService` exposing computed scores via `/clinical/risk-scores?patientId=` (gated `requireFeature('cardioRiskScores')`)
- [ ] Frontend: `features/cardiology/` (or `clinical/`) · RiskScoresPanel — ASCVD / Framingham / CHA₂DS₂-VASc / HAS-BLED calculators, inputs auto-filled from vitals/labs/problems, manual override, history
- [ ] Route/panel embedding + ProtectedRoute + routes.ts · Sidebar NavItem (or tab only) · i18n · layout tab (also added to GP profile)
- [ ] Tests: each score's math against published examples · component · Verification

### Module: `bpTrends` (shared with GP)
- [ ] Catalog ×3 + seed (`['cardiology','general_practice']`, perm `clinical.view`)
- [ ] Migration: `source` column on `vital_signs` (or `home_bp_readings` table) for home-log import
- [ ] Backend: import endpoint (CSV / manual entry of home BP log), trend query
- [ ] Frontend: `features/cardiology/` (or `clinical/`) · TrendsPanel — BP / weight / lipid / HbA1c line charts, home-log import dialog, at-target shading
- [ ] Route/panel + ProtectedRoute + routes.ts · Sidebar NavItem/tab · i18n · layout tab (also GP profile)
- [ ] Tests · Verification

### Module: `anticoagClinic`
- [ ] Catalog ×3 + seed · Migration: `anticoag_logs` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('anticoagClinic')`) · register
- [ ] Frontend: `features/cardiology/` · `api/anticoagApi.ts` · AnticoagPage (INR/dose log, target band, next-review scheduler) + a clinic-wide "INR reviews due" list
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Pack-level
- [ ] `SPECIALTY_PROFILES['cardiology']` per §4 + `cardiology` dashboard preset
- [ ] Document kinds: ECG strip, echo loop/report, stress-test report, Holter report
- [ ] Inventory catalog seed: ECG electrodes, Holter supplies, stress-test consumables
- [ ] `seedSpecialtyDefaults(clinicId, ['cardiology'])` — cardio appointment types, document kinds, Rx/referral/clearance templates, inventory catalog
- [ ] Add `cardioRiskScores` + `bpTrends` to `SPECIALTY_PROFILES['general_practice']` `recordTabs` too (coordinate with [10-general-practice](10-general-practice.md))
- [ ] Sidebar grouping reviewed · i18n complete (FR/EN/AR) · [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 6. Verification

- [ ] Primary specialty `cardiology` → record has Cardiac studies + Risk scores + Trends + Anticoag tabs; scores auto-fill from vitals; dashboard shows studies-pending / INR-due
- [ ] Switch away → cardio tabs/dashboard gone; switch back → restored; data preserved
- [ ] A `general_practice` clinic auto-gets `cardioRiskScores` + `bpTrends` (shared default) but not `cardiacStudies`/`anticoagClinic`
- [ ] Clinic override pins `anticoagClinic` off → tab gone, route 403s

## 7. Open questions / decisions

- [ ] Where do lab values (lipids, HbA1c, creatinine for HAS-BLED) come from — a `lab_results` table (new), manual entry, or `documents` parsing? (likely a small `lab_results` table — also useful for GP/derm; consider pulling it into Phase 0 or a shared mini-pack)
- [ ] Risk-score snapshots: persist on record, or always recompute? (recommend: persist a snapshot when the clinician saves it, recompute live otherwise)
- [ ] Home-BP import format — CSV from common BP apps, or just manual table entry? (start manual + CSV)
