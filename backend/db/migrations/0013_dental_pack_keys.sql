-- ============================================
-- 0013_dental_pack_keys.sql
-- Phase 1 (Dental pack) — catalog rails.
--
-- Adds three feature keys with default_specialties = ['dental']:
--   perioChart    — periodontal chart (6-site per tooth)
--   endoChart     — endodontic record
--   orthoModule   — orthodontic episode/visit tracking
--
-- Each subsequent dental migration adds the tables these keys gate.
-- ============================================

INSERT INTO feature_definitions
  (feature_key, display_name, description, default_specialties, default_permission, category, sort_order)
VALUES
  ('perioChart',  'Perio chart',  'Periodontal chart: pocket depth, recession, BoP, mobility, furcation (6-site per tooth)',
     ARRAY['dental'],
     'dentalChart.view', 'clinical', 51),
  ('endoChart',   'Endodontic record', 'Per-tooth canal record: working length, file size, obturation',
     ARRAY['dental'],
     'clinical.view', 'clinical', 52),
  ('orthoModule', 'Orthodontic tracking', 'Orthodontic episodes: appliance, brackets, wire sequence, photo timeline',
     ARRAY['dental'],
     'clinical.view', 'clinical', 53)
ON CONFLICT (feature_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  default_specialties = EXCLUDED.default_specialties,
  default_permission = EXCLUDED.default_permission,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;
