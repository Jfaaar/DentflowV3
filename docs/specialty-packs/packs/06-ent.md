# Pack: ENT / Otolaryngology  ·  Phase 4  ·  Status: `planned`

> "Primary specialty = ENT ⇒ an ENT system." Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §4.7. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md).

Specialty codes covered: `ent`

---

## 1. Goal

Primary specialty ENT → patient record has an **audiogram** (pure-tone thresholds per
ear, tympanogram, speech audiometry), **endoscopy findings** (nasal / laryngeal /
otoscopy — structured + media), and a **vestibular work-up** module (Dix-Hallpike,
caloric test, balance assessment). Dashboard: audiometry results to review, hearing-aid
follow-ups, post-op patients, sleep-study referrals pending.

## 2. Feature keys this pack adds

| Key | Cat | default_specialties | default_permission | New? |
|---|---|---|---|---|
| `audiometry` | clinical | `['ent']` | `clinical.view` | yes |
| `endoscopyEnt` | clinical | `['ent']` | `clinical.view` | yes |
| `vestibularModule` | clinical | `['ent']` | `clinical.view` | yes |

Reuses: `documents` (endoscopy stills/video, CT sinus), `prescriptions`, `bodyRegionChart` (head/ear/nose/throat regions, optional).

## 3. Data model

| Table | Key columns | Notes |
|---|---|---|
| `audiograms` | `id, clinic_id, patient_id, tested_at, tested_by, pta_od jsonb (freq→dB), pta_os jsonb, tympanogram_od/os jsonb, speech_recognition_od/os, masking_used, notes` | per-ear threshold curves |
| `ent_endoscopies` | `id, clinic_id, patient_id, performed_at, performed_by, region(nasal/laryngeal/otoscopy), findings jsonb, file_ids uuid[], notes` | scoped findings + media |
| `vestibular_assessments` | `id, clinic_id, patient_id, performed_at, performed_by, dix_hallpike jsonb, caloric_test jsonb, balance_tests jsonb, diagnosis, notes` | vertigo work-up |

RLS for new tables per `0011`.

## 4. Layout profile — `SPECIALTY_PROFILES['ent']`

- **recordTabs:** Overview · **Audiogram** (`audiometry`) · Endoscopy (`endoscopyEnt`) · Vestibular (`vestibularModule`) · Vitals (`vitals`) · Problems (`problemList`) · Medications (`medicationList`) · Notes (`clinicalNotes`) · Imaging (`documents`) · Billing
- **primaryChart:** `bodyRegionChart` (head/ENT mode) or `none`
- **dashboardPreset:** `ent` — audiometry results to review, hearing-aid follow-ups, post-op patients, sleep-study referrals pending
- **appointmentTypes:** ENT consultation, audiometry, endoscopy (nasal/laryngeal), ear microsuction, vertigo assessment, allergy testing, pre-op, follow-up
- **templates:** `prescription: ent`, `quote: generic`, `referral: ent` (consultation letter / hearing-aid recommendation), `certificate: noiseExposure`

## 5. Tasks

### Module: `audiometry`
- [ ] Catalog ×3 + seed (`['ent']`, perm `clinical.view`)
- [ ] Migration: `audiograms` + RLS/triggers/indexes
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('audiometry')`) · register
- [ ] Frontend: `features/ent/` · `api/audiogramApi.ts` · AudiogramPage — interactive PTA chart (frequency × dB, AC/BC symbols per ear), tympanogram type picker, speech-recognition fields, history overlay
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Module: `endoscopyEnt`
- [ ] Catalog ×3 + seed · Migration: `ent_endoscopies` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('endoscopyEnt')`) · register; media via `documents`
- [ ] Frontend: `features/ent/` · `api/endoscopyApi.ts` · EndoscopyPage — region-specific structured findings, media gallery
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Module: `vestibularModule`
- [ ] Catalog ×3 + seed · Migration: `vestibular_assessments` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('vestibularModule')`) · register
- [ ] Frontend: `features/ent/` · `api/vestibularApi.ts` · VestibularPage — Dix-Hallpike result, caloric test inputs, balance test checklist, diagnosis
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Pack-level
- [ ] `SPECIALTY_PROFILES['ent']` per §4 + `ent` dashboard preset
- [ ] Document kinds: endoscopy still/video, CT sinus
- [ ] Inventory catalog seed: ear-wick / microsuction supplies, nasal packs, endoscope sheaths
- [ ] `seedSpecialtyDefaults(clinicId, ['ent'])` — ENT appointment types, document kinds, Rx/referral/hearing-aid/noise-exposure templates, inventory catalog
- [ ] Sidebar grouping reviewed · i18n complete (FR/EN/AR) · [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 6. Verification

- [ ] Primary specialty `ent` → record shows audiogram, endoscopy, vestibular tabs; dashboard shows audiometry-to-review etc.
- [ ] Switch away → ENT tabs/dashboard gone; switch back → restored; data preserved
- [ ] Clinic override pins `vestibularModule` off → tab gone, route 403s

## 7. Open questions / decisions

- [ ] Audiogram rendering: build a custom SVG chart, or a lib? (custom SVG — small, and audiogram symbol conventions are specific)
- [ ] Hearing-aid fitting/follow-up: part of `audiometry`, or its own mini-module? (fold into `audiometry` + a dashboard widget for now)
- [ ] Sleep study (OSA) referrals: just a referral template + dashboard widget, or a tracked module? (template + widget for now)
