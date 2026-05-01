-- ============================================
-- 0004_storage_buckets.sql
-- Supabase Storage buckets for medical files (radiology, consents, etc).
-- Files are private; the app must request short-lived signed URLs.
-- The path convention is: {clinic_id}/{patient_id}/{document_id}.{ext}
-- so RLS can scope access by parsing the first path segment.
-- ============================================

INSERT INTO storage.buckets (id, name, public)
  VALUES ('medical', 'medical', false)
  ON CONFLICT (id) DO NOTHING;

-- Helper: extract clinic_id from object path
CREATE OR REPLACE FUNCTION storage_path_clinic_id(path TEXT) RETURNS UUID
LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(split_part(path, '/', 1), '')::uuid
$$;

-- SELECT: super_admin or matching clinic
DROP POLICY IF EXISTS "medical_read" ON storage.objects;
CREATE POLICY "medical_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical' AND (
      is_super_admin()
      OR storage_path_clinic_id(name) = current_clinic_id()
    )
  );

DROP POLICY IF EXISTS "medical_write" ON storage.objects;
CREATE POLICY "medical_write" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical' AND (
      is_super_admin()
      OR storage_path_clinic_id(name) = current_clinic_id()
    )
  );

DROP POLICY IF EXISTS "medical_update" ON storage.objects;
CREATE POLICY "medical_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'medical' AND (
      is_super_admin() OR storage_path_clinic_id(name) = current_clinic_id()
    )
  );

DROP POLICY IF EXISTS "medical_delete" ON storage.objects;
CREATE POLICY "medical_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical' AND (
      is_super_admin() OR storage_path_clinic_id(name) = current_clinic_id()
    )
  );
