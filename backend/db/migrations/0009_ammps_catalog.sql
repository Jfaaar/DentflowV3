-- ============================================
-- 0009_ammps_catalog.sql
-- AMMPS (Moroccan Ministry of Health) medicine catalog sync.
--
-- Adds:
--   medicaments_catalog       global drug reference (no clinic_id)
--   medicament_history        append-only diff log per catalog row
--   medicament_sync_logs      one row per sync run (totals, status)
--   medicaments_staging       raw scraped rows per run (audit/replay)
--   inventory_items.medicament_catalog_id  optional link from clinic stock
--
-- All four new tables are global reference / audit data with no
-- clinic_id, so RLS is set to SELECT-for-authenticated and writes are
-- backend-only (the sync job runs with the service-role pool).
-- ============================================

-- ─── Enums ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE medicament_sync_status AS ENUM ('running','success','partial','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE medicament_change_type AS ENUM ('created','price_change','status_change','field_change');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Sync logs ──────────────────────────────────────────────────────────────
-- Note: declared before staging/history because they reference its id.
CREATE TABLE IF NOT EXISTS medicament_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  status          medicament_sync_status NOT NULL DEFAULT 'running',
  total_fetched   INT NOT NULL DEFAULT 0,
  total_created   INT NOT NULL DEFAULT 0,
  total_updated   INT NOT NULL DEFAULT 0,
  total_unchanged INT NOT NULL DEFAULT 0,
  total_failed    INT NOT NULL DEFAULT 0,
  error_message   TEXT,
  triggered_by    TEXT NOT NULL,            -- 'cron' | 'manual:<userId>' | 'manual:cli'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_med_sync_started ON medicament_sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_med_sync_running ON medicament_sync_logs(status)
  WHERE status = 'running';

-- ─── Catalog ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicaments_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialite               TEXT NOT NULL,
  dosage                   TEXT,
  forme                    TEXT,
  presentation             TEXT,
  pp_gn                    TEXT,            -- princeps / generique flag
  substance_active         TEXT,
  classe_therapeutique     TEXT,
  laboratoire              TEXT,            -- a.k.a. EPI
  statut_amm               TEXT,
  statut_commercialisation TEXT,
  ppv                      NUMERIC(12,2),
  ph                       NUMERIC(12,2),
  pfht                     NUMERIC(12,2),
  tva                      NUMERIC(5,2),
  source_url               TEXT NOT NULL,
  source_hash              TEXT NOT NULL UNIQUE,
  last_synced_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_med_cat_specialite ON medicaments_catalog(specialite);
CREATE INDEX IF NOT EXISTS idx_med_cat_substance ON medicaments_catalog(substance_active);
CREATE INDEX IF NOT EXISTS idx_med_cat_laboratoire ON medicaments_catalog(laboratoire);
CREATE INDEX IF NOT EXISTS idx_med_cat_specialite_trgm
  ON medicaments_catalog USING gin (specialite gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_med_cat_substance_trgm
  ON medicaments_catalog USING gin (substance_active gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_med_cat_updated ON medicaments_catalog;
CREATE TRIGGER trg_med_cat_updated BEFORE UPDATE ON medicaments_catalog
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── History (append-only) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicament_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicament_catalog_id UUID NOT NULL REFERENCES medicaments_catalog(id) ON DELETE CASCADE,
  sync_run_id           UUID REFERENCES medicament_sync_logs(id) ON DELETE SET NULL,
  change_type           medicament_change_type NOT NULL,
  field_name            TEXT,
  old_value             JSONB,
  new_value             JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_med_hist_cat ON medicament_history(medicament_catalog_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_med_hist_run ON medicament_history(sync_run_id);

-- ─── Staging (raw scraped rows per run) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicaments_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID NOT NULL REFERENCES medicament_sync_logs(id) ON DELETE CASCADE,
  raw         JSONB NOT NULL,
  source_hash TEXT,
  normalized  JSONB,
  parse_error TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_med_staging_run ON medicaments_staging(sync_run_id);
CREATE INDEX IF NOT EXISTS idx_med_staging_errors ON medicaments_staging(sync_run_id)
  WHERE parse_error IS NOT NULL;

-- ─── inventory_items link to catalog ────────────────────────────────────────
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS medicament_catalog_id UUID
    REFERENCES medicaments_catalog(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_med_catalog
  ON inventory_items(medicament_catalog_id)
  WHERE medicament_catalog_id IS NOT NULL;

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Catalog/history/sync_logs are global reference data: any authenticated user
-- can read; writes are performed by the sync job which connects with the
-- service role and bypasses RLS. No INSERT/UPDATE/DELETE policies are
-- declared — RLS denies by default for non-superuser roles.
DO $$
DECLARE
  t TEXT;
  globals TEXT[] := ARRAY[
    'medicaments_catalog','medicament_history',
    'medicament_sync_logs','medicaments_staging'
  ];
BEGIN
  FOREACH t IN ARRAY globals LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON %I', t, t);
    EXECUTE format($p$
      CREATE POLICY "%1$s_select" ON %1$I FOR SELECT
        USING (auth.uid() IS NOT NULL OR is_super_admin())
    $p$, t);
  END LOOP;
END $$;
