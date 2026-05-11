-- ============================================
-- 0012_core_feature_keys.sql
-- Phase 0 of the specialty-pack rollout. Two changes to feature_definitions:
--
-- 1. Promote vitals + problemList to every specialty (was 'all non-dental').
--    Reasoning: every clinic, dental included, records BP / problems before
--    anaesthesia. Specialty packs *add* clinical surfaces; they should not
--    be the only source of universal core ones. Dental clinics that don't
--    want these visible can still pin them off via clinic_feature_overrides
--    or collapse them in the dental layout profile.
--
-- 2. Seed six new "core" feature keys, each default_specialties = all 11:
--      clinicalNotes   — generic SOAP / encounter note (route /clinical/notes
--                        exists today but wasn't a gated feature key)
--      allergies       — patient_medical_history.allergies surface
--      medicationList  — patient_medical_history.medications surface
--      quotes          — surfaces the existing quotes permission set
--      referrals       — gate for the Phase-6 referral-letters UI
--      certificates    — gate for the Phase-6 certificates UI
--
-- All of these are idempotent (ON CONFLICT DO UPDATE) so the file can be
-- re-applied without harm as the catalog evolves.
-- ============================================

UPDATE feature_definitions
   SET default_specialties = ARRAY[
         'general_practice','dental','pediatrics','gynecology','cardiology',
         'dermatology','ent','ophthalmology','orthopedics','psychiatry','other'
       ]
 WHERE feature_key IN ('vitals','problemList');

INSERT INTO feature_definitions
  (feature_key, display_name, description, default_specialties, default_permission, category, sort_order)
VALUES
  ('clinicalNotes',  'Clinical notes',  'SOAP / encounter notes',
     ARRAY['general_practice','dental','pediatrics','gynecology','cardiology','dermatology','ent','ophthalmology','orthopedics','psychiatry','other'],
     'clinical.view', 'clinical', 41),
  ('allergies',      'Allergies',       'Patient allergy list',
     ARRAY['general_practice','dental','pediatrics','gynecology','cardiology','dermatology','ent','ophthalmology','orthopedics','psychiatry','other'],
     'clinical.view', 'clinical', 42),
  ('medicationList', 'Medication list', 'Current medications (interaction-aware)',
     ARRAY['general_practice','dental','pediatrics','gynecology','cardiology','dermatology','ent','ophthalmology','orthopedics','psychiatry','other'],
     'clinical.view', 'clinical', 43),
  ('quotes',         'Quotes / estimates', 'Estimate generation and quote workflow',
     ARRAY['general_practice','dental','pediatrics','gynecology','cardiology','dermatology','ent','ophthalmology','orthopedics','psychiatry','other'],
     'quotes.view', 'operations', 115),
  ('certificates',   'Certificates',    'Sick notes, fitness, school/work, travel',
     ARRAY['general_practice','dental','pediatrics','gynecology','cardiology','dermatology','ent','ophthalmology','orthopedics','psychiatry','other'],
     'documents.view', 'operations', 175),
  ('referrals',      'Referrals',       'Referral and counter-referral letters',
     ARRAY['general_practice','dental','pediatrics','gynecology','cardiology','dermatology','ent','ophthalmology','orthopedics','psychiatry','other'],
     'documents.view', 'operations', 180)
ON CONFLICT (feature_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  default_specialties = EXCLUDED.default_specialties,
  default_permission = EXCLUDED.default_permission,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;
