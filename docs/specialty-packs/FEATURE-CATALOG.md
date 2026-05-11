# Feature Catalog — canonical key table

The agreed list of **every feature key**, live and planned. The `feature_definitions`
seed migration, `backend/lib/features.js`, and `frontend/src/lib/features.ts` `FEATURE_KEYS`
are all generated/checked against this table (catalog test enforces it).

Columns:
- **Key** — the `feature_key`
- **Cat** — `clinical` / `operations` / `admin`
- **default_specialties** — which specialties auto-enable it (`all` = the 11 codes; `all−dental` = the 10 non-dental)
- **default_permission** — gating permission (must exist in `backend/lib/rolePermissions.js`)
- **Status** — `live` (in code today) · `planned` · `in progress` · `done`
- **Phase** — roadmap phase that delivers it
- **Pack doc** — owning work order

> When you change a row's `Status`, also update [`README.md`](README.md)'s status board.
> When you change anything structural here, update the migration + the two mirrors in the same PR.

---

## A. Core — `default_specialties = all` (or `all−dental` today)

| Key | Cat | default_specialties | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|---|
| `dashboard` | operations | all | `settings.view` | live | — | — |
| `calendar` | operations | all | `appointments.view` | live | — | — |
| `waitingRoom` | operations | all | `appointments.view` | live | — | — |
| `patients` | clinical | all | `patients.view` | live | — | — |
| `treatments` | clinical | all | `treatments.view` | live | — | — |
| `prescriptions` | clinical | all | `prescriptions.view` | live | — | — |
| `medicaments` | operations | all | `prescriptions.view` | live | — | — |
| `insurance` | operations | all | `insurance.view` | live | — | — |
| `invoices` | operations | all | `invoices.view` | live | — | — |
| `inventory` | operations | all | `inventory.view` | live | — | — |
| `documents` | operations | all | `documents.view` | live | — | — |
| `reports` | operations | all | `reports.view` | live | — | — |
| `team` | admin | all | `team.view` | live | — | — |
| `settings` | admin | all | `settings.view` | live | — | — |
| `vitals` | clinical | **all** | `clinical.view` | live (promoted in `0012`) | 0 | [00](packs/00-phase-0-foundations.md) |
| `problemList` | clinical | **all** | `clinical.view` | live (promoted in `0012`) | 0 | [00](packs/00-phase-0-foundations.md) |
| `bodyRegionChart` | clinical | `all−dental` | `clinical.view` | live | — | (reused by derm/ortho — [03](packs/03-dermatology.md)/[07](packs/07-orthopedics.md)) |
| `clinicalNotes` | clinical | all | `clinical.view` | live (`0012`; UI surfaces deferred) | 0 | [00](packs/00-phase-0-foundations.md) |
| `allergies` | clinical | all | `clinical.view` | live (`0012`; UI surfaces deferred) | 0 | [00](packs/00-phase-0-foundations.md) |
| `medicationList` | clinical | all | `clinical.view` | live (`0012`; UI surfaces deferred) | 0 | [00](packs/00-phase-0-foundations.md) |
| `quotes` | operations | all | `quotes.view` | live (`0012`; UI surfaces deferred) | 0 | [00](packs/00-phase-0-foundations.md) |
| `referrals` | operations | all | `documents.view` | live (`0012`; UI in Phase 6) | 0 | [00](packs/00-phase-0-foundations.md) |
| `certificates` | operations | all | `documents.view` | live (`0012`; UI in Phase 6) | 0 | [00](packs/00-phase-0-foundations.md) |

> Note: `clinicalNotes`, `allergies`, `medicationList` may end up *not* gated (always-on,
> no feature key) — decided in Phase 0. If kept as keys, they sit here.

## B. Dental pack — `default_specialties = ['dental']`

| Key | Cat | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|
| `dentalChart` | clinical | `dentalChart.view` | live | — | [01](packs/01-dental.md) |
| `perioChart` | clinical | `dentalChart.view` | planned | 1 | [01](packs/01-dental.md) |
| `endoChart` | clinical | `clinical.view` | planned | 1 | [01](packs/01-dental.md) |
| `orthoModule` | clinical | `clinical.view` | planned | 1 | [01](packs/01-dental.md) |

## C. Pediatrics pack — `default_specialties = ['pediatrics']` (`vaccinations` = `['general_practice','pediatrics']`)

| Key | Cat | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|
| `vaccinations` | clinical | `clinical.view` | live | — | [02](packs/02-pediatrics.md) |
| `growthCharts` | clinical | `clinical.view` | planned | 2 | [02](packs/02-pediatrics.md) |
| `developmentMilestones` | clinical | `clinical.view` | planned | 2 | [02](packs/02-pediatrics.md) |
| `newbornScreening` | clinical | `clinical.view` | planned | 2 | [02](packs/02-pediatrics.md) |

## D. Dermatology pack — `default_specialties = ['dermatology']`

| Key | Cat | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|
| `dermAtlas` | clinical | `clinical.view` | planned | 3 | [03](packs/03-dermatology.md) |
| `skinProcedures` | clinical | `clinical.view` | planned | 3 | [03](packs/03-dermatology.md) |
| `cosmeticModule` | clinical | `clinical.view` | planned | 3 | [03](packs/03-dermatology.md) |

## E. Cardiology pack — `default_specialties = ['cardiology']` (some shared with `general_practice`)

| Key | Cat | default_specialties | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|---|
| `cardiacStudies` | clinical | `['cardiology']` | `clinical.view` | planned | 4 | [04](packs/04-cardiology.md) |
| `cardioRiskScores` | clinical | `['cardiology','general_practice']` | `clinical.view` | planned | 4 | [04](packs/04-cardiology.md) |
| `bpTrends` | clinical | `['cardiology','general_practice']` | `clinical.view` | planned | 4 | [04](packs/04-cardiology.md) |
| `anticoagClinic` | clinical | `['cardiology']` | `clinical.view` | planned | 4 | [04](packs/04-cardiology.md) |

## F. Ophthalmology pack — `default_specialties = ['ophthalmology']`

| Key | Cat | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|
| `visualAcuity` | clinical | `clinical.view` | planned | 4 | [05](packs/05-ophthalmology.md) |
| `tonometry` | clinical | `clinical.view` | planned | 4 | [05](packs/05-ophthalmology.md) |
| `fundusExam` | clinical | `clinical.view` | planned | 4 | [05](packs/05-ophthalmology.md) |
| `opticalDispensing` | operations | `inventory.view` | planned | 4 | [05](packs/05-ophthalmology.md) |

## G. ENT pack — `default_specialties = ['ent']`

| Key | Cat | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|
| `audiometry` | clinical | `clinical.view` | planned | 4 | [06](packs/06-ent.md) |
| `endoscopyEnt` | clinical | `clinical.view` | planned | 4 | [06](packs/06-ent.md) |
| `vestibularModule` | clinical | `clinical.view` | planned | 4 | [06](packs/06-ent.md) |

## H. Orthopaedics pack — `default_specialties = ['orthopedics']` (some shared with `general_practice`)

| Key | Cat | default_specialties | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|---|
| `orthoExam` | clinical | `['orthopedics']` | `clinical.view` | planned | 4 | [07](packs/07-orthopedics.md) |
| `fractureBoard` | clinical | `['orthopedics']` | `clinical.view` | planned | 4 | [07](packs/07-orthopedics.md) |
| `physioPlan` | clinical | `['orthopedics','general_practice']` | `treatments.view` | planned | 4 | [07](packs/07-orthopedics.md) |
| `injectionLog` | clinical | `['orthopedics']` | `clinical.view` | planned | 4 | [07](packs/07-orthopedics.md) |

## I. Gynaecology pack — `default_specialties = ['gynecology']` (`preventiveCare` shared)

| Key | Cat | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|
| `gynExam` | clinical | `clinical.view` | planned | 5 | [08](packs/08-gynecology.md) |
| `obstetrics` | clinical | `clinical.view` | planned | 5 | [08](packs/08-gynecology.md) |
| `partogram` | clinical | `clinical.view` | planned | 5 | [08](packs/08-gynecology.md) |

## J. Psychiatry pack — `default_specialties = ['psychiatry']`

| Key | Cat | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|
| `psychAssessments` | clinical | `clinical.view` | planned | 5 | [09](packs/09-psychiatry.md) |
| `psychNotes` | clinical | `clinical.psychSensitive.view` *(new perm)* | planned | 5 | [09](packs/09-psychiatry.md) |
| `carePlanPsych` | clinical | `treatments.view` | planned | 5 | [09](packs/09-psychiatry.md) |

## K. General Practice pack — `default_specialties = ['general_practice']` (plus the shared keys in E/H)

| Key | Cat | default_permission | Status | Phase | Pack doc |
|---|---|---|---|---|---|
| `chronicCare` | clinical | `clinical.view` | planned | 4 | [10](packs/10-general-practice.md) |
| `preventiveCare` | clinical | `['general_practice','pediatrics','gynecology']` → `clinical.view` | planned | 2/5 | [10](packs/10-general-practice.md) |

---

## New permissions introduced (track here)

| Permission | Introduced by | Status | Notes |
|---|---|---|---|
| `clinical.psychSensitive.view` (or generic `clinical.sensitive.view`) | psychiatry / gynaecology packs (Phase 5) | planned | restricts therapy / obstetric confidential notes; add to `ALL_PERMISSIONS`, role Sets, mirror in frontend, per-clinic toggle |

---

## Non-key configurable entities (Phase 6 — clinic-scoped tables, not feature keys)

| Entity | Table (suggested) | Seeded by | Status |
|---|---|---|---|
| Appointment types | `appointment_types` | `seedSpecialtyDefaults` per primary specialty | planned |
| Document / imaging kinds | `document_kinds` | `seedSpecialtyDefaults` | planned |
| Certificate templates | `certificate_templates` | `seedSpecialtyDefaults` | planned |
| Referral templates | `referral_templates` | `seedSpecialtyDefaults` | planned |
| Dashboard presets | `dashboard_presets` | `seedSpecialtyDefaults` | planned |

---

## Quick counts

- **Live today:** 19 keys (`dashboard, calendar, waitingRoom, patients, dentalChart, vitals, problemList, bodyRegionChart, vaccinations, treatments, prescriptions, insurance, invoices, inventory, medicaments, documents, reports, team, settings`).
- **Planned core additions:** up to 6 (`clinicalNotes, allergies, medicationList, quotes, referrals, certificates`) + 2 promotions (`vitals, problemList` → all).
- **Planned pack keys:** 31 across 10 packs.
- **Target total:** ~56 feature keys.
