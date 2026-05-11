# Pack: Dermatology  ·  Phase 3  ·  Status: `planned`

> "Primary specialty = Dermatology ⇒ a derm (+ aesthetic) system." Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §4.6. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md). Mostly photo + scoring UI on top of the existing `body_region_findings` model and `documents`.

Specialty codes covered: `dermatology`

---

## 1. Goal

Primary specialty Dermatology → patient record centred on a **skin body-map** (lesion
plotting), a **dermoscopy gallery**, a **procedures** log (biopsy/excision/cryo/laser
with histopathology result linkage), **scoring widgets** (ABCDE / PASI / SCORAD / DLQI
with history), and a **cosmetic module** (injection maps, before/after photo timelines,
package/session tracking). Inventory tracks **fillers/toxins with lot + expiry**.

## 2. Feature keys this pack adds

| Key | Cat | default_specialties | default_permission | New? |
|---|---|---|---|---|
| `dermAtlas` | clinical | `['dermatology']` | `clinical.view` | yes |
| `skinProcedures` | clinical | `['dermatology']` | `clinical.view` | yes |
| `cosmeticModule` | clinical | `['dermatology']` | `clinical.view` | yes |

Reuses: `bodyRegionChart` data model (extend with `discipline`+`details`), `documents` (clinical photos, dermoscopy), `treatments`/`quotes` (cosmetic packages/plans), `inventory` (fillers/toxins lot tracking).

## 3. Data model

| Table | Key columns | Notes |
|---|---|---|
| `body_region_findings` (+cols) | `discipline TEXT, details JSONB` | reused by derm/ortho/injectionLog instead of 3 near-identical tables |
| `skin_lesions` *(or just use body_region_findings)* | `id, clinic_id, patient_id, body_map_x, body_map_y, body_part, morphology, size_mm, dermoscopy_file_id, status(monitor/excised/benign/malignant), first_seen, notes` | mole/lesion map + tracking |
| `skin_procedures` | `id, clinic_id, patient_id, procedure_type(biopsy/excision/cryo/laser/curettage), site, lesion_id?, performed_at, performed_by, histopath_result_id?, consent_file_id, notes` | links to a `documents` histopath result |
| `cosmetic_sessions` | `id, clinic_id, patient_id, treatment(botox/filler/peel/laser/…), injection_map jsonb, product_lot, before_file_id, after_file_id, package_id?, session_number, performed_at, performed_by, notes` | aesthetic timeline |

RLS for new tables: copy the `0011` `DO $$ … FOREACH` block.

## 4. Layout profile — `SPECIALTY_PROFILES['dermatology']`

- **recordTabs:** Overview · **Skin map** (`dermAtlas`) · Dermoscopy gallery (`documents` filtered) · Procedures (`skinProcedures`) · Scores (ABCDE/PASI/SCORAD/DLQI) · Notes (`clinicalNotes`) · Medications (`medicationList`) · Imaging/Photos (`documents`) · Billing
- **primaryChart:** `bodyRegionChart` (rendered in "skin atlas" mode)
- **dashboardPreset:** `dermatology` — biopsy results pending, lesions flagged for re-check, phototherapy course progress, cosmetic package sessions remaining
- **appointmentTypes:** dermatology consultation, mole check / skin-cancer screen, biopsy, excision, cryotherapy, laser, phototherapy, cosmetic consult, botox/filler, follow-up
- **templates:** `prescription: derm` (topicals, isotretinoin presets), `quote: cosmeticPlan`, `referral: derm`, `certificate: generic` (+ procedure consent + post-care document)

## 5. Tasks

### Module: `dermAtlas` — Skin lesion body-map
- [ ] Catalog ×3 + seed (`['dermatology']`, perm `clinical.view`)
- [ ] Migration: `discipline`+`details` on `body_region_findings` (or `skin_lesions` table) + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('dermAtlas')`) · register
- [ ] Frontend: `features/dermatology/` · `api/dermAtlasApi.ts` · SkinMapPage — clickable body silhouette, lesion pins, per-lesion drawer (morphology, size, dermoscopy photo, status, history), mole-tracking timeline; ABCDE/PASI/SCORAD/DLQI scoring widgets
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout profile
- [ ] Tests: route 200/403 · scoring math · component · sidebar-hidden · Verification

### Module: `skinProcedures`
- [ ] Catalog ×3 + seed · Migration: `skin_procedures` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('skinProcedures')`) · register; link `histopath_result_id` to `documents`
- [ ] Frontend: `features/dermatology/` · `api/skinProceduresApi.ts` · ProceduresPage (log, consent attach, histopath result linkage, follow-up flag)
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Module: `cosmeticModule`
- [ ] Catalog ×3 + seed · Migration: `cosmetic_sessions` (+ optional `cosmetic_packages`) + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('cosmeticModule')`) · register; lot tracking links to `inventory`
- [ ] Frontend: `features/dermatology/` · `api/cosmeticApi.ts` · CosmeticPage (injection-map canvas, before/after photo slider, package/session counter)
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Pack-level
- [ ] `SPECIALTY_PROFILES['dermatology']` per §4 + `dermatology` dashboard preset
- [ ] Document kinds: clinical photo, dermoscopy, histopathology report
- [ ] Inventory catalog seed: liquid nitrogen, biopsy punches, sutures, **fillers/toxins (lot + expiry tracked)**, topicals
- [ ] `seedSpecialtyDefaults(clinicId, ['dermatology'])` — derm appointment types, derm document kinds, derm Rx/cosmetic-plan/referral/consent templates, derm inventory catalog
- [ ] Sidebar grouping reviewed · i18n complete (FR/EN/AR) · [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 6. Verification

- [ ] Primary specialty `dermatology` → record opens on skin map, procedures + cosmetic tabs present, scoring widgets work, before/after photo timelines render, inventory pre-seeded with fillers (lot/expiry)
- [ ] Switch away → derm tabs/dashboard gone; switch back → restored; data preserved
- [ ] Clinic override pins `cosmeticModule` off → cosmetic tab disappears, route 403s

## 7. Open questions / decisions

- [ ] Reuse `body_region_findings` (with `discipline`/`details`) for lesions, or a dedicated `skin_lesions` table? (recommend reuse — keeps one body-map model for derm/ortho/injections)
- [ ] Cosmetic packages: a `treatments`/`quotes`-backed "package" type, or its own `cosmetic_packages` table? (leaning: small `cosmetic_packages` table linked to `cosmetic_sessions` for session counting)
- [ ] Photo storage: existing `documents`/`uploads` pipeline handles before/after pairs — confirm it can tag pairs and a "cosmetic" kind
