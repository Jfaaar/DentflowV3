# Specialty Feature Matrix — MediNEEO

> **Status:** design / planning doc. This file is the single source of truth for
> *which features belong to which specialty*. The next step (separate work) is to
> reconcile `backend/db/migrations/0011_feature_access.sql`, `backend/lib/features.js`,
> `frontend/src/lib/features.ts`, the Sidebar, the routes and the per-specialty
> "layout profiles" against this document.
>
> **The promise:** when an admin sets the clinic's *primary specialty* to **Dental**,
> the app turns into a dental system (odontogram, perio chart, tooth-level treatment
> plans, dental quote/prescription templates, dental dashboard). Switch the primary
> specialty to **Cardiology** and the same app becomes a cardiology system (ECG/echo
> findings, cardiac risk scores, lipid/BP trend widgets, cardiology referral letters).
> Everything that is *not* specialty-specific (calendar, patients, billing, inventory,
> documents, team, settings, prescriptions, …) stays exactly where it is.

---

## 1. How specialty-driven features work

There are **three layers**, evaluated in this order:

1. **Core layer — shared by every specialty.** Always available regardless of
   specialty. Scheduling, patient records, billing, inventory, documents, reports,
   team, settings, prescriptions, the generic clinical note (SOAP), vitals, allergies,
   medication list, problem list. A clinic of *any* specialty needs these.

2. **Specialty packs — turned on/off by the clinic's enabled specialties.** Each
   specialty contributes a *pack*: one or more **clinical feature modules**
   (`dentalChart`, `cardiacStudies`, …), a **layout profile** (which charts/forms a
   patient record shows by default, which appointment types exist), and a set of
   **templates** (prescription header, quote/estimate wording, referral letter,
   dashboard widgets). A feature module is auto-enabled when
   `feature_definitions.default_specialties ∩ clinic_settings.enabled_specialties ≠ ∅`.

3. **Per-clinic overrides — manual pin on/off.** `clinic_feature_overrides` lets a
   clinic admin force a module on or off regardless of layer 2. Absence of a row =
   "follow the specialty default". `role_permission_overrides` does the same for the
   role × permission matrix. (This already exists — see migration `0011`.)

### What "change specialty → load its features" means concretely

| When the admin… | The app should… | Mechanism |
|---|---|---|
| toggles a specialty **on** in `enabled_specialties` | enable that pack's feature modules (unless a clinic override pins them off) | `default_specialties ∩ enabled_specialties` — already implemented in `featuresService` / `useFeatureAccess` |
| toggles a specialty **off** | hide that pack's modules (overrides still win) | same |
| changes the **primary specialty** | switch the *default layout profile*: patient-record tabs, the visual chart shown, the dashboard preset, the appointment-type list, the prescription/quote templates | **new**: a `SPECIALTY_PROFILES` map keyed by `SpecialtyCode`, read from `primary_specialty`. Today only `isDental` is special-cased in `useClinicSpecialty`. |

> **Two distinct knobs.** `enabled_specialties` is a *set* (a clinic can be
> "general practice + dermatology"). `primary_specialty` is a *single* value that
> decides the "skin" of the app when there's a choice to make (default tab order,
> default dashboard, default templates). Keep them orthogonal to roles/permissions.

---

## 2. Core features — shared by **all** specialties

These are on for every specialty. Most already exist as feature keys; the ones that
don't yet are flagged **(new)**.

| Feature key | Module | Category | Default permission | Notes |
|---|---|---|---|---|
| `dashboard` | Dashboard / KPIs | operations | `settings.view` | preset widgets vary by primary specialty (see §4) |
| `calendar` | Appointment calendar | operations | `appointments.view` | appointment **types** vary by specialty |
| `waitingRoom` | Check-in queue | operations | `appointments.view` | |
| `patients` | Patient directory & record | clinical | `patients.view` | record **tabs** vary by primary specialty |
| `clinicalNotes` **(new)** | Generic SOAP / encounter note | clinical | `clinical.view` | exists as a route (`/clinical/notes`) but is **not a gated feature key today** — add it so it can be reasoned about / disabled |
| `vitals` | Vital signs (BP, HR, temp, SpO₂, BMI, pain) | clinical | `clinical.view` | **promote to core** — currently "all non-dental". Even dental clinics record BP before anaesthesia. Keep dental able to hide it via override. |
| `allergies` **(new)** | Allergy list | clinical | `clinical.view` | universal safety data; today implied inside notes only |
| `medicationList` **(new)** | Current medications | clinical | `clinical.view` | universal; drives interaction checks for `prescriptions` |
| `problemList` | Problem list (ICD-10) | clinical | `clinical.view` | **promote to core** (same reasoning as `vitals`) |
| `treatments` | Treatment plans / procedure plans | clinical | `treatments.view` | item catalog & whether a "tooth/surface" or "body region" selector shows depends on specialty |
| `quotes` **(surface as feature)** | Estimates / quotes | operations | `quotes.view` | permission set already exists; expose as a feature key for parity |
| `prescriptions` | Rx editor & history | clinical | `prescriptions.view` | header/footer template varies by specialty |
| `medicaments` | Drug catalog (AMMPS) | operations | `prescriptions.view` | |
| `insurance` | Policies / claims / reimbursements | operations | `insurance.view` | |
| `invoices` | Billing, payments, refunds | operations | `invoices.view` | |
| `inventory` | Stock, suppliers, purchase orders | operations | `inventory.view` | consumable catalog seeds differ by specialty (see §4) |
| `documents` | File / imaging uploads | operations | `documents.view` | imaging *kinds* differ by specialty (X-ray vs ECG vs OCT vs dermoscopy) |
| `reports` | Financial & clinical reports | operations | `reports.view` | |
| `team` | Staff & invitations | admin | `team.view` | |
| `settings` | Clinic configuration | admin | `settings.view` | hosts the Specialty / Features / Roles tabs |

> **Recommendation:** move `vitals`, `problemList` (and add `allergies`,
> `medicationList`, `clinicalNotes`) into the core set with
> `default_specialties = <all 11>`. Today `vitals/problemList/bodyRegionChart` are
> "all non-dental", which makes a dental clinic that *also* does general practice
> behave oddly. Specialty packs should *add* clinical surfaces, not be the only
> source of core ones.

---

## 3. Specialty packs — feature-key catalog (proposed)

New feature keys grouped by the pack that introduces them. **Bold = new key to add**
to `feature_definitions`, `backend/lib/features.js`, `frontend/src/lib/features.ts`.
Existing keys are shown for context.

| Feature key | Belongs to specialties (`default_specialties`) | Category | Default permission | What it is |
|---|---|---|---|---|
| `dentalChart` *(exists)* | `dental` | clinical | `dentalChart.view` | Odontogram, tooth/surface findings |
| **`perioChart`** | `dental` | clinical | `dentalChart.view` | Periodontal chart: pocket depths, recession, bleeding, mobility, furcation; per-site 6-point charting |
| **`endoChart`** | `dental` | clinical | `clinical.view` | Endodontic record: canals, working length, obturation |
| **`orthoModule`** | `dental` | clinical | `clinical.view` | Orthodontic treatment tracking: appliances, brackets, wire sequence, photo timeline |
| **`bodyRegionChart`** *(exists, rename concept)* | all non-dental | clinical | `clinical.view` | Generic body-region findings (pain maps, lesion maps) — base for derm/ortho overlays |
| **`growthCharts`** | `pediatrics` | clinical | `clinical.view` | WHO/CDC percentiles: weight-for-age, height-for-age, head circumference, BMI-for-age |
| **`developmentMilestones`** | `pediatrics` | clinical | `clinical.view` | Denver / ASQ developmental screening checklist |
| `vaccinations` *(exists)* | `pediatrics`, `general_practice` | clinical | `clinical.view` | Immunization history + due-schedule reminders |
| **`newbornScreening`** | `pediatrics` | clinical | `clinical.view` | Apgar, metabolic screen, hearing screen, neonatal jaundice |
| **`obstetrics`** | `gynecology` | clinical | `clinical.view` | Pregnancy episode: LMP/EDD, GPA, antenatal visit flowsheet, fundal height, fetal HR, ultrasound biometry |
| **`gynExam`** | `gynecology` | clinical | `clinical.view` | Pelvic/breast exam template, Pap/HPV results, contraception plan, menstrual history |
| **`partogram`** | `gynecology` | clinical | `clinical.view` | Labour monitoring chart (optional, for clinics that do deliveries) |
| **`cardiacStudies`** | `cardiology` | clinical | `clinical.view` | ECG, echocardiogram, stress test, Holter — structured findings + file attachment |
| **`cardioRiskScores`** | `cardiology`, `general_practice` | clinical | `clinical.view` | ASCVD / Framework / CHA₂DS₂-VASc / HAS-BLED calculators with auto-filled inputs from vitals + labs |
| **`bpTrends`** | `cardiology`, `general_practice` | clinical | `clinical.view` | BP / weight / lipid / HbA1c trend graphs and home-BP log import |
| **`anticoagClinic`** | `cardiology` | clinical | `clinical.view` | INR tracking + warfarin dosing log |
| **`dermAtlas`** | `dermatology` | clinical | `clinical.view` | Body-map lesion plotting, dermoscopy image attachment, ABCDE/PASI/SCORAD scoring, mole-tracking timeline |
| **`skinProcedures`** | `dermatology` | clinical | `clinical.view` | Biopsy/excision/cryo/laser log with histopathology result linkage |
| **`cosmeticModule`** | `dermatology` | clinical | `clinical.view` | Aesthetic treatments: Botox/filler injection maps, before/after photos, package/session tracking |
| **`audiometry`** | `ent` | clinical | `clinical.view` | Pure-tone audiogram, tympanogram, speech audiometry |
| **`endoscopyEnt`** | `ent` | clinical | `clinical.view` | Nasal endoscopy / laryngoscopy / otoscopy structured findings + media |
| **`vestibularModule`** | `ent` | clinical | `clinical.view` | Vertigo work-up: Dix-Hallpike, caloric test, balance assessment |
| **`visualAcuity`** | `ophthalmology` | clinical | `clinical.view` | VA (Snellen/logMAR), refraction (sphere/cyl/axis/add), prescription glasses output |
| **`tonometry`** | `ophthalmology` | clinical | `clinical.view` | IOP measurements + trend (glaucoma follow-up) |
| **`fundusExam`** | `ophthalmology` | clinical | `clinical.view` | Slit-lamp + fundus findings, OCT / fundus photo / visual-field attachment |
| **`opticalDispensing`** | `ophthalmology` | operations | `inventory.view` | Frames/lenses catalog, glasses order workflow (overlaps `inventory`) |
| **`orthoExam`** | `orthopedics` | clinical | `clinical.view` | Joint-specific ROM/strength/special-tests templates, limb measurements |
| **`fractureBoard`** | `orthopedics` | clinical | `clinical.view` | Fracture classification, immobilisation/cast log, follow-up X-ray schedule |
| **`physioPlan`** | `orthopedics`, `general_practice` | clinical | `treatments.view` | Rehab/physiotherapy exercise programme + session tracking |
| **`injectionLog`** | `orthopedics` | clinical | `clinical.view` | Joint injection record (steroid/PRP/hyaluronic), site map |
| **`psychAssessments`** | `psychiatry` | clinical | `clinical.view` | PHQ-9, GAD-7, MMSE, MoCA, AUDIT, etc. — scored questionnaires with history |
| **`psychNotes`** | `psychiatry` | clinical | `clinical.view` | MSE (mental status exam) template, risk assessment, therapy session notes (extra-confidential flag) |
| **`carePlanPsych`** | `psychiatry` | clinical | `treatments.view` | Crisis plan, relapse-prevention plan, medication-titration schedule |
| **`chronicCare`** | `general_practice` | clinical | `clinical.view` | Chronic-disease dashboards (HTN, T2DM, asthma/COPD) with recall lists |
| **`preventiveCare`** | `general_practice`, `pediatrics`, `gynecology` | clinical | `clinical.view` | Screening/recall engine: due/overdue checks (Pap, mammo, colon, vaccines, annual physical) |
| **`certificates`** | all | operations | `documents.view` | Sick notes, fitness-to-work/school, travel certificates — template-driven, specialty wording presets |
| **`referrals`** **(new, core-ish)** | all | operations | `documents.view` | Referral / counter-referral letters; default recipient specialty list seeded per primary specialty |

> Notes:
> - `bodyRegionChart` already exists; `dermAtlas`, `orthoExam`, `injectionLog` can be
>   *renderers on top of* the same body-region data model rather than separate tables.
> - `quotes`/estimates already have a permission namespace; for dental this becomes the
>   classic "dental treatment estimate". No new key strictly needed — just a template.
> - `physioPlan` and `cardioRiskScores`/`bpTrends` are intentionally shared between a
>   specialist pack and `general_practice` (GPs do these too).

---

## 4. Per-specialty pack details

For each specialty: the **modules** it turns on (core ⊕ pack), the **patient-record
layout profile** (tabs, default chart), **appointment types**, **dashboard preset**,
**templates**, and **inventory/catalog seeds**. The "modules" column lists the *extra*
feature keys on top of the Core set from §2.

---

### 4.1 `general_practice` — General / Family Medicine  *(current default)*

- **Pack modules:** `vaccinations`, `chronicCare`, `preventiveCare`, `cardioRiskScores`, `bpTrends`, `physioPlan`, `certificates`, `referrals`
- **Record layout profile:** tabs = Overview · Vitals · Problems · Medications · Allergies · Notes (SOAP) · Vaccinations · Documents · Billing. Default visual chart = `bodyRegionChart`.
- **Appointment types:** Consultation, Follow-up, Annual physical, Vaccination, Procedure, Teleconsultation.
- **Dashboard preset:** today's appointments, patients seen, revenue, **recall/overdue screenings count**, chronic-disease panel sizes.
- **Templates:** generic prescription header, sick-note / fitness certificate, generic referral letter.
- **Inventory seeds:** general consumables (gloves, syringes, dressings), common vaccines, basic injectables.
- **Permissions:** standard (no special unlocks beyond core).

---

### 4.2 `dental` — Dental / Stomatology  *(the legacy Dentflow system)*

- **Pack modules:** `dentalChart` (odontogram), `perioChart`, `endoChart`, `orthoModule`, `certificates`, `referrals`
- **Record layout profile:** tabs = Overview · **Odontogram** · Perio chart · Treatment plan · Notes · Imaging (panoramic / periapical / bitewing / CBCT) · Estimates · Billing. Default visual chart = `dentalChart`. Treatment-plan items show **tooth + surface** selectors. Hide `bodyRegionChart`. `vitals`/`problemList` available but collapsed by default.
- **Appointment types:** Exam/check-up, Cleaning/scaling, Filling, Root canal, Extraction, Crown/bridge, Implant, Orthodontic adjustment, Whitening, Emergency.
- **Dashboard preset:** chair utilisation, treatment-plan acceptance rate, recall (6-month cleaning) list, outstanding estimates, lab-case tracker.
- **Templates:** dental treatment **estimate/quote** (per-tooth line items), dental prescription (analgesics/antibiotics/chlorhexidine presets), dental referral (to oral surgeon / orthodontist), post-op instructions.
- **Inventory seeds:** composite, anaesthetic carpules, burs, endo files, impression material, gloves; **lab-case** tracking (crowns/dentures sent to dental lab).
- **Permissions:** `dentalChart.view`, `dentalChart.update` (already in matrix).

---

### 4.3 `pediatrics` — Paediatrics

- **Pack modules:** `growthCharts`, `developmentMilestones`, `vaccinations`, `newbornScreening`, `preventiveCare`, `certificates`, `referrals`
- **Record layout profile:** tabs = Overview · **Growth charts** · Milestones · Vitals (age-aware ranges) · Vaccinations · Problems · Medications (weight-based dosing) · Notes · Documents · Billing. Patient record shows **age in years/months/days** prominently; guardian/contact block required.
- **Appointment types:** Well-baby visit, Sick visit, Vaccination, Newborn check, Developmental assessment, Follow-up.
- **Dashboard preset:** vaccinations due this week, well-baby visits scheduled, growth-flag alerts (crossing percentiles), newborn follow-ups.
- **Templates:** paediatric prescription (mg/kg helper), school/daycare absence certificate, vaccination certificate, referral to paediatric subspecialty.
- **Inventory seeds:** paediatric vaccine fridge stock, oral suspensions, nebuliser supplies.
- **Permissions:** standard.

---

### 4.4 `gynecology` — Gynaecology & Obstetrics

- **Pack modules:** `gynExam`, `obstetrics`, `partogram` (optional), `preventiveCare` (Pap/mammo recall), `certificates`, `referrals`
- **Record layout profile:** tabs = Overview · **Obstetric history (GPA)** · Antenatal flowsheet (if pregnant) · Gyn exam · Cytology results · Contraception · Vitals · Problems · Medications · Notes · Imaging (obstetric ultrasound) · Billing. Pregnancy creates an **episode** with EDD countdown.
- **Appointment types:** Gyn consultation, Antenatal visit, Postnatal visit, Pap smear, Contraception/IUD, Ultrasound, Colposcopy, Delivery.
- **Dashboard preset:** patients due (EDD this month), antenatal visits this week, overdue Pap smears, high-risk pregnancies flagged.
- **Templates:** antenatal record summary, obstetric ultrasound report, maternity leave certificate, gyn referral (oncology / fertility).
- **Inventory seeds:** IUDs/implants, speculae, swabs, prenatal vitamins.
- **Permissions:** consider an **extra-confidential** flag on gyn/obstetric notes (reuse the psych pattern).

---

### 4.5 `cardiology` — Cardiology

- **Pack modules:** `cardiacStudies` (ECG/echo/stress/Holter), `cardioRiskScores`, `bpTrends`, `anticoagClinic`, `certificates`, `referrals`
- **Record layout profile:** tabs = Overview · **Cardiac studies** · BP/lipid trends · Risk scores · Vitals · Problems (cardiac) · Medications (with cardiac classes) · Notes · Imaging (ECG strips, echo loops) · Billing.
- **Appointment types:** Cardiology consultation, ECG, Echocardiogram, Stress test, Holter fit/removal, Pacemaker check, Anticoagulation review, Follow-up.
- **Dashboard preset:** studies pending report, INR reviews due, BP not-at-target panel, high-risk (ASCVD ≥20%) list, device follow-ups.
- **Templates:** ECG report, echo report, cardiology consultation letter / counter-referral, fitness-for-surgery clearance.
- **Inventory seeds:** ECG electrodes, Holter supplies, stress-test consumables.
- **Permissions:** standard.

---

### 4.6 `dermatology` — Dermatology (+ aesthetic)

- **Pack modules:** `dermAtlas` (lesion body-map + dermoscopy), `skinProcedures` (biopsy/excision/cryo/laser), `cosmeticModule`, `certificates`, `referrals`
- **Record layout profile:** tabs = Overview · **Skin map** (lesion plotting) · Dermoscopy gallery · Procedures · Scores (PASI/SCORAD/DLQI) · Notes · Medications · Imaging (clinical photos, dermoscopy) · Billing. Heavy emphasis on **before/after photo timelines**.
- **Appointment types:** Dermatology consultation, Mole check / skin cancer screen, Biopsy, Excision, Cryotherapy, Laser, Phototherapy, Cosmetic consult, Botox/filler, Follow-up.
- **Dashboard preset:** biopsy results pending, lesions flagged for re-check, phototherapy course progress, cosmetic package sessions remaining.
- **Templates:** histopathology request, dermatology referral, procedure consent + post-care, cosmetic treatment plan/quote.
- **Inventory seeds:** liquid nitrogen, biopsy punches, sutures, **fillers/toxins (lot + expiry tracked)**, topical samples.
- **Permissions:** standard; cosmetic packages may use `treatments`/`quotes`.

---

### 4.7 `ent` — ENT / Otolaryngology

- **Pack modules:** `audiometry`, `endoscopyEnt`, `vestibularModule`, `certificates`, `referrals`
- **Record layout profile:** tabs = Overview · **Audiogram** · Endoscopy findings (ear/nose/throat) · Vestibular work-up · Vitals · Problems · Medications · Notes · Imaging (endoscopy stills/video, CT sinus) · Billing.
- **Appointment types:** ENT consultation, Audiometry, Endoscopy (nasal/laryngeal), Ear microsuction, Vertigo assessment, Allergy testing, Pre-op, Follow-up.
- **Dashboard preset:** audiometry results to review, hearing-aid follow-ups, post-op patients, sleep-study referrals pending.
- **Templates:** audiogram report, ENT consultation letter, hearing-aid recommendation, work/noise-exposure certificate.
- **Inventory seeds:** ear-wick/microsuction supplies, nasal packs, endoscope sheaths.
- **Permissions:** standard.

---

### 4.8 `ophthalmology` — Ophthalmology / Optometry

- **Pack modules:** `visualAcuity` (VA + refraction), `tonometry` (IOP), `fundusExam`, `opticalDispensing`, `certificates`, `referrals`
- **Record layout profile:** tabs = Overview · **Refraction & VA** · IOP trend · Anterior/posterior segment findings · Imaging (OCT, fundus photo, visual fields) · Glasses/Rx history · Notes · Billing. Most data is **per-eye (OD/OS)**.
- **Appointment types:** Eye exam / refraction, Glaucoma follow-up, Diabetic retinopathy screen, OCT, Visual field, Minor procedure (chalazion, foreign body), Cataract pre-op/post-op, Contact lens fit.
- **Dashboard preset:** glaucoma IOP-not-controlled list, diabetic screening recalls, glasses orders ready for collection, post-cataract follow-ups.
- **Templates:** glasses prescription, contact-lens prescription, ophthalmology referral (retina/cataract surgery), driving-vision certificate.
- **Inventory seeds:** dilating/anaesthetic drops, diagnostic lenses, **frames & lens stock** (links `opticalDispensing` ↔ `inventory`).
- **Permissions:** standard.

---

### 4.9 `orthopedics` — Orthopaedics & Sports Medicine

- **Pack modules:** `orthoExam` (joint ROM/strength/special tests), `fractureBoard`, `physioPlan`, `injectionLog`, `certificates`, `referrals`
- **Record layout profile:** tabs = Overview · **Body/joint map** · Exam (ROM, strength, special tests) · Fractures · Injections · Physio plan · Imaging (X-ray, MRI, CT) · Notes · Billing.
- **Appointment types:** Orthopaedic consultation, Fracture clinic, Cast change, Joint injection, Pre-op, Post-op, Physiotherapy, Sports assessment.
- **Dashboard preset:** fractures due follow-up X-ray, casts due removal, post-op rehab progress, MRI results to review.
- **Templates:** imaging request (X-ray/MRI), orthopaedic referral (surgery/physio), work-restriction / return-to-sport certificate, procedure consent.
- **Inventory seeds:** casting/splinting materials, braces, **injection kits (steroid/PRP/HA, lot tracked)**, crutches/aircast stock.
- **Permissions:** standard.

---

### 4.10 `psychiatry` — Psychiatry & Mental Health

- **Pack modules:** `psychAssessments` (PHQ-9/GAD-7/MMSE/…), `psychNotes` (MSE + risk + therapy notes), `carePlanPsych`, `certificates`, `referrals`
- **Record layout profile:** tabs = Overview · **Assessments (scored, with trend)** · MSE & risk · Therapy notes (extra-confidential) · Medications (psychotropics, titration schedule) · Care plan / crisis plan · Notes · Billing. Vitals optional; **monitoring panel** for clozapine/lithium/metabolic.
- **Appointment types:** Psychiatric assessment, Medication review, Therapy session (individual/family/group), Crisis appointment, Follow-up, Teleconsultation.
- **Dashboard preset:** high-risk patients flagged, assessment scores worsening, medication-monitoring bloods due (lithium/clozapine), missed appointments (DNA) follow-up list.
- **Templates:** psychiatric report, therapy progress note, fitness-for-work (mental health) certificate, referral to psychology/inpatient/crisis team.
- **Inventory seeds:** minimal (typically no clinical stock); may track depot injections.
- **Permissions:** **extra-confidential note flag** — therapy/psych notes restricted even from some clinic staff; consider a `clinical.psychSensitive.view` permission and a per-clinic toggle.

---

### 4.11 `other` — Unlisted specialty (generic clinical)

- **Pack modules:** none beyond Core. Acts like a slimmed `general_practice`: SOAP notes, vitals, problems, medications, allergies, treatments, prescriptions, billing.
- **Record layout profile:** the generic profile (Overview · Vitals · Problems · Medications · Allergies · Notes · Documents · Billing).
- **Appointment types:** Consultation, Follow-up, Procedure, Teleconsultation.
- **Dashboard preset:** generic (appointments, patients, revenue).
- **Templates:** generic prescription / certificate / referral.
- Use this when a clinic's discipline isn't (yet) modelled; everything still works via the Core layer.

---

## 5. Specialty × feature matrix

Legend: **✅** = on by default (in `default_specialties`) · **·** = not in default set (admin can still pin on via override) · **C** = Core, always on.

| Feature \ Specialty | gen | dental | peds | gyn | cardio | derm | ent | ophth | ortho | psych | other |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| dashboard / calendar / waitingRoom / patients | C | C | C | C | C | C | C | C | C | C | C |
| clinicalNotes (SOAP) | C | C | C | C | C | C | C | C | C | C | C |
| vitals | C | C* | C | C | C | C | C | C | C | C* | C |
| allergies / medicationList | C | C | C | C | C | C | C | C | C | C | C |
| problemList | C | C* | C | C | C | C | C | C | C | C | C |
| treatments / quotes / prescriptions / medicaments | C | C | C | C | C | C | C | C | C | C | C |
| insurance / invoices / inventory / documents / reports | C | C | C | C | C | C | C | C | C | C | C |
| certificates / referrals | C | C | C | C | C | C | C | C | C | C | C |
| team / settings | C | C | C | C | C | C | C | C | C | C | C |
| **dentalChart** | · | ✅ | · | · | · | · | · | · | · | · | · |
| **perioChart** | · | ✅ | · | · | · | · | · | · | · | · | · |
| **endoChart** | · | ✅ | · | · | · | · | · | · | · | · | · |
| **orthoModule** (dental) | · | ✅ | · | · | · | · | · | · | · | · | · |
| **bodyRegionChart** | ✅ | · | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **growthCharts** | · | · | ✅ | · | · | · | · | · | · | · | · |
| **developmentMilestones** | · | · | ✅ | · | · | · | · | · | · | · | · |
| **vaccinations** | ✅ | · | ✅ | · | · | · | · | · | · | · | · |
| **newbornScreening** | · | · | ✅ | · | · | · | · | · | · | · | · |
| **obstetrics** | · | · | · | ✅ | · | · | · | · | · | · | · |
| **gynExam** | · | · | · | ✅ | · | · | · | · | · | · | · |
| **partogram** | · | · | · | ✅ | · | · | · | · | · | · | · |
| **cardiacStudies** | · | · | · | · | ✅ | · | · | · | · | · | · |
| **cardioRiskScores** | ✅ | · | · | · | ✅ | · | · | · | · | · | · |
| **bpTrends** | ✅ | · | · | · | ✅ | · | · | · | · | · | · |
| **anticoagClinic** | · | · | · | · | ✅ | · | · | · | · | · | · |
| **dermAtlas** | · | · | · | · | · | ✅ | · | · | · | · | · |
| **skinProcedures** | · | · | · | · | · | ✅ | · | · | · | · | · |
| **cosmeticModule** | · | · | · | · | · | ✅ | · | · | · | · | · |
| **audiometry** | · | · | · | · | · | · | ✅ | · | · | · | · |
| **endoscopyEnt** | · | · | · | · | · | · | ✅ | · | · | · | · |
| **vestibularModule** | · | · | · | · | · | · | ✅ | · | · | · | · |
| **visualAcuity** | · | · | · | · | · | · | · | ✅ | · | · | · |
| **tonometry** | · | · | · | · | · | · | · | ✅ | · | · | · |
| **fundusExam** | · | · | · | · | · | · | · | ✅ | · | · | · |
| **opticalDispensing** | · | · | · | · | · | · | · | ✅ | · | · | · |
| **orthoExam** | · | · | · | · | · | · | · | · | ✅ | · | · |
| **fractureBoard** | · | · | · | · | · | · | · | · | ✅ | · | · |
| **physioPlan** | ✅ | · | · | · | · | · | · | · | ✅ | · | · |
| **injectionLog** | · | · | · | · | · | · | · | · | ✅ | · | · |
| **psychAssessments** | · | · | · | · | · | · | · | · | · | ✅ | · |
| **psychNotes** | · | · | · | · | · | · | · | · | · | ✅ | · |
| **carePlanPsych** | · | · | · | · | · | · | · | · | · | ✅ | · |
| **chronicCare** | ✅ | · | · | · | · | · | · | · | · | · | · |
| **preventiveCare** | ✅ | · | ✅ | ✅ | · | · | · | · | · | · | · |

\* `vitals` and `problemList` are *available* in dental & psychiatry (Core) but the
default layout profile keeps them collapsed.

> A clinic with multiple specialties is just the **union** of the columns. E.g.
> `enabled_specialties = ['general_practice','dermatology']` → GP core + `chronicCare`,
> `preventiveCare`, `vaccinations`, `cardioRiskScores`, `bpTrends`, `physioPlan` **and**
> `dermAtlas`, `skinProcedures`, `cosmeticModule`. The **primary** specialty decides
> the default record-tab order and dashboard.

---

## 6. Data model additions (per pack)

Most packs need 1–3 new tenant-scoped tables mirroring the RLS pattern in
`0003_rls_policies.sql` / `0008_medical_mvp.sql`. Sketch only — finalise during impl.

| Pack | New tables (suggested) |
|---|---|
| dental — perio | `perio_charts`, `perio_sites` (toothid, position, pocket, recession, bop, mobility, furcation) |
| dental — endo/ortho | `endo_records`, `ortho_episodes`, `ortho_visits` |
| pediatrics | `growth_measurements` (can reuse `vital_signs` + a `head_circumference_cm` column), `development_screenings`, `newborn_screenings` |
| gynecology | `pregnancy_episodes`, `antenatal_visits`, `gyn_exams`, `cytology_results` |
| cardiology | `cardiac_studies` (type, findings JSON, file_id), `anticoag_logs` (date, inr, dose), risk scores can be computed (no table) |
| dermatology | `skin_lesions` (body map x/y, dermoscopy file), `skin_procedures` (type, site, histopath result_id), `cosmetic_sessions` |
| ent | `audiograms` (per-ear thresholds JSON), `ent_endoscopies`, `vestibular_assessments` |
| ophthalmology | `eye_exams` (per-eye VA/refraction/IOP/segment findings), `glasses_prescriptions` (reuse `prescriptions`? no — separate) |
| orthopedics | `joint_exams`, `fractures`, `joint_injections`, `physio_plans`, `physio_sessions` |
| psychiatry | `psych_assessments` (instrument, score, subscores JSON), `psych_notes` (sensitive flag), `psych_care_plans`, `med_monitoring` |
| cross-cutting | `appointment_types` (clinic-scoped, seeded per primary specialty), `document_kinds` (clinic-scoped), `certificate_templates`, `referral_templates`, `dashboard_presets` |

Reuse where possible: `bodyRegionChart`'s `body_region_findings` table can back
`dermAtlas`, `orthoExam` and `injectionLog` (add a `discipline` discriminator + a
JSON `details` column) instead of three near-identical tables.

---

## 7. Layout profiles — `primary_specialty` → app "skin"

Add a single config map (frontend `frontend/src/features/settings/specialtyProfiles.ts`,
mirrored as a backend lib if the server needs it) keyed by `SpecialtyCode`:

```ts
interface SpecialtyProfile {
  code: SpecialtyCode;
  // Patient-record tab order (feature keys + a few fixed tabs like 'overview','billing')
  recordTabs: Array<FeatureKey | 'overview' | 'billing' | 'documents'>;
  // Which visual chart the record's "chart" tab renders
  primaryChart: 'dentalChart' | 'bodyRegionChart' | 'growthCharts' | 'eyeExam' | 'none';
  // Dashboard widget preset id
  dashboardPreset: string;
  // Default appointment-type seed list
  appointmentTypes: string[];
  // Template ids for prescription header, quote/estimate, referral, certificate
  templates: { prescription: string; quote: string; referral: string; certificate: string };
}
```

- `useClinicSpecialty()` already exposes `primarySpecialty`; replace the ad-hoc
  `isDental` with `profile = SPECIALTY_PROFILES[primarySpecialty]` and let the patient
  record, dashboard and AppointmentModal read from it.
- When the admin changes the primary specialty in `SpecialtyPage.tsx`, the
  `getSettings` RTK cache invalidates → every consumer re-renders with the new
  profile. No extra plumbing needed beyond the profile map + consumers reading it.
- Seeding clinic-scoped rows (appointment types, document kinds, templates) on
  *first* switch to a specialty: do it lazily server-side in `settingsService.update`
  — if `enabled_specialties` gained a code and the clinic has no rows for that pack's
  seed tables yet, insert the defaults. Never delete on disable (keep historical data);
  just stop surfacing them.

---

## 8. Implementation checklist

1. **Catalog reconciliation**
   - [ ] Add the new feature keys (§3) to `backend/db/migrations/00XX_specialty_packs.sql` `INSERT … ON CONFLICT` into `feature_definitions` with the `default_specialties` from §5.
   - [ ] Mirror the new keys in `backend/lib/features.js` `FEATURE_KEYS` and `frontend/src/lib/features.ts` `FEATURE_KEYS`.
   - [ ] Promote `vitals`, `problemList` to `default_specialties = <all 11>`; add `clinicalNotes`, `allergies`, `medicationList` as core keys (or decide they stay non-gated).
2. **Permissions** — most packs use existing `clinical.view/create/update/sign`. Add `clinical.psychSensitive.view` (or similar) for psychiatry/gyn confidential notes; wire into `backend/lib/rolePermissions.js`, `frontend/src/lib/permissions.ts`, and the Roles page.
3. **Backend** — for each new module: migration (tables + RLS), repository, service, controller, route file gated by `requireFeature('<key>')` (pattern already in `routes/medical.js`'s `mount()`), validation schema. Register routes in `backend/index.js`.
4. **Frontend** — for each new module: a feature folder under `frontend/src/features/<pack>/`, RTK Query api slice, page/components, route in `App.tsx` wrapped in `ProtectedRoute` with the feature key, sidebar entry (see step 5), i18n keys.
5. **Sidebar** — `Sidebar.tsx` already filters by feature key. Add the new clinical modules under the `clinical` group; add `referrals`/`certificates` under `operations`. Consider a dynamic "Specialty" group whose items come from the primary-specialty profile so the nav reorders when you switch specialty.
6. **Layout profiles** — implement `SPECIALTY_PROFILES` (§7); refactor `useClinicSpecialty`, `PatientDetailsModal`/patient record, `DashboardPage`, `AppointmentModal` to read from it.
7. **Lazy seeding** — in `settingsService.update`, when `enabled_specialties` grows, seed `appointment_types` / `document_kinds` / `*_templates` for the new pack(s) if absent.
8. **i18n** — add labels for every new feature key, specialty profile, appointment type, and dashboard preset to `frontend/src/lib/i18n/translations.ts` (FR + EN + AR as the others).
9. **Settings UI** — `SpecialtyPage.tsx` already previews "features that will turn on/off when you save"; once the catalog is expanded this preview becomes the headline UX. Optionally group the preview by pack.
10. **Tests** — extend the catalog test (`backend/__tests__/…`) to assert every `FEATURE_KEYS` entry has a `feature_definitions` row and vice versa; add a test that `default_specialties` ⊆ the 11-code whitelist; snapshot the specialty × feature matrix.

---

## 9. Suggested rollout phases

- **Phase 0 (cleanup):** promote `vitals`/`problemList` to core; add `clinicalNotes`/`allergies`/`medicationList` as core keys; introduce `SPECIALTY_PROFILES` with the *current* behaviour (dental vs generic) so the plumbing exists. No new clinical modules yet. Low risk.
- **Phase 1 — Dental pack** (`perioChart`, `endoChart`, dental templates, dental dashboard, lab-case tracking). Highest value: it's the original product and the "switch to Dental → get a dental system" demo.
- **Phase 2 — Pediatrics pack** (`growthCharts`, `developmentMilestones`, `newbornScreening`, paediatric dosing helper, vaccination recall). High demand, mostly additive forms.
- **Phase 3 — Dermatology pack** (`dermAtlas`, `skinProcedures`, `cosmeticModule`, photo timelines). Strong fit for private clinics.
- **Phase 4 — Cardiology + Ophthalmology + ENT + Orthopaedics packs** (study/exam modules, per-eye / per-joint / per-ear data). Heavier — each needs its own structured-findings UI.
- **Phase 5 — Gynaecology + Psychiatry packs** (obstetric episodes, confidential-note permission model, scored assessments). Needs the extra-confidentiality work first.
- **Phase 6 — Cross-cutting templates** (`certificates`, `referrals`, `appointment_types`, `dashboard_presets` as first-class configurable entities). Pulls the per-specialty wording out of code into clinic-editable templates.

---

## 10. Quick reference — what's there today vs. what this doc adds

**Already implemented:**
- `clinic_settings.primary_specialty` + `enabled_specialties` (11-code whitelist) — `0008_medical_mvp.sql`
- `feature_definitions` + `clinic_feature_overrides` + `role_permission_overrides` — `0011_feature_access.sql`
- **25 feature keys** (19 from `0011` + 6 from `0012`): `dashboard, calendar, waitingRoom, patients, clinicalNotes, allergies, medicationList, dentalChart, vitals, problemList, bodyRegionChart, vaccinations, treatments, prescriptions, quotes, insurance, invoices, inventory, medicaments, documents, reports, certificates, referrals, team, settings`
- `vitals` and `problemList` now `default_specialties = all 11` (promoted in `0012_core_feature_keys.sql`) — dental clinics get them auto-on, can override off if they want them hidden
- `featuresService` / `useFeatureAccess` resolving `default_specialties ∩ enabled_specialties` + overrides
- `requireFeature(...)` route guard (`routes/clinical.js`, `routes/medical.js`)
- Catalog test (`backend/__tests__/featureCatalog.test.js`) — locks the 3 catalog sources (DB seed + backend mirror + frontend mirror) in sync
- `SPECIALTY_PROFILES` map (`frontend/src/features/settings/specialtyProfiles.ts`) — per-`primary_specialty` profile (record tabs, primary chart, dashboard preset, appointment types, templates). GP and dental are real today; the other 9 clone GP and are filled in by each pack's phase.
- `useClinicSpecialty()` exposes `.profile = SPECIALTY_PROFILES[primarySpecialty]`; the legacy `isDental` / `isGeneralPractice` booleans are kept and `@deprecated`
- `settingsService.updateSettings` detects added entries in `enabled_specialties` and calls `seedSpecialtyDefaults(db, clinicId, addedCodes)` (`backend/services/specialtyDefaultsSeeder.js`) — per-specialty no-op handlers today; each pack replaces its own handler in its phase
- Settings hub with **Specialty / Features / Roles** tabs; `SpecialtyPage` already shows a live "features that change on save" preview
- Sidebar items already hide on feature-disabled / no-permission
- Clinical MVP tables: `vital_signs`, `problem_list`, `vaccinations`, `body_region_findings`; SOAP fields on `clinical_notes`; allergies / medications / conditions on `patient_medical_history` (TEXT[] arrays — already first-class data, no new tables needed for Phase 0)

**This doc still adds (not yet built):**
- ~30 new specialty-pack feature keys (§3) — *the catalog rails landed in Phase 0 (`0012`), individual pack keys ship in their phase*
- ~~Per-specialty **layout profiles** keyed off `primary_specialty` (§7)~~ — *structure landed in Phase 0 via `SPECIALTY_PROFILES`; GP + dental are real, the other 9 are GP clones until each pack's phase fills them*
- ~~Promotion of core clinical surfaces (`vitals`, `problemList`, +`allergies`, `medicationList`, `clinicalNotes`) to all specialties~~ — *done in `0012_core_feature_keys.sql`*
- Consumer refactors so `PatientDetailsModal` / `DashboardPage` / `AppointmentModal` / dental-aware components read `profile.recordTabs` / `profile.primaryChart` / `profile.dashboardPreset` / `profile.appointmentTypes` instead of hard-coding or branching on `isDental`
- New data tables per pack (§6)
- Confidential-note permission for psychiatry/gynaecology
- Clinic-editable `appointment_types`, `document_kinds`, `certificate`/`referral` templates, `dashboard_presets`
- ~~Lazy seeding of pack defaults when a specialty is first enabled~~ — *wiring hook landed in Phase 0 (`settingsService.updateSettings` → `seedSpecialtyDefaults`); per-pack handlers are no-ops until each pack's phase replaces them*
