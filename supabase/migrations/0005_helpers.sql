-- =============================================================
-- 0005_helpers.sql — Convenience functions and triggers used by
-- multiple Phase 3 services.
-- =============================================================

-- Auto-update updated_at on patients
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_patients_touch ON patients;
CREATE TRIGGER trg_patients_touch
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_clinics_touch ON clinics;
CREATE TRIGGER trg_clinics_touch
  BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_touch ON profiles;
CREATE TRIGGER trg_profiles_touch
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
