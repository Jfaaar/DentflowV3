# Pack: Psychiatry & Mental Health  ·  Phase 5  ·  Status: `planned`

> "Primary specialty = Psychiatry ⇒ a mental-health system." Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §4.10. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md). This pack owns the **confidential-note groundwork** shared with [08-gynecology](08-gynecology.md) — do that first.

Specialty codes covered: `psychiatry`

---

## 1. Goal

Primary specialty Psychiatry → patient record has **scored assessments** (PHQ-9, GAD-7,
MMSE, MoCA, AUDIT, …) with trends, an **MSE (mental status exam) + risk assessment**
template, **therapy session notes** (extra-confidential — restricted from some staff), a
**care plan / crisis plan** with a medication-titration schedule, and a **medication
monitoring** panel (lithium / clozapine / metabolic bloods due). Dashboard: high-risk
patients flagged, assessment scores worsening, monitoring bloods due, missed-appointment
(DNA) follow-up list.

## 2. Feature keys this pack adds

| Key | Cat | default_specialties | default_permission | New? |
|---|---|---|---|---|
| `psychAssessments` | clinical | `['psychiatry']` | `clinical.view` | yes |
| `psychNotes` | clinical | `['psychiatry']` | `clinical.psychSensitive.view` *(new perm)* | yes |
| `carePlanPsych` | clinical | `['psychiatry']` | `treatments.view` | yes |

New permission: **`clinical.psychSensitive.view`** (or generic `clinical.sensitive.view`).

## 3. Confidentiality groundwork (do first — shared with gynaecology)

- [ ] Add `clinical.psychSensitive.view` (and/or `clinical.sensitive.view`) to `backend/lib/rolePermissions.js` `ALL_PERMISSIONS`; grant to `clinic_admin` + `doctor` by default, **not** `assistant` (overridable per clinic via `role_permission_overrides`)
- [ ] Mirror in `frontend/src/lib/permissions.ts`; it then appears in the Roles page automatically
- [ ] `sensitive BOOLEAN NOT NULL DEFAULT false` column on note-bearing tables that need it (`psych_notes`, `gyn_exams`, `pregnancy_episodes`, optionally `clinical_notes`)
- [ ] Enforcement: repositories filter out `sensitive` rows when the requester lacks the permission; controllers double-check; RLS stays clinic-scoped (the sensitivity filter is app-layer since it's role-based, not tenant-based)
- [ ] Frontend: a lock toggle on the note editor; sensitive notes show a lock badge; hidden entirely from users without the permission
- [ ] Per-clinic toggle: "who can see sensitive notes" surfaces in the Roles page as the override on this permission (no extra UI needed)

## 4. Data model

| Table | Key columns | Notes |
|---|---|---|
| `psych_assessments` | `id, clinic_id, patient_id, administered_at, administered_by, instrument(phq9/gad7/mmse/moca/audit/…), responses jsonb, total_score, subscores jsonb, severity_band, notes` | scored questionnaire, trended |
| `psych_notes` | `id, clinic_id, patient_id, written_at, written_by, note_type(mse/therapy_session/risk_assessment), mse jsonb, risk_assessment jsonb, content, sensitive bool NOT NULL DEFAULT true` | MSE / therapy / risk; sensitive by default |
| `psych_care_plans` | `id, clinic_id, patient_id, created_at, created_by, crisis_plan, relapse_prevention, goals, medication_titration jsonb (drug, target dose, step schedule), review_date, status` | care/crisis plan |
| `med_monitoring` | `id, clinic_id, patient_id, drug(lithium/clozapine/valproate/antipsychotic_metabolic), test, last_done_at, next_due_at, last_result, notes` | bloods-due tracker |

RLS for new tables per `0011`; plus the `sensitive` app-layer filter.

## 5. Layout profile — `SPECIALTY_PROFILES['psychiatry']`

- **recordTabs:** Overview · **Assessments** (`psychAssessments`, scored + trend) · MSE & risk (`psychNotes`) · Therapy notes (`psychNotes`, confidential) · Medications (`medicationList`, psychotropics + titration) · Care/crisis plan (`carePlanPsych`) · Monitoring (`med_monitoring`) · Notes (`clinicalNotes`) · Billing
- **primaryChart:** `none` (assessment-score trend chart instead)
- **dashboardPreset:** `psychiatry` — high-risk patients flagged, assessment scores worsening, medication-monitoring bloods due, missed-appointment (DNA) follow-up list
- **appointmentTypes:** psychiatric assessment, medication review, therapy session (individual/family/group), crisis appointment, follow-up, teleconsultation
- **templates:** `prescription: psych`, `quote: generic`, `referral: psych` (psychology / inpatient / crisis team), `certificate: fitnessForWorkMentalHealth` (+ psychiatric report, therapy progress note)

## 6. Tasks

### Module: `psychAssessments`
- [ ] Catalog ×3 + seed (`['psychiatry']`, perm `clinical.view`)
- [ ] Migration: `psych_assessments` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('psychAssessments')`) · register; scoring done server-side from `responses` per instrument
- [ ] Frontend: `features/psychiatry/` · `api/psychAssessmentsApi.ts` · AssessmentsPage — instrument picker, questionnaire form, computed score + severity band, trend chart across administrations
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests: scoring per instrument against published cutoffs · component · Verification

### Module: `psychNotes` (sensitive)
- [ ] Catalog ×3 + seed (`['psychiatry']`, perm `clinical.psychSensitive.view`)
- [ ] Migration: `psych_notes` (`sensitive` default true) + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('psychNotes')` + the sensitive filter) · register
- [ ] Frontend: `features/psychiatry/` · `api/psychNotesApi.ts` · MSEPage (structured mental status exam), RiskAssessmentPage, TherapyNotePage — all behind the permission, lock badge shown
- [ ] Route + ProtectedRoute(feature="psychNotes") + routes.ts · Sidebar NavItem (hidden without permission) · i18n · layout tabs
- [ ] Tests: 403 without perm; rows hidden in lists without perm; visible with perm · Verification

### Module: `carePlanPsych`
- [ ] Catalog ×3 + seed (`['psychiatry']`, perm `treatments.view`)
- [ ] Migration: `psych_care_plans` + `med_monitoring` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('carePlanPsych')`) · register; `med_monitoring` due-dates feed the dashboard
- [ ] Frontend: `features/psychiatry/` · `api/carePlanApi.ts` · CarePlanPage (crisis plan, relapse-prevention, goals, medication-titration schedule), MonitoringPanel (bloods due)
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tabs
- [ ] Tests · Verification

### Pack-level
- [ ] Confidentiality groundwork (§3) complete and tested before the gyn pack consumes it
- [ ] `SPECIALTY_PROFILES['psychiatry']` per §5 + `psychiatry` dashboard preset
- [ ] DNA (did-not-attend) tracking off the appointments data → dashboard widget
- [ ] `seedSpecialtyDefaults(clinicId, ['psychiatry'])` — psych appointment types, Rx/referral/fitness-cert/report templates; inventory minimal (depot injections only)
- [ ] Sidebar grouping reviewed · i18n complete (FR/EN/AR) · [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 7. Verification

- [ ] Primary specialty `psychiatry` → record shows assessments (with trend), MSE/risk, therapy notes (locked), care plan, monitoring tabs; dashboard shows high-risk / scores-worsening / bloods-due / DNA
- [ ] An `assistant` (no `clinical.psychSensitive.view`) cannot see therapy/MSE notes or the `psychNotes` route; a `doctor` can; a clinic can grant it to `assistant` via the Roles override and then they can
- [ ] Switch away → psych tabs/dashboard gone; switch back → restored; data (incl. sensitive notes) preserved
- [ ] Clinic override pins `psychAssessments` off → tab gone, route 403s

## 8. Open questions / decisions

- [ ] One generic `clinical.sensitive.view` permission (covers psych + gyn + anything future) vs. `clinical.psychSensitive.view` specifically — recommend the **generic** one; cleaner, fewer perms
- [ ] Should *all* psych notes be sensitive by default, or only therapy/MSE? (chosen: `psych_notes.sensitive` defaults true; generic `clinical_notes` stays non-sensitive unless flagged)
- [ ] Assessment instruments to ship v1: PHQ-9, GAD-7, MMSE, MoCA, AUDIT — confirm scope; the framework should make adding more a config change
- [ ] Audit logging for access to sensitive notes — likely yes (re-use `backoffice.audit` infra); track as a follow-up
