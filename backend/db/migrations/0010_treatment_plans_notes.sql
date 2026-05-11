-- ============================================
-- 0010_treatment_plans_notes.sql
-- Adds free-form notes to treatment plans (clinical justification, comments
-- shown to the patient on the plan view, etc.). Existing rows get NULL.
-- ============================================

ALTER TABLE treatment_plans
  ADD COLUMN IF NOT EXISTS notes TEXT;
