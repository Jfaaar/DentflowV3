# Specialty Packs — Work System

This directory is the **execution system** for turning [`/SPECIALTY_FEATURES.md`](../../SPECIALTY_FEATURES.md)
(the *design spec* — the "what") into shipped code (the "how / when / track").

> One-line goal: when an admin picks a **primary specialty** in Settings, the app
> re-skins into that specialty's system (record tabs, charts, dashboard, appointment
> types, templates); when they toggle a specialty in **enabled specialties**, that
> pack's clinical modules turn on/off — with per-clinic overrides always winning.

---

## How this is organized

| File | Purpose |
|---|---|
| [`/SPECIALTY_FEATURES.md`](../../SPECIALTY_FEATURES.md) | **Design spec.** The matrix, per-specialty feature lists, data-model sketches, layout-profile design. Read this first. |
| [`ROADMAP.md`](ROADMAP.md) | **Phases 0–6** with milestones, dependencies, exit criteria, and a checklist per phase. |
| [`CONVENTIONS.md`](CONVENTIONS.md) | **The recipe.** Exact end-to-end steps to add a feature key / module, file & folder layout, naming, RLS pattern, the per-module checklist template. |
| [`FEATURE-CATALOG.md`](FEATURE-CATALOG.md) | **Canonical key table.** Every feature key (live + planned): key, category, `default_specialties`, `default_permission`, status, phase, owning pack doc. The migration seed should be generated to match this. |
| [`packs/_TEMPLATE.md`](packs/_TEMPLATE.md) | The work-order template every pack doc is cloned from. |
| `packs/NN-<name>.md` | One **work order** per pack — the trackable unit. Overview, keys, tables, backend tasks, frontend tasks, layout-profile changes, i18n, tests, exit criteria. All checkboxes. |

**Workflow:** pick the next phase in [`ROADMAP.md`](ROADMAP.md) → open its pack doc(s) →
work the checklist top to bottom → tick boxes as you go → update the status board below
and the `Status` column in [`FEATURE-CATALOG.md`](FEATURE-CATALOG.md) → move to the next.

---

## Status board

Legend: `planned` · `in progress` · `review` · `done`

### Phases

| Phase | Theme | Status | Pack docs |
|---|---|---|---|
| 0 | Foundations & cleanup (core keys, `SPECIALTY_PROFILES` scaffolding) | `done` (consumer rewires of `recordTabs` / `dashboardPreset` / `appointmentTypes` correctly carry into each pack's phase) | [00-phase-0-foundations](packs/00-phase-0-foundations.md) |
| 1 | Dental pack | `in progress` | [01-dental](packs/01-dental.md) |
| 2 | Pediatrics pack | `planned` | [02-pediatrics](packs/02-pediatrics.md) |
| 3 | Dermatology pack | `planned` | [03-dermatology](packs/03-dermatology.md) |
| 4 | Cardiology / Ophthalmology / ENT / Orthopaedics packs | `planned` | [04-cardiology](packs/04-cardiology.md) · [05-ophthalmology](packs/05-ophthalmology.md) · [06-ent](packs/06-ent.md) · [07-orthopedics](packs/07-orthopedics.md) |
| 5 | Gynaecology / Psychiatry packs (needs confidential-note work) | `planned` | [08-gynecology](packs/08-gynecology.md) · [09-psychiatry](packs/09-psychiatry.md) |
| 6 | Cross-cutting templates (appointment types, doc kinds, certificates, referrals, dashboards) | `planned` | [11-cross-cutting](packs/11-cross-cutting.md) |
| — | General Practice pack (incremental, mostly in phases 0/2/4) | `planned` | [10-general-practice](packs/10-general-practice.md) |

### Per-pack module rollout

| Pack | New feature keys | Status | Doc |
|---|---|---|---|
| Core / foundations | `clinicalNotes`, `allergies`, `medicationList`, `quotes`(surface), `referrals`, `certificates` + promote `vitals`/`problemList` to all | `done` (DB seed + mirrors + catalog test + `SPECIALTY_PROFILES` + `useClinicSpecialty` + seeder hook + `isDental` migration; profile-driven consumer rewires carry into pack phases) | [00](packs/00-phase-0-foundations.md) |
| Dental | `perioChart`, `endoChart`, `orthoModule` | `in progress` — **backend complete** (catalog `0013`, schema `0014`, perio API `277b98c`, endo/ortho/lab API `8477a04`); UI + layout-profile consumers + seed handler still to ship | [01](packs/01-dental.md) |
| Pediatrics | `growthCharts`, `developmentMilestones`, `newbornScreening` (`vaccinations` already live) | `planned` | [02](packs/02-pediatrics.md) |
| Dermatology | `dermAtlas`, `skinProcedures`, `cosmeticModule` | `planned` | [03](packs/03-dermatology.md) |
| Cardiology | `cardiacStudies`, `cardioRiskScores`, `bpTrends`, `anticoagClinic` | `planned` | [04](packs/04-cardiology.md) |
| Ophthalmology | `visualAcuity`, `tonometry`, `fundusExam`, `opticalDispensing` | `planned` | [05](packs/05-ophthalmology.md) |
| ENT | `audiometry`, `endoscopyEnt`, `vestibularModule` | `planned` | [06](packs/06-ent.md) |
| Orthopaedics | `orthoExam`, `fractureBoard`, `physioPlan`, `injectionLog` | `planned` | [07](packs/07-orthopedics.md) |
| Gynaecology | `gynExam`, `obstetrics`, `partogram` | `planned` | [08](packs/08-gynecology.md) |
| Psychiatry | `psychAssessments`, `psychNotes`, `carePlanPsych` (+ `clinical.psychSensitive.view` perm) | `planned` | [09](packs/09-psychiatry.md) |
| General Practice | `chronicCare`, `preventiveCare` (`vaccinations`, `cardioRiskScores`, `bpTrends`, `physioPlan` shared) | `planned` | [10](packs/10-general-practice.md) |
| Cross-cutting | `appointment_types`, `document_kinds`, `certificate_templates`, `referral_templates`, `dashboard_presets` (data, not feature keys) | `planned` | [11](packs/11-cross-cutting.md) |

---

## Definition of done — a pack ships when…

1. **Catalog:** its feature keys are in [`FEATURE-CATALOG.md`](FEATURE-CATALOG.md), in the `feature_definitions` seed migration, and mirrored in `backend/lib/features.js` + `frontend/src/lib/features.ts` (`FEATURE_KEYS`). The catalog test passes (every key ↔ one DB row).
2. **Backend:** migration (tables + RLS mirroring `0003`/`0008`), repository, service, controller, route file gated by `requireFeature('<key>')`, validation schema, route registered in `backend/index.js`. New permissions (if any) added to `backend/lib/rolePermissions.js`.
3. **Frontend:** feature folder under `frontend/src/features/<pack>/`, RTK Query api slice, page + components, route in `App.tsx` wrapped in `ProtectedRoute` with the feature key, sidebar entry, i18n keys (FR/EN/AR) for every new string. New permissions added to `frontend/src/lib/permissions.ts` + Roles page.
4. **Layout profile:** the pack's specialties are represented in `SPECIALTY_PROFILES` (record tabs, primary chart, dashboard preset, appointment-type seeds, templates). `useClinicSpecialty` / patient record / dashboard / `AppointmentModal` read from it.
5. **Seeding:** `settingsService.update` lazily seeds the pack's clinic-scoped defaults (appointment types, doc kinds, templates) the first time a clinic enables one of its specialties. Disable never deletes data.
6. **Verification:** switching the demo clinic's primary specialty to one of the pack's specialties visibly produces that specialty's system; toggling it in `enabled_specialties` adds/removes the modules; a clinic override pins them. Manual walkthrough recorded in the pack doc's "Verification" section.
7. **Docs:** pack doc checklist fully ticked; status board above and `FEATURE-CATALOG.md` `Status` columns updated.

---

## Source of truth precedence

1. **Code & migrations** — what actually runs.
2. **[`FEATURE-CATALOG.md`](FEATURE-CATALOG.md)** — the agreed key list; migrations are written to match it.
3. **[`/SPECIALTY_FEATURES.md`](../../SPECIALTY_FEATURES.md)** — the design rationale; update it if a decision changes.
4. **Pack docs** — the task breakdown; living checklists, expected to drift as work proceeds.

If two disagree, the higher one wins and the lower one gets fixed in the same PR.
