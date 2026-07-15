# Pack: Gynaecology & Obstetrics  ·  Phase 5  ·  Status: `planned`

> "Primary specialty = Gynaecology ⇒ an OB/GYN system." Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §4.4. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md). **Depends on the confidential-note groundwork** done at the top of Phase 5 (see [09-psychiatry](09-psychiatry.md) §"Confidentiality groundwork").

Specialty codes covered: `gynecology` (+ shares `preventiveCare` with `general_practice`/`pediatrics`)

---

## 1. Goal

Primary specialty Gynaecology → patient record carries **obstetric history (GPA)**, and
when a patient is pregnant an **antenatal flowsheet** episode (LMP/EDD, GPA, per-visit
fundal height / fetal HR / ultrasound biometry), a **gyn exam** template (pelvic/breast,
Pap/HPV results, contraception plan, menstrual history), and optionally a **partogram**
for clinics that do deliveries. Dashboard: patients due (EDD this month), antenatal
visits this week, overdue Pap smears, high-risk pregnancies flagged. Obstetric/gyn notes
can be flagged confidential.

## 2. Feature keys this pack adds

| Key | Cat | default_specialties | default_permission | New? |
|---|---|---|---|---|
| `gynExam` | clinical | `['gynecology']` | `clinical.view` | yes |
| `obstetrics` | clinical | `['gynecology']` | `clinical.view` | yes |
| `partogram` | clinical | `['gynecology']` | `clinical.view` | yes |

Also turns on (shared): `preventiveCare` (Pap/mammo recall — see [10-general-practice](10-general-practice.md)). Reuses: `documents` (obstetric ultrasound), `vitals`, `prescriptions`, the confidential-note flag.

## 3. Data model

| Table | Key columns | Notes |
|---|---|---|
| `pregnancy_episodes` | `id, clinic_id, patient_id, lmp_date, edd_date, gravida, para, abortions, risk_level, status(ongoing/delivered/ended), outcome, started_at, ended_at, notes, sensitive bool` | one pregnancy |
| `antenatal_visits` | `id, pregnancy_episode_id, visit_date, gestational_weeks, fundal_height_cm, fetal_heart_rate, presentation, bp, urine_protein, weight_kg, ultrasound_biometry jsonb, notes` | flowsheet rows |
| `gyn_exams` | `id, clinic_id, patient_id, examined_at, examined_by, pelvic_exam jsonb, breast_exam jsonb, menstrual_history jsonb, contraception jsonb, notes, sensitive bool` | gyn visit |
| `cytology_results` | `id, clinic_id, patient_id, collected_at, pap_result, hpv_result, result_file_id?, next_due_date, notes` | Pap/HPV history + recall |
| `partograms` *(optional)* | `id, clinic_id, patient_id, pregnancy_episode_id, labour_started_at, observations jsonb (timepoints: cervix, contractions, fetal HR, descent, …)` | labour monitoring |

`sensitive` flags reuse the Phase-5 confidential-note enforcement. RLS for new tables per `0011`.

## 4. Layout profile — `SPECIALTY_PROFILES['gynecology']`

- **recordTabs:** Overview · **Obstetric history (GPA)** · Antenatal flowsheet (`obstetrics`, shown when an ongoing `pregnancy_episode` exists) · Gyn exam (`gynExam`) · Cytology (`cytology_results`) · Contraception · Vitals (`vitals`) · Problems (`problemList`) · Medications (`medicationList`) · Notes (`clinicalNotes`, confidential-capable) · Imaging (`documents`: obstetric US) · Billing
- **primaryChart:** `none` (an EDD countdown / pregnancy timeline widget instead)
- **dashboardPreset:** `gynecology` — patients due (EDD this month), antenatal visits this week, overdue Pap smears, high-risk pregnancies flagged
- **appointmentTypes:** gyn consultation, antenatal visit, postnatal visit, Pap smear, contraception/IUD, ultrasound, colposcopy, delivery
- **templates:** `prescription: gyn` (+ obstetric), `quote: generic`, `referral: gyn` (oncology / fertility), `certificate: maternityLeave` (+ antenatal record summary, obstetric US report)

## 5. Tasks

> Prereq (done at the start of Phase 5, shared with psychiatry): `clinical.psychSensitive.view`
> (or generic `clinical.sensitive.view`) permission + a `sensitive` flag enforcement path.

### Module: `gynExam`
- [ ] Catalog ×3 + seed (`['gynecology']`, perm `clinical.view`)
- [ ] Migration: `gyn_exams` + `cytology_results` + RLS; `sensitive` flag on `gyn_exams`
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('gynExam')`) · register; respect the `sensitive` flag in repo + controller
- [ ] Frontend: `features/gynecology/` · `api/gynExamApi.ts` · GynExamPage — pelvic/breast structured exam, menstrual history, contraception plan; CytologyPanel — Pap/HPV results + next-due recall
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tabs
- [ ] Tests: 200/403, plus a "no permission ⇒ sensitive rows hidden" test · component · Verification

### Module: `obstetrics`
- [ ] Catalog ×3 + seed · Migration: `pregnancy_episodes` + `antenatal_visits` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('obstetrics')`) · register; "start pregnancy episode" action computes EDD from LMP; antenatal-visit CRUD nested under an episode
- [ ] Frontend: `features/gynecology/` · `api/obstetricsApi.ts` · PregnancyEpisodePage — EDD countdown, GPA, antenatal flowsheet table (gestational weeks, FH, FHR, BP, urine protein, weight, US biometry), ultrasound attachment via `documents`
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab (conditional on ongoing episode)
- [ ] Tests · Verification

### Module: `partogram` (optional / clinics doing deliveries)
- [ ] Catalog ×3 + seed · Migration: `partograms` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('partogram')`) · register
- [ ] Frontend: `features/gynecology/` · `api/partogramApi.ts` · PartogramPage — labour monitoring chart (cervical dilation curve, contractions, fetal HR, descent over time)
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Pack-level
- [ ] `SPECIALTY_PROFILES['gynecology']` per §4 + `gynecology` dashboard preset (EDD this month, antenatal this week, overdue Paps, high-risk pregnancies)
- [ ] EDD-based recall + high-risk flag logic feeding the dashboard
- [ ] Document kinds: obstetric ultrasound, cytology report
- [ ] Inventory catalog seed: IUDs/implants, speculae, swabs, prenatal vitamins
- [ ] `seedSpecialtyDefaults(clinicId, ['gynecology'])` — gyn appointment types, document kinds, gyn/obstetric Rx + maternity-leave + antenatal-summary + US-report + referral templates, inventory catalog
- [ ] Confidential-note flag wired into the gyn/obstetric notes UI (toggle + lock icon)
- [ ] Coordinate `preventiveCare` (Pap/mammo recall) with [10-general-practice](10-general-practice.md)
- [ ] Sidebar grouping reviewed · i18n complete (FR/EN/AR) · [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 6. Verification

- [ ] Primary specialty `gynecology` → record shows GPA, gyn exam, cytology, contraception; starting a pregnancy episode adds the antenatal flowsheet tab with EDD countdown; dashboard shows EDD-this-month / overdue-Paps
- [ ] Confidential note: a staff member without `clinical.sensitive.view` cannot see notes/exams flagged `sensitive`; an admin/doctor with it can
- [ ] Switch away → gyn tabs/dashboard gone; switch back → restored; data preserved
- [ ] Clinic override pins `partogram` off → tab gone, route 403s

## 7. Open questions / decisions

- [ ] Pregnancy as an *episode* object (recommended) vs. flat antenatal-visit rows tied to the patient — episode wins (handles multiple pregnancies cleanly, EDD scoping)
- [ ] `sensitive` granularity: per-note flag (chosen) vs. whole-tab confidentiality vs. per-patient — per-note flag is the flexible default
- [ ] `partogram` ships in Phase 5 or deferred — most outpatient gyn clinics don't do deliveries; consider shipping it last/optional
- [ ] Cytology recall schedule (Pap every 3y / co-test every 5y / local guideline) — make configurable, seed with one default
