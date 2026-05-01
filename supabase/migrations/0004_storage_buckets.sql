-- =============================================================
-- 0004_storage_buckets.sql — Private buckets + RLS for file
-- objects. Documents live under the 'medical' bucket at
-- ${clinicId}/${patientId}/${docId}.${ext}.
-- =============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('medical', 'medical', false)
ON CONFLICT (id) DO NOTHING;

-- Path layout: <clinic_id>/<patient_id>/<doc_id>.<ext>
-- name = the storage path, split by '/'.
-- (storage.foldername returns an array of path parts.)

DROP POLICY IF EXISTS medical_read   ON storage.objects;
CREATE POLICY medical_read ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'medical'
    AND (storage.foldername(name))[1] = (
      SELECT clinic_id::text FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS medical_insert ON storage.objects;
CREATE POLICY medical_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'medical'
    AND (storage.foldername(name))[1] = (
      SELECT clinic_id::text FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS medical_update ON storage.objects;
CREATE POLICY medical_update ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'medical'
    AND (storage.foldername(name))[1] = (
      SELECT clinic_id::text FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS medical_delete ON storage.objects;
CREATE POLICY medical_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'medical'
    AND (storage.foldername(name))[1] = (
      SELECT clinic_id::text FROM profiles WHERE id = auth.uid()
    )
  );
