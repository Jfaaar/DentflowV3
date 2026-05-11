# Pack: General Practice / Family Medicine  ·  Phases 0 / 2 / 4 (incremental)  ·  Status: `planned`

> The current default specialty. Most of its surface is the **core layer** (Phase 0) plus
> keys shared from other packs. This doc tracks the *GP-specific* bits and the
> coordination needed so shared keys land in the GP layout profile. Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §4.1. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md).

Specialty codes covered: `general_practice` (the baseline profile other packs clone)

---

## 1. Goal

`general_practice` is the **fallback / generalist** profile. After Phase 0 it already has
the full core layer; this pack adds GP-flavoured modules — **chronic-disease dashboards**
(HTN / T2DM / asthma-COPD with recall lists) and a **preventive-care recall engine**
(due/overdue screenings: Pap, mammo, colon, vaccines, annual physical) — and makes sure
the keys shared with other specialties (`vaccinations`, `cardioRiskScores`, `bpTrends`,
`physioPlan`) show up in the GP layout profile.

## 2. Feature keys this pack adds / shares

| Key | Cat | default_specialties | default_permission | New? | Where built |
|---|---|---|---|---|---|
| `chronicCare` | clinical | `['general_practice']` | `clinical.view` | yes | this pack (Phase 4) |
| `preventiveCare` | clinical | `['general_practice','pediatrics','gynecology']` | `clinical.view` | yes | this pack (built ~Phase 2 alongside peds vaccination recall, broadened in Phase 5) |
| `vaccinations` | clinical | `['general_practice','pediatrics']` | `clinical.view` | no (live) | — |
| `cardioRiskScores` | clinical | `['cardiology','general_practice']` | `clinical.view` | yes | [04-cardiology](04-cardiology.md) |
| `bpTrends` | clinical | `['cardiology','general_practice']` | `clinical.view` | yes | [04-cardiology](04-cardiology.md) |
| `physioPlan` | clinical | `['orthopedics','general_practice']` | `treatments.view` | yes | [07-orthopedics](07-orthopedics.md) |

Plus all core keys (`vitals`, `problemList`, `clinicalNotes`, `allergies`, `medicationList`, `treatments`, `prescriptions`, `medicaments`, `insurance`, `invoices`, `inventory`, `documents`, `reports`, `referrals`, `certificates`, `dashboard`, `calendar`, `waitingRoom`, `patients`, `team`, `settings`).

## 3. Data model

| Table | Key columns | Notes |
|---|---|---|
| `screening_recalls` | `id, clinic_id, patient_id, screening_type(pap/mammo/colon/vaccine/annual_physical/…), last_done_at, next_due_at, status(due/overdue/done/declined), notes` | drives `preventiveCare` + the GP dashboard recall widget; also fed by gyn `cytology_results` and peds vaccination schedule |
| `lab_results` *(consider pulling earlier — also used by cardiology/derm)* | `id, clinic_id, patient_id, panel, analyte, value, unit, reference_range, collected_at, result_file_id?` | chronic-care dashboards + risk scores need structured labs |
| (chronic-disease dashboards) | — | computed views over `problem_list` + `vital_signs` + `lab_results` + `medications`; no dedicated table |

RLS for new tables per `0011`.

## 4. Layout profile — `SPECIALTY_PROFILES['general_practice']` (the baseline)

- **recordTabs:** Overview · Vitals (`vitals`) · Problems (`problemList`) · Medications (`medicationList`) · Allergies (`allergies`) · Notes (`clinicalNotes`, SOAP) · Vaccinations (`vaccinations`) · BP/lipid trends (`bpTrends`) · Risk scores (`cardioRiskScores`) · Physio plan (`physioPlan`, if active) · Documents · Billing
- **primaryChart:** `bodyRegionChart`
- **dashboardPreset:** `gp` — today's appointments, patients seen, revenue, **recall/overdue screenings count**, chronic-disease panel sizes (HTN/T2DM/asthma-COPD register sizes + % at target)
- **appointmentTypes:** consultation, follow-up, annual physical, vaccination, procedure, teleconsultation
- **templates:** `prescription: generic`, `quote: generic`, `referral: generic`, `certificate: sickNote` (+ fitness-to-work/school, travel certificate)

> Other specialties' profiles **clone this** in Phase 0, then override what they need.

## 5. Tasks

### Module: `preventiveCare` — screening/recall engine
- [ ] Catalog ×3 + seed (`['general_practice','pediatrics','gynecology']`, perm `clinical.view`)
- [ ] Migration: `screening_recalls` + RLS; backfill hooks from `cytology_results` (gyn) and the vaccination schedule (peds)
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('preventiveCare')`) · register; a "recalls due/overdue" query for the dashboard
- [ ] Frontend: `features/clinical/` (or `features/generalPractice/`) · `api/preventiveCareApi.ts` · ScreeningRecallPanel (per-patient due list, mark done/declined), and a clinic-wide overdue-recall report
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab (GP/peds/gyn profiles)
- [ ] Tests: due/overdue computation · component · Verification

### Module: `chronicCare` — chronic-disease dashboards
- [ ] Catalog ×3 + seed (`['general_practice']`, perm `clinical.view`)
- [ ] Migration: ensure `lab_results` exists (decide ownership — may be a tiny shared mini-pack in Phase 0/4) + RLS
- [ ] Backend: a `chronicCareService` exposing register membership + at-target % per condition (HTN/T2DM/asthma-COPD) from `problem_list` + `vital_signs` + `lab_results` + `medications`; route gated `requireFeature('chronicCare')`
- [ ] Frontend: `features/generalPractice/` · `api/chronicCareApi.ts` · ChronicCarePage — per-condition register, at-target gauges, drill-down patient lists; per-patient chronic-care summary widget
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Pack-level / coordination
- [ ] Finalise `SPECIALTY_PROFILES['general_practice']` per §4 (it's the baseline clone source — do this in Phase 0, refine as shared keys land)
- [ ] When [04-cardiology](04-cardiology.md) ships `cardioRiskScores`/`bpTrends` → add their tabs to the GP profile
- [ ] When [07-orthopedics](07-orthopedics.md) ships `physioPlan` → add its tab to the GP profile (conditional on an active plan)
- [ ] When [02-pediatrics](02-pediatrics.md) ships → confirm `vaccinations` recall feeds the GP `preventiveCare` engine
- [ ] `seedSpecialtyDefaults(clinicId, ['general_practice'])` — GP appointment types, generic Rx/referral/sick-note/fitness/travel-cert templates, general-consumables inventory catalog, common vaccines, basic injectables
- [ ] `gp` dashboard preset implemented (recall count + chronic-disease panels)
- [ ] Sidebar grouping reviewed · i18n complete (FR/EN/AR) · [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 6. Verification

- [ ] A `general_practice` clinic (the default) shows: SOAP notes, vitals, problems, meds, allergies, vaccinations, and — once built — risk scores / BP trends / physio plan / chronic-care / preventive-care recall; dashboard shows overdue-recall count + chronic-disease panels
- [ ] Other specialties' profiles correctly *start* from the GP baseline then diverge (spot-check dental vs cardiology)
- [ ] `preventiveCare` is auto-on for GP, peds, and gyn; off elsewhere

## 7. Open questions / decisions

- [ ] `lab_results` table — owned by GP pack, cardiology pack, or pulled into Phase 0 as shared infra? (recommend: a small shared "labs" mini-pack early in Phase 4, used by GP + cardiology + derm; or Phase 0 if it's quick)
- [ ] Chronic-disease list scope v1: HTN, T2DM, asthma/COPD — confirm; framework should make adding (CKD, hypothyroid, …) a config change
- [ ] Recall schedules (Pap/mammo/colon/annual physical intervals) — national guideline defaults, clinic-overridable; seed one set
