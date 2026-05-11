# Pack: Ophthalmology / Optometry  ·  Phase 4  ·  Status: `planned`

> "Primary specialty = Ophthalmology ⇒ an eye-clinic system." Design context:
> [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §4.8. Recipe: [`../CONVENTIONS.md`](../CONVENTIONS.md). Most data is **per-eye (OD/OS)**; `opticalDispensing` overlaps `inventory`.

Specialty codes covered: `ophthalmology`

---

## 1. Goal

Primary specialty Ophthalmology → patient record built around **per-eye data**:
**visual acuity + refraction** (sphere/cyl/axis/add → glasses Rx output), **IOP /
tonometry** trend (glaucoma follow-up), **fundus / slit-lamp exam** with OCT / fundus
photo / visual-field attachment, and **optical dispensing** (frames & lenses catalog,
glasses order workflow). Dashboard: glaucoma IOP-not-controlled list, diabetic
retinopathy recalls, glasses orders ready for collection, post-cataract follow-ups.

## 2. Feature keys this pack adds

| Key | Cat | default_specialties | default_permission | New? |
|---|---|---|---|---|
| `visualAcuity` | clinical | `['ophthalmology']` | `clinical.view` | yes |
| `tonometry` | clinical | `['ophthalmology']` | `clinical.view` | yes |
| `fundusExam` | clinical | `['ophthalmology']` | `clinical.view` | yes |
| `opticalDispensing` | operations | `['ophthalmology']` | `inventory.view` | yes |

Reuses: `documents` (OCT, fundus photo, visual fields), `prescriptions` (glasses/CL Rx — likely a *separate* `glasses_prescriptions` table, not the drug Rx flow), `inventory` (frames/lens stock).

## 3. Data model

| Table | Key columns | Notes |
|---|---|---|
| `eye_exams` | `id, clinic_id, patient_id, examined_at, examined_by, va_od, va_os, va_scale(snellen/logmar), refraction_od jsonb {sph,cyl,axis,add}, refraction_os jsonb, iop_od, iop_os, iop_method(gat/ncT/icare), anterior_segment_od/os jsonb, posterior_segment_od/os jsonb, notes` | one combined eye exam (most fields per-eye) |
| `glasses_prescriptions` | `id, clinic_id, patient_id, eye_exam_id?, prescribed_at, od jsonb, os jsonb, pd_mm, lens_type(sv/bifocal/progressive), notes` | dispensable Rx |
| `optical_orders` | `id, clinic_id, patient_id, glasses_prescription_id, frame_inventory_id, lens_options jsonb, status(ordered/in_lab/ready/collected), ordered_at, ready_at, collected_at, price` | dispensing workflow |

`inventory` items get an optional `optical_kind`(frame/lens) discriminator, or a
dedicated `optical_products` table — decide in §7. RLS for new tables per `0011`.

## 4. Layout profile — `SPECIALTY_PROFILES['ophthalmology']`

- **recordTabs:** Overview · **Refraction & VA** (`visualAcuity`) · IOP trend (`tonometry`) · Fundus/segment exam (`fundusExam`) · Imaging (`documents`: OCT, fundus, VF) · Glasses/Rx history (`opticalDispensing`) · Notes (`clinicalNotes`) · Billing
- **primaryChart:** `eyeExam` (a schematic OD/OS pair rather than a body chart)
- **dashboardPreset:** `ophthalmology` — glaucoma IOP-not-controlled list, diabetic retinopathy screening recalls, glasses orders ready for collection, post-cataract follow-ups
- **appointmentTypes:** eye exam / refraction, glaucoma follow-up, diabetic retinopathy screen, OCT, visual field, minor procedure (chalazion / foreign body), cataract pre-op, cataract post-op, contact-lens fit
- **templates:** `prescription: glasses` (+ contact-lens), `quote: generic`, `referral: ophthal` (retina / cataract surgery), `certificate: drivingVision`

## 5. Tasks

### Module: `visualAcuity` — VA & refraction
- [ ] Catalog ×3 + seed (`['ophthalmology']`, perm `clinical.view`)
- [ ] Migration: `eye_exams` (the VA/refraction parts) + `glasses_prescriptions` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('visualAcuity')`) · register; "generate glasses Rx from this exam" action
- [ ] Frontend: `features/ophthalmology/` · `api/eyeExamApi.ts` · RefractionPage — OD/OS columns, VA picker (Snellen/logMAR toggle), sph/cyl/axis/add inputs, PD, "issue glasses Rx" button → glasses Rx output (printable)
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests: Snellen↔logMAR conversion · Rx generation · component · Verification

### Module: `tonometry` — IOP
- [ ] Catalog ×3 + seed · Migration: IOP fields on `eye_exams` (same table; this module just surfaces the trend) — or a slim `iop_readings` table if measured outside a full exam
- [ ] Backend: trend query endpoint (`requireFeature('tonometry')`)
- [ ] Frontend: `features/ophthalmology/` · IOPTrendPanel — OD/OS IOP over time, target line, method tag
- [ ] Route/panel + ProtectedRoute + routes.ts · Sidebar NavItem/tab · i18n · layout tab
- [ ] Tests · Verification

### Module: `fundusExam` — segment / fundus findings
- [ ] Catalog ×3 + seed · Migration: anterior/posterior segment JSONB on `eye_exams` + RLS (covered by `eye_exams`)
- [ ] Backend: covered by eye-exam endpoints; gate the segment fields' route variant with `requireFeature('fundusExam')`
- [ ] Frontend: `features/ophthalmology/` · FundusExamPage — slit-lamp + fundus structured findings per eye, OCT / fundus-photo / visual-field attachment via `documents`
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem · i18n · layout tab
- [ ] Tests · Verification

### Module: `opticalDispensing` — frames/lenses + glasses orders
- [ ] Catalog ×3 + seed (`category: operations`, perm `inventory.view`)
- [ ] Migration: `optical_products` (or `optical_kind` on inventory items) + `optical_orders` + RLS
- [ ] Backend: repo/service/controller/validation/route(`requireFeature('opticalDispensing')`) · register; integrate with `inventory` stock
- [ ] Frontend: `features/ophthalmology/` · `api/opticalApi.ts` · OpticalDispensingPage — frames catalog, lens options, order workflow (ordered → in lab → ready → collected), "ready for collection" list feeding the dashboard
- [ ] Route + ProtectedRoute + routes.ts · Sidebar NavItem (operations group) · i18n · layout tab
- [ ] Tests · Verification

### Pack-level
- [ ] `SPECIALTY_PROFILES['ophthalmology']` per §4 + `ophthalmology` dashboard preset
- [ ] Document kinds: OCT, fundus photo, visual field
- [ ] Inventory catalog seed: dilating/anaesthetic drops, diagnostic lenses, **frames & lens stock**
- [ ] `seedSpecialtyDefaults(clinicId, ['ophthalmology'])` — ophthal appointment types, document kinds, glasses/CL Rx templates, ophthal referral & driving-vision cert templates, inventory catalog
- [ ] Sidebar grouping reviewed · i18n complete (FR/EN/AR) · [`/SPECIALTY_FEATURES.md`](../../../SPECIALTY_FEATURES.md) §10 updated

## 6. Verification

- [ ] Primary specialty `ophthalmology` → record shows OD/OS refraction, IOP trend, fundus exam, glasses Rx printable, optical orders board; dashboard shows glaucoma/diabetic/glasses-ready
- [ ] Switch away → ophthal tabs/dashboard gone; switch back → restored; data preserved
- [ ] Clinic override pins `opticalDispensing` off → optical board gone, route 403s

## 7. Open questions / decisions

- [ ] One `eye_exams` table holding VA+refraction+IOP+segments, or split (`refractions`, `iop_readings`, `fundus_exams`)? (recommend one `eye_exams` table — an exam visit captures all of it; the three feature keys just gate which tabs/fields show)
- [ ] Glasses Rx: a `glasses_prescriptions` table, or shoehorn into the existing drug-`prescriptions` model? (recommend separate table — totally different shape)
- [ ] Frames/lenses: discriminator on `inventory` items vs. a dedicated `optical_products` table? (lean: discriminator + the existing inventory/stock machinery)
