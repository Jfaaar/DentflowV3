# Pack: Foundations & cleanup  ·  Phase 0  ·  Status: `done (foundations); profile consumers carried into Phase 1+`

> Lays the rails for every later pack. **No new clinical UI** — core key promotion,
> `SPECIALTY_PROFILES` scaffolding (with today's behaviour), the catalog test, and the
> lazy-seed hook. Design context: [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §2, §7, §8. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md).

Specialty codes covered: all 11 (touches the shared/core layer only).

---

## 1. Goal

Make "feature key" a clean, well-tested abstraction and give `primary_specialty` a real
effect via a single `SPECIALTY_PROFILES` map — *without changing visible behaviour yet*.
After this phase, adding a pack is "fill slots", and switching primary specialty already
routes through the profile map (today it just returns the dental-vs-generic split).

## 2. Feature keys this pack adds / changes

| Key | Cat | default_specialties | default_permission | Change |
|---|---|---|---|---|
| `vitals` | clinical | `all−dental` → **`all`** | `clinical.view` | promote |
| `problemList` | clinical | `all−dental` → **`all`** | `clinical.view` | promote |
| `clinicalNotes` | clinical | `all` | `clinical.view` | add (or decide: never-gated) |
| `allergies` | clinical | `all` | `clinical.view` | add (or decide: never-gated) |
| `medicationList` | clinical | `all` | `clinical.view` | add (or decide: never-gated) |
| `quotes` | operations | `all` | `quotes.view` | surface existing permission as a feature key |
| `referrals` | operations | `all` | `documents.view` | add (UI may land in Phase 6; key + gate now) |
| `certificates` | operations | `all` | `documents.view` | add (same) |

> **Decision needed (record in §7):** are `clinicalNotes`/`allergies`/`medicationList`
> real toggleable features, or always-on (no key)? Leaning toggleable for parity, but a
> dental-only clinic disabling "medication list" would be odd — likely keep them on with
> `default_specialties = all` and no realistic reason to override off.

## 3. Data model

No new tables. Possible: `head_circumference_cm` on `vital_signs` can wait for Phase 2.
`allergies` / `medicationList` may already be represented inside `clinical_notes` or
patient JSON — audit first; if they need their own tables, that's a small migration here.

## 4. Layout profile — introduce `SPECIALTY_PROFILES`

New file `frontend/src/features/settings/specialtyProfiles.ts`:

```ts
import type { SpecialtyCode } from './api/settingsApi';
import type { FeatureKey } from '@/lib/features';

export type RecordTab = FeatureKey | 'overview' | 'billing' | 'documents';

export interface SpecialtyProfile {
  code: SpecialtyCode;
  recordTabs: RecordTab[];
  primaryChart: 'dentalChart' | 'bodyRegionChart' | 'growthCharts' | 'eyeExam' | 'none';
  dashboardPreset: string;          // resolved to a widget list (code default now, clinic row in Phase 6)
  appointmentTypes: string[];       // i18n keys / ids
  templates: { prescription: string; quote: string; referral: string; certificate: string };
}

export const SPECIALTY_PROFILES: Record<SpecialtyCode, SpecialtyProfile> = {
  general_practice: { code:'general_practice', recordTabs:['overview','vitals','problemList','medicationList','allergies','clinicalNotes','documents','billing'], primaryChart:'bodyRegionChart', dashboardPreset:'gp', appointmentTypes:['consultation','followUp','annualPhysical','vaccination','procedure','teleconsultation'], templates:{prescription:'generic',quote:'generic',referral:'generic',certificate:'generic'} },
  dental: { code:'dental', recordTabs:['overview','dentalChart','treatments','clinicalNotes','documents','quotes','billing'], primaryChart:'dentalChart', dashboardPreset:'dental', appointmentTypes:['exam','cleaning','filling','rootCanal','extraction','crownBridge','implant','orthoAdjustment','whitening','emergency'], templates:{prescription:'dental',quote:'dentalEstimate',referral:'dental',certificate:'generic'} },
  // … other 9 start as a copy of general_practice; packs fill them in their phase
  pediatrics: /* clone of GP for now */ ,
  gynecology: /* clone */ , cardiology: /* clone */ , dermatology: /* clone */ ,
  ent: /* clone */ , ophthalmology: /* clone */ , orthopedics: /* clone */ ,
  psychiatry: /* clone */ , other: /* clone */ ,
};
```

Then make consumers read it instead of hard-coding:
- `useClinicSpecialty()` → add `profile = SPECIALTY_PROFILES[primarySpecialty]`; deprecate the ad-hoc `isDental` (keep it as `primarySpecialty === 'dental'` for one release, mark `@deprecated`).
- Patient record (`PatientDetailsModal` / patient dashboard) → tab order from `profile.recordTabs`, visual chart from `profile.primaryChart`.
- `DashboardPage` → widget set from `profile.dashboardPreset` (start with two presets: `gp` = today's dashboard, `dental` = today's dashboard; real divergence comes with each pack).
- `AppointmentModal` → appointment-type options from `profile.appointmentTypes` (today's hard-coded list becomes the GP preset).

## 5. Tasks

- [x] **Audit** how `allergies` / `medicationList` / SOAP notes are stored today — `patient_medical_history` already has `allergies TEXT[]`, `medications TEXT[]`, `conditions TEXT[]`; `clinical_notes` holds SOAP fields. No new tables needed in Phase 0.
- [x] **Decision:** which of `clinicalNotes`/`allergies`/`medicationList` become feature keys vs. always-on → **all three are feature keys with `default_specialties = all 11`** (auto-on everywhere; can still be overridden off per clinic).
- [x] Migration `0012_core_feature_keys.sql`:
  - [x] `UPDATE feature_definitions SET default_specialties = ARRAY[...11...] WHERE feature_key IN ('vitals','problemList')`
  - [x] `INSERT … ON CONFLICT DO UPDATE` rows for `clinicalNotes`, `allergies`, `medicationList`, `quotes`, `certificates`, `referrals`
  - [x] re-runnable
- [x] `backend/lib/features.js` `FEATURE_KEYS` — six new keys added (sort order matches the seed)
- [x] `frontend/src/lib/features.ts` `FEATURE_KEYS` — same
- [x] Catalog test (`backend/__tests__/featureCatalog.test.js`): 9 tests asserting
  - [x] `FEATURE_KEYS` (backend) === `FEATURE_KEYS` (frontend) (same set + same order)
  - [x] every `FEATURE_KEYS` entry has a seeded `feature_definitions` row and vice versa
  - [x] every `default_specialties` entry ⊆ the 11-code whitelist
  - [x] every `default_permission` ∈ `ALL_PERMISSIONS`
  - [x] every `category` ∈ {clinical, operations, admin}
  - [x] `vitals` + `problemList` cover all 11 specialties
  - [x] the six new core keys cover all 11 specialties
- [x] `frontend/src/features/settings/specialtyProfiles.ts` — `SPECIALTY_PROFILES` map (GP + dental real, other 9 = GP clones)
- [x] Refactor `useClinicSpecialty.ts` to expose `profile`; legacy `isDental` / `isGeneralPractice` kept and marked `@deprecated`
- [x] Grep & migrate `isDental` usages — 3 call sites (`TreatmentFormModal`, `PatientDashboard`, `ClinicalNotesRoute`) now read `has('dental')` directly. `Sidebar` never used `isDental`. The deprecated `isDental` / `isGeneralPractice` hook fields are kept for type back-compat but no consumer reads them.
- [ ] Refactor `PatientDetailsModal` / patient record to read `recordTabs` + `primaryChart` from `profile` — **deliberately deferred to each pack's phase**. Today's `PatientDashboard` tab set doesn't match the canonical `GP_PROFILE.recordTabs` (which lists `vitals` / `problemList` / `medicationList` / `allergies` etc. as top-level tabs that don't exist as standalone surfaces yet). A faithful refactor needs UX work + new tab components, not a behaviour-preserving rewire. Each clinical pack ships the tabs its profile lists.
- [ ] Refactor `DashboardPage` to read `dashboardPreset` from `profile` — **deferred for the same reason**. Today there's one dashboard. The 'dental' / 'pediatrics' / 'cardiology' / etc. presets are different widget layouts that don't exist yet. Each pack ships its preset with its phase.
- [ ] Refactor `AppointmentModal` to read `appointmentTypes` from `profile` — **deferred to Phase 6 (cross-cutting templates)** when `appointment_types` becomes a clinic-scoped, editable table. The code defaults in `SPECIALTY_PROFILES` are the seed source; today's hard-coded list keeps working until Phase 6 makes it dynamic.
- [x] `backend/services/settingsService.js#update`: detects `enabled_specialties` growth, calls `seedSpecialtyDefaults(db, clinicId, addedCodes)` from `backend/services/specialtyDefaultsSeeder.js` (per-specialty no-op handlers; logs only — packs replace their handler in their phase); never acts on shrink
- [ ] i18n: labels for the new feature keys (FR/EN/AR) — deferred; not surfaced in UI today (Features admin page renders the DB `display_name` directly)
- [ ] Update [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 ("today vs proposed") and §2 recommendation status

## 6. Verification

- [ ] App looks/behaves identical to before for a GP clinic and a dental clinic
- [ ] `feature_definitions` shows `vitals`/`problemList` with all 11 specialties; a dental clinic now also has them auto-on (collapsed in the dental profile, but reachable)
- [ ] Catalog test green; CI green
- [ ] Changing primary specialty from `general_practice` to `dental` flips the patient-record tab order and the dashboard preset via `SPECIALTY_PROFILES` (not via `if (isDental)`)

## 7. Open questions / decisions

- [ ] `clinicalNotes` / `allergies` / `medicationList`: feature keys or always-on?
- [ ] Are `allergies` / `medicationList` already first-class tables, or fields on `clinical_notes` / patient record? (drives whether Phase 0 includes a small migration)
- [ ] `referrals` / `certificates`: register the keys + route gates now even though the UI ships in Phase 6? (recommended: yes — cheap, lets Phase 1+ link to them)
- [ ] Naming: `medicationList` vs `medications` — pick one and lock it in the catalog
