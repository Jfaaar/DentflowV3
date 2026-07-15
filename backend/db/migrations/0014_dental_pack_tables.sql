-- ============================================
-- 0014_dental_pack_tables.sql
-- Phase 1 (Dental pack) — schema for perioChart, endoChart, orthoModule,
-- and the dental lab-case board.
--
-- Six tables, all tenant-scoped via clinic_id (denormalized onto child
-- tables like perio_sites and ortho_visits so RLS stays a one-line policy).
-- RLS mirrors the 0008 / 0011 pattern.
-- ============================================

-- ─── Perio charts ────────────────────────────────────────────────────────────
-- One row per charting session; the actual 6-site data lives in perio_sites.
CREATE TABLE IF NOT EXISTS perio_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  charted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  charted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_perio_charts_patient ON perio_charts(patient_id, charted_at DESC);
CREATE INDEX IF NOT EXISTS idx_perio_charts_clinic ON perio_charts(clinic_id);
CREATE TRIGGER trg_perio_charts_updated BEFORE UPDATE ON perio_charts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Perio sites — 6 positions per tooth (buccal/lingual × mesial/mid/distal)
CREATE TABLE IF NOT EXISTS perio_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perio_chart_id UUID NOT NULL REFERENCES perio_charts(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  tooth TEXT NOT NULL,                        -- FDI: '11','21','46',…
  position TEXT NOT NULL CHECK (position IN (
    'buccal_mesial','buccal_mid','buccal_distal',
    'lingual_mesial','lingual_mid','lingual_distal'
  )),
  pocket_depth_mm INT CHECK (pocket_depth_mm IS NULL OR (pocket_depth_mm BETWEEN 0 AND 15)),
  recession_mm    INT CHECK (recession_mm    IS NULL OR (recession_mm    BETWEEN 0 AND 15)),
  bleeding_on_probing BOOLEAN NOT NULL DEFAULT FALSE,
  suppuration         BOOLEAN NOT NULL DEFAULT FALSE,
  mobility  INT CHECK (mobility  IS NULL OR (mobility  BETWEEN 0 AND 3)),  -- Miller 0..3
  furcation INT CHECK (furcation IS NULL OR (furcation BETWEEN 0 AND 4)),  -- Glickman 0..IV
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (perio_chart_id, tooth, position)
);
CREATE INDEX IF NOT EXISTS idx_perio_sites_chart ON perio_sites(perio_chart_id);
CREATE INDEX IF NOT EXISTS idx_perio_sites_clinic ON perio_sites(clinic_id);
CREATE TRIGGER trg_perio_sites_updated BEFORE UPDATE ON perio_sites
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Endodontic records ──────────────────────────────────────────────────────
-- One row per tooth per treatment session. canals JSON holds per-canal
-- working length, file size, obturation status — variable arity per tooth.
CREATE TABLE IF NOT EXISTS endo_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth TEXT NOT NULL,
  treatment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  treated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  diagnosis TEXT,
  canals JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{ name, length_mm, file_size, obturation }]
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_endo_records_patient ON endo_records(patient_id, treatment_date DESC);
CREATE INDEX IF NOT EXISTS idx_endo_records_clinic ON endo_records(clinic_id);
CREATE TRIGGER trg_endo_records_updated BEFORE UPDATE ON endo_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Orthodontic episodes ────────────────────────────────────────────────────
-- A course of orthodontic treatment. Multiple visits hang off it.
CREATE TABLE IF NOT EXISTS ortho_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  appliance_type TEXT,                        -- 'brackets','aligners','retainer',…
  plan TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','retention','completed','discontinued')),
  photo_file_ids UUID[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ortho_episodes_patient ON ortho_episodes(patient_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_ortho_episodes_clinic ON ortho_episodes(clinic_id);
CREATE TRIGGER trg_ortho_episodes_updated BEFORE UPDATE ON ortho_episodes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Orthodontic visits ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ortho_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ortho_episode_id UUID NOT NULL REFERENCES ortho_episodes(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  changes TEXT,                               -- wire / bracket changes
  adjustments TEXT,
  photo_file_ids UUID[] NOT NULL DEFAULT '{}',
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ortho_visits_episode ON ortho_visits(ortho_episode_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_ortho_visits_clinic ON ortho_visits(clinic_id);
CREATE TRIGGER trg_ortho_visits_updated BEFORE UPDATE ON ortho_visits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Dental lab cases ────────────────────────────────────────────────────────
-- Track prosthetic work sent to an external lab (crowns, bridges, dentures,
-- veneers, retainers, …). Surfaces in the lab-case board widget.
CREATE TABLE IF NOT EXISTS dental_lab_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  lab_name TEXT NOT NULL,
  case_type TEXT NOT NULL
    CHECK (case_type IN ('crown','bridge','denture','veneer','implant_abutment','retainer','nightguard','other')),
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','in_progress','received','delivered','cancelled')),
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lab_cases_patient ON dental_lab_cases(patient_id, sent_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_cases_clinic_status ON dental_lab_cases(clinic_id, status);
CREATE TRIGGER trg_lab_cases_updated BEFORE UPDATE ON dental_lab_cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  scoped TEXT[] := ARRAY[
    'perio_charts','perio_sites','endo_records',
    'ortho_episodes','ortho_visits','dental_lab_cases'
  ];
BEGIN
  FOREACH t IN ARRAY scoped LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON %I', t, t);
    EXECUTE format($p$
      CREATE POLICY "%1$s_select" ON %1$I FOR SELECT
        USING (is_super_admin() OR clinic_id = current_clinic_id())
    $p$, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON %I', t, t);
    EXECUTE format($p$
      CREATE POLICY "%1$s_insert" ON %1$I FOR INSERT
        WITH CHECK (is_super_admin() OR clinic_id = current_clinic_id())
    $p$, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON %I', t, t);
    EXECUTE format($p$
      CREATE POLICY "%1$s_update" ON %1$I FOR UPDATE
        USING (is_super_admin() OR clinic_id = current_clinic_id())
        WITH CHECK (is_super_admin() OR clinic_id = current_clinic_id())
    $p$, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON %I', t, t);
    EXECUTE format($p$
      CREATE POLICY "%1$s_delete" ON %1$I FOR DELETE
        USING (is_super_admin() OR clinic_id = current_clinic_id())
    $p$, t);
  END LOOP;
END $$;
