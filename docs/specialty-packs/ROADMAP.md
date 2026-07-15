# Roadmap — Specialty Packs

Phases are ordered by **value × independence**. Each phase is shippable on its own;
later phases assume earlier ones landed. Tick the boxes; update [`README.md`](README.md)'s
status board when a phase changes state.

Conventions used in this file:
- `[ ]` task · `[x]` done
- "↳ doc" = the pack work-order with the detailed checklist
- "DoD" = the phase's exit criteria

---

## Phase 0 — Foundations & cleanup  ·  ↳ [packs/00-phase-0-foundations.md](packs/00-phase-0-foundations.md)

**Why first:** no new clinical modules, but it lays the rails everything else rides on
(core key promotion, `SPECIALTY_PROFILES`, catalog test, lazy-seed hook). Low risk,
unblocks the rest.

- [ ] Decide & document core-vs-pack split for `vitals`, `problemList` (→ promote to all 11)
- [ ] Add core keys `clinicalNotes`, `allergies`, `medicationList`; surface `quotes` as a feature key; add `referrals`, `certificates`
- [ ] Migration `00XX_core_feature_keys.sql`: update/insert `feature_definitions` rows; re-run is idempotent (`ON CONFLICT DO UPDATE`)
- [ ] Mirror new keys in `backend/lib/features.js` + `frontend/src/lib/features.ts` `FEATURE_KEYS`
- [ ] Catalog test: assert `FEATURE_KEYS` (both mirrors) == `feature_definitions` rows == [`FEATURE-CATALOG.md`](FEATURE-CATALOG.md) table; assert `default_specialties` ⊆ 11-code whitelist
- [ ] `frontend/src/features/settings/specialtyProfiles.ts`: `SPECIALTY_PROFILES` map keyed by `SpecialtyCode` (record tabs, `primaryChart`, `dashboardPreset`, appointment-type seeds, template ids) — seeded with **today's** behaviour (dental vs generic)
- [ ] Refactor `useClinicSpecialty` to expose `profile = SPECIALTY_PROFILES[primarySpecialty]`; replace ad-hoc `isDental` usages
- [ ] Patient record / Dashboard / `AppointmentModal` read tab order / preset / appt types from the profile (behaviour-preserving refactor)
- [ ] `settingsService.update`: when `enabled_specialties` *grows*, call a `seedSpecialtyDefaults(clinicId, addedCodes)` stub (no-op until packs add seeds); never delete on shrink
- [ ] i18n keys for the new feature labels (FR/EN/AR)

**DoD:** app behaves exactly as today; `SPECIALTY_PROFILES` exists and is the source of
record-tab order; catalog test green; adding a feature key is now a documented 1-file-list change.

---

## Phase 1 — Dental pack  ·  ↳ [packs/01-dental.md](packs/01-dental.md)

**Why now:** it's the original product; "switch primary specialty → Dental ⇒ full dental
system" is the headline demo. `dentalChart` already exists — this completes it.

- [ ] New keys: `perioChart`, `endoChart`, `orthoModule` (`default_specialties = ['dental']`)
- [ ] Migration: `perio_charts` + `perio_sites`, `endo_records`, `ortho_episodes` + `ortho_visits` (tenant-scoped, RLS per `0003`/`0008`); lab-case tracking table (`dental_lab_cases`)
- [ ] Backend: repos/services/controllers/routes for each, gated by `requireFeature`
- [ ] Frontend: Perio chart UI (6-point per tooth), endo record form, ortho episode tracker, lab-case board; under `features/dental/`
- [ ] Dental layout profile: record tabs = Overview · Odontogram · Perio · Treatment plan · Notes · Imaging · Estimates · Billing; `primaryChart = 'dentalChart'`; appointment types (exam, cleaning, filling, root canal, extraction, crown/bridge, implant, ortho adjustment, whitening, emergency); templates (dental estimate, dental Rx presets, dental referral, post-op instructions); dental dashboard preset (chair utilisation, plan acceptance %, recall list, outstanding estimates, lab-case tracker)
- [ ] Seed dental defaults via `seedSpecialtyDefaults`
- [ ] Treatment-plan items show tooth+surface selector when `primary_specialty === 'dental'` (or `dentalChart` enabled)
- [ ] Inventory: dental consumable catalog seed
- [ ] i18n (FR/EN/AR), sidebar entries, `App.tsx` routes, tests
- [ ] Verification walkthrough recorded in the pack doc

**DoD:** a clinic set to primary specialty Dental gets odontogram + perio + dental
treatment plans + dental dashboard + dental templates; non-dental clinics see none of it
unless they enable `dental` or override.

---

## Phase 2 — Pediatrics pack  ·  ↳ [packs/02-pediatrics.md](packs/02-pediatrics.md)

**Why now:** high demand, mostly additive forms; reuses `vital_signs` (add head
circumference) and `vaccinations` (already live).

- [ ] New keys: `growthCharts`, `developmentMilestones`, `newbornScreening` (`default_specialties = ['pediatrics']`); confirm `vaccinations` stays `['general_practice','pediatrics']`
- [ ] Migration: `head_circumference_cm` on `vital_signs`; `development_screenings`, `newborn_screenings` tables; (growth percentiles computed, no table)
- [ ] Backend + frontend per the recipe
- [ ] Growth-chart rendering (WHO/CDC percentile curves; weight/height/HC/BMI-for-age)
- [ ] Pediatric layout profile: record shows age in y/m/d, guardian block required; tabs = Overview · Growth · Milestones · Vitals(age-aware) · Vaccinations · Problems · Medications(mg/kg helper) · Notes · Documents · Billing; appointment types (well-baby, sick, vaccination, newborn check, developmental assessment, follow-up); dashboard preset (vaccines due, well-baby scheduled, growth-flag alerts, newborn follow-ups); templates (pediatric Rx with mg/kg, school absence cert, vaccination cert)
- [ ] mg/kg dosing helper in the Rx editor (reads latest weight from `vital_signs`)
- [ ] Seed peds defaults; i18n; sidebar; routes; tests; verification

**DoD:** primary specialty Pediatrics ⇒ growth charts, milestones, age-aware vitals,
vaccination recall, mg/kg Rx helper.

---

## Phase 3 — Dermatology pack  ·  ↳ [packs/03-dermatology.md](packs/03-dermatology.md)

**Why now:** strong fit for private clinics; mostly photo + scoring UI on top of the
existing `body_region_findings` model.

- [ ] New keys: `dermAtlas`, `skinProcedures`, `cosmeticModule` (`default_specialties = ['dermatology']`)
- [ ] Migration: extend `body_region_findings` with `discipline` + JSON `details` (reused by derm/ortho/injectionLog) OR `skin_lesions`; `skin_procedures` (type, site, histopath `result_id`), `cosmetic_sessions` (treatment, injection map JSON, before/after `file_id`s, package id)
- [ ] Backend + frontend per recipe; before/after photo timeline component (reuses `documents`)
- [ ] Scoring widgets: ABCDE, PASI, SCORAD, DLQI (computed, history kept)
- [ ] Derm layout profile: tabs = Overview · Skin map · Dermoscopy gallery · Procedures · Scores · Notes · Medications · Imaging · Billing; appointment types (consult, mole check, biopsy, excision, cryo, laser, phototherapy, cosmetic consult, botox/filler, follow-up); dashboard preset (biopsy results pending, lesions for re-check, phototherapy course progress, cosmetic sessions remaining); templates (histopath request, derm referral, procedure consent + post-care, cosmetic plan/quote)
- [ ] Inventory: liquid nitrogen, biopsy punches, **fillers/toxins lot+expiry tracked**
- [ ] Seed derm defaults; i18n; sidebar; routes; tests; verification

**DoD:** primary specialty Dermatology ⇒ lesion body-map + dermoscopy gallery + procedure
log + scoring + cosmetic package tracking + before/after timelines.

---

## Phase 4 — Cardiology / Ophthalmology / ENT / Orthopaedics
↳ [packs/04-cardiology.md](packs/04-cardiology.md) · [packs/05-ophthalmology.md](packs/05-ophthalmology.md) · [packs/06-ent.md](packs/06-ent.md) · [packs/07-orthopedics.md](packs/07-orthopedics.md)

**Why grouped:** each is heavier (its own structured-findings UI: per-eye / per-ear /
per-joint / study-typed). Independent of each other — parallelizable, ship one at a time.

- [ ] **Cardiology:** keys `cardiacStudies`, `cardioRiskScores`(also GP), `bpTrends`(also GP), `anticoagClinic`; tables `cardiac_studies`, `anticoag_logs`; risk-score calculators (ASCVD/Framingham/CHA₂DS₂-VASc/HAS-BLED) auto-filled from vitals+labs; trend graphs (BP/lipid/HbA1c) + home-BP log import; layout profile + dashboard (studies pending report, INR reviews due, BP-not-at-target, high-risk list, device follow-ups) + templates (ECG/echo report, cardiology letter, surgical clearance)
- [ ] **Ophthalmology:** keys `visualAcuity`, `tonometry`, `fundusExam`, `opticalDispensing`(operations, links inventory); table `eye_exams` (per-eye OD/OS: VA, refraction sph/cyl/axis/add, IOP, segment findings), `glasses_prescriptions`; layout profile (per-eye data, refraction tab) + dashboard (glaucoma IOP-not-controlled, diabetic screening recalls, glasses orders ready, post-cataract follow-ups) + templates (glasses Rx, contact-lens Rx, ophthal referral, driving-vision cert); inventory: dilating drops, diagnostic lenses, **frames & lens stock**
- [ ] **ENT:** keys `audiometry`, `endoscopyEnt`, `vestibularModule`; tables `audiograms` (per-ear thresholds JSON), `ent_endoscopies`, `vestibular_assessments`; layout profile + dashboard (audiometry to review, hearing-aid follow-ups, post-op patients, sleep-study referrals) + templates (audiogram report, ENT letter, hearing-aid recommendation, noise-exposure cert)
- [ ] **Orthopaedics:** keys `orthoExam`, `fractureBoard`, `physioPlan`(also GP), `injectionLog`; tables `joint_exams`, `fractures` (classification, immobilisation log, follow-up X-ray schedule), `joint_injections`, `physio_plans` + `physio_sessions`; layout profile (body/joint map, ROM/strength/special tests) + dashboard (fractures due X-ray, casts due removal, post-op rehab progress, MRI to review) + templates (imaging request, ortho referral, work-restriction/return-to-sport cert, procedure consent); inventory: casting materials, braces, **injection kits lot-tracked**, crutches/aircast
- [ ] For each: seed defaults, i18n, sidebar, routes, tests, verification

**DoD:** each of the four primary specialties produces its own system; shared keys
(`cardioRiskScores`, `bpTrends`, `physioPlan`) also appear in GP clinics.

---

## Phase 5 — Gynaecology / Psychiatry
↳ [packs/08-gynecology.md](packs/08-gynecology.md) · [packs/09-psychiatry.md](packs/09-psychiatry.md)

**Why last (of the clinical packs):** both need the **extra-confidential note** model
built first (obstetric/gyn notes and therapy/psych notes restricted from some staff).

- [ ] **Confidentiality groundwork:** add `clinical.psychSensitive.view` (and/or a generic `clinical.sensitive.view`) permission to `backend/lib/rolePermissions.js` + `frontend/src/lib/permissions.ts` + Roles page; a `sensitive` flag on the relevant note tables; enforcement in repos + UI; per-clinic toggle for who gets it
- [ ] **Gynaecology:** keys `gynExam`, `obstetrics`, `partogram`; tables `pregnancy_episodes`, `antenatal_visits`, `gyn_exams`, `cytology_results`; pregnancy = an episode with EDD countdown; antenatal flowsheet (fundal height, fetal HR, ultrasound biometry); layout profile (GPA history, antenatal tab when pregnant, cytology, contraception) + dashboard (EDD this month, antenatal visits this week, overdue Paps, high-risk pregnancies) + templates (antenatal summary, obstetric US report, maternity leave cert, gyn referral); appointment types (gyn consult, antenatal, postnatal, Pap, contraception/IUD, ultrasound, colposcopy, delivery); inventory: IUDs/implants, speculae, swabs, prenatal vitamins
- [ ] **Psychiatry:** keys `psychAssessments`, `psychNotes` (sensitive), `carePlanPsych`; tables `psych_assessments` (instrument, score, subscores JSON), `psych_notes` (sensitive flag), `psych_care_plans`, `med_monitoring` (lithium/clozapine/metabolic bloods due); scored questionnaires (PHQ-9, GAD-7, MMSE, MoCA, AUDIT) with trend; MSE template + risk assessment; layout profile (assessments-with-trend, MSE & risk, therapy notes, psychotropics + titration, care/crisis plan) + dashboard (high-risk flagged, scores worsening, monitoring bloods due, DNA follow-up list) + templates (psychiatric report, therapy progress note, fitness-for-work mental-health cert, referral to psychology/inpatient/crisis)
- [ ] For each: seed defaults, i18n, sidebar, routes, tests, verification

**DoD:** primary specialty Gynaecology ⇒ obstetric episodes + antenatal flowsheet +
cytology; primary specialty Psychiatry ⇒ scored assessments + MSE/risk + confidential
therapy notes + medication monitoring; confidential notes are hidden from staff without
the permission.

---

## Phase 6 — Cross-cutting templates  ·  ↳ [packs/11-cross-cutting.md](packs/11-cross-cutting.md)

**Why last:** pulls per-specialty wording (appointment types, document kinds, certificate
& referral text, dashboard widget sets) out of code and into **clinic-editable** tables.
Earlier phases seed code-level defaults; this phase makes them first-class config.

- [ ] Tables: `appointment_types`, `document_kinds`, `certificate_templates`, `referral_templates`, `dashboard_presets` (all clinic-scoped, RLS); migrate the code seeds from `seedSpecialtyDefaults` into rows
- [ ] Backend CRUD + Settings UI tabs to edit them
- [ ] `SPECIALTY_PROFILES` ids now resolve to clinic rows (falling back to the code defaults if a clinic has none)
- [ ] Dashboard renders the clinic's `dashboard_preset` (widgets become a configurable list)
- [ ] i18n; tests; verification

**DoD:** an admin can rename appointment types, edit certificate/referral wording, and
rearrange dashboard widgets per clinic; switching specialty still applies sensible
defaults; nothing is lost on switch.

---

## Cross-phase backlog (do alongside, not blocking)

- [ ] Bump the Settings → **Specialty** preview to group "features that turn on/off" by pack once the catalog is large
- [ ] Add a dynamic "Specialty" sidebar group whose items come from the primary-specialty profile (so the nav reorders when you switch)
- [ ] Multi-specialty clinics: confirm the union behaviour and the "primary decides the skin" rule end-to-end with a clinic that has 2+ specialties enabled
- [ ] Snapshot test of the full specialty × feature matrix (regenerate from `FEATURE-CATALOG.md`)
- [ ] Update [`/SPECIALTY_FEATURES.md`](../../SPECIALTY_FEATURES.md) §10 ("today vs proposed") as packs land
