# Pack: Orthopaedics & Sports Medicine  ·  Phase 4  ·  Status: `planned`

> "Primary specialty = Orthopaedics ⇒ an ortho system." Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §4.9. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md). `physioPlan` is **shared with `general_practice`**; `orthoExam`/`injectionLog` ride on the `body_region_findings` model (see also [03-dermatology](03-dermatology.md) for the shared `discipline`/`details` extension).

Specialty codes covered: `orthopedics` (+ shares `physioPlan` with `general_practice`)

---

## 1. Goal

Primary specialty Orthopaedics → patient record has a **body/joint map** with
joint-specific **ROM / strength / special-tests** templates and limb measurements, a
**fracture board** (classification, immobilisation/cast log, follow-up X-ray schedule),
a **physiotherapy/rehab plan** (exercise programme + session tracking), and a **joint
injection log** (steroid / PRP / hyaluronic, site map). Dashboard: fractures due
follow-up X-ray, casts due removal, post-op rehab progress, MRI results to review.

## 2. Feature keys this pack adds

| Key | Cat | default_specialties | default_permission | New? |
|---|---|---|---|---|
| `orthoExam` | clinical | `['orthopedics']` | `clinical.view` | yes |
| `fractureBoard` | clinical | `['orthopedics']` | `clinical.view` | yes |
| `physioPlan` | clinical | `['orthopedics','general_practice']` | `treatments.view` | yes (shared) |
| `injectionLog` | clinical | `['orthopedics']` | `clinical.view` | yes |

Reuses: `bodyRegionChart` data model (`discipline='ortho'`/`'injection'`, `details` JSONB), `documents` (X-ray/MRI/CT), `treatments` (physio is treatment-flavoured).

## 3. Data model

| Table | Key columns | Notes |
|---|---|---|
| `body_region_findings` (+cols) | `discipline TEXT, details JSONB` | shared extension (see derm pack); ortho uses `discipline='ortho'` (ROM/strength/special tests in `details`) and `'injection'` |
| `joint_exams` *(or via body_region_findings)* | `id, clinic_id, patient_id, examined_at, examined_by, joint, rom jsonb, strength jsonb, special_tests jsonb, limb_measurements jsonb, notes` | joint-specific structured exam |
| `fractures` | `id, clinic_id, patient_id, site, classification, mechanism, diagnosed_at, treatment(closed/orif/cast), immobilisation_log jsonb, followup_xray_schedule jsonb, status(healing/united/nonunion), notes` | fracture board |
| `joint_injections` | `id, clinic_id, patient_id, joint, site_map jsonb, agent(steroid/prp/ha), product_lot, performed_at, performed_by, notes` | injection log |
| `physio_plans` | `id, clinic_id, patient_id, started_at, goals, exercises jsonb (name, sets, reps, frequency), status` | rehab programme |
| `physio_sessions` | `id, physio_plan_id, session_date, attendance, progress_notes, performed_by` | session tracking |

RLS for new tables per `0011`.

## 4. Layout profile — `SPECIALTY_PROFILES['orthopedics']`

- **recordTabs:** Overview · **Body/joint map** (`orthoExam`) · Fractures (`fractureBoard`) · Injections (`injectionLog`) · Physio plan (`physioPlan`) · Imaging (`documents`: X-ray/MRI/CT) · Notes (`clinicalNotes`) · Billing
- **primaryChart:** `bodyRegionChart` (joint-map mode)
- **dashboardPreset:** `orthopedics` — fractures due follow-up X-ray, casts due removal, post-op rehab progress, MRI results to review
- **appointmentTypes:** orthopaedic consultation, fracture clinic, cast change, joint injection, pre-op, post-op, physiotherapy, sports assessment
- **templates:** `prescription: ortho`, `quote: generic`, `referral: ortho` (surgery / physio), `certificate: workRestriction` (+ return-to-sport, + procedure consent)

## 5. Tasks

### Module: `orthoExam`
- [ ] Catalog ×3 + seed (`['orthopedics']`, perm `clinical.view`)
- [ ] Migration: `discipline`+`details` on `body_region_findings` (shared — coordinate with derm pack) and/or `joint_exams` table + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('orthoExam')`) · register
- [ ] Frontend: `features/orthopedics/` · `api/orthoExamApi.ts` · JointExamPage — clickable skeleton/joint picker, per-joint ROM (active/passive), strength (0–5), special-tests checklist (joint-specific sets: Lachman, McMurray, Hawkins, etc.), limb-length/girth measurements
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Module: `fractureBoard`
- [ ] Catalog ×3 + seed · Migration: `fractures` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('fractureBoard')`) · register; follow-up X-ray schedule feeds the dashboard
- [ ] Frontend: `features/orthopedics/` · `api/fracturesApi.ts` · FractureBoardPage — fracture record (site, classification, mechanism), immobilisation/cast timeline, X-ray follow-up scheduler, healing status
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Module: `physioPlan` (shared with GP)
- [ ] Catalog ×3 + seed (`['orthopedics','general_practice']`, perm `treatments.view`)
- [ ] Migration: `physio_plans` + `physio_sessions` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('physioPlan')`) · register
- [ ] Frontend: `features/orthopedics/` (or `clinical/`) · `api/physioApi.ts` · PhysioPlanPage — exercise programme builder (name/sets/reps/frequency), session log, progress chart
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab (also added to GP profile — coordinate with [10-general-practice](10-general-practice.md))
- [ ] Tests · Verification

### Module: `injectionLog`
- [ ] Catalog ×3 + seed · Migration: `joint_injections` (or `body_region_findings` with `discipline='injection'`) + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('injectionLog')`) · register; lot tracking links to `inventory`
- [ ] Frontend: `features/orthopedics/` · `api/injectionLogApi.ts` · InjectionLogPage — joint site-map, agent + lot, history
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Pack-level
- [ ] `SPECIALTY_PROFILES['orthopedics']` per §4 + `orthopedics` dashboard preset
- [ ] Document kinds: X-ray, MRI, CT, ultrasound (MSK)
- [ ] Inventory catalog seed: casting/splinting materials, braces, **injection kits (steroid/PRP/HA, lot tracked)**, crutches / aircast
- [ ] `seedSpecialtyDefaults(clinicId, ['orthopedics'])` — ortho appointment types, document kinds, Rx/referral/work-restriction/return-to-sport/consent templates, inventory catalog
- [ ] Add `physioPlan` to `SPECIALTY_PROFILES['general_practice']` `recordTabs` (coordinate with [10-general-practice](10-general-practice.md))
- [ ] Sidebar grouping reviewed · i18n complete (FR/EN/AR) · [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 6. Verification

- [ ] Primary specialty `orthopedics` → record shows joint map, fracture board, injections, physio plan tabs; dashboard shows fractures-due-X-ray / casts-due-removal
- [ ] Switch away → ortho tabs/dashboard gone; switch back → restored; data preserved
- [ ] A `general_practice` clinic auto-gets `physioPlan` (shared default) but not `orthoExam`/`fractureBoard`/`injectionLog`
- [ ] Clinic override pins `fractureBoard` off → tab gone, route 403s

## 7. Open questions / decisions

- [ ] Reuse `body_region_findings` (`discipline`/`details`) for joint exams + injections, or dedicated tables? (recommend the shared body-map model for the *map/plot* + a `joint_exams` table for the structured ROM/strength/tests; injections → shared model)
- [ ] Special-tests catalog: hard-code per-joint test lists in the frontend, or a config table? (hard-code for v1)
- [ ] `physioPlan` permission: `treatments.view` (it's treatment-like) — confirm assistants/doctors get sensible defaults in the role matrix
