import { supabase } from '../supabase';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type DocumentCategory =
  | 'radiology'
  | 'consent'
  | 'insurance'
  | 'certificate'
  | 'other';

export interface DocumentRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: DocumentCategory;
  uploaded_by: string | null;
  uploaded_at: string;
  archived_at: string | null;
}

/** Document row joined with a freshly signed URL. */
export interface DocumentWithUrl extends DocumentRow {
  signed_url: string | null;
}

export interface ListOptions {
  category?: DocumentCategory;
  /** Include archived rows. Defaults to false. */
  includeArchived?: boolean;
  /** Override the default 10-minute signed URL expiry. */
  signedUrlExpiresIn?: number;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const BUCKET = 'medical';
const DEFAULT_EXPIRES_IN = 600; // 10 minutes

// -----------------------------------------------------------------------------
// Internals
// -----------------------------------------------------------------------------

const getCurrentClinicId = async (): Promise<string> => {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const userId = userData.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('id', userId)
    .single();

  if (profErr) throw profErr;
  if (!profile?.clinic_id) throw new Error('User is not assigned to a clinic');
  return profile.clinic_id as string;
};

const getCurrentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

const extOf = (file: File): string => {
  const dot = file.name.lastIndexOf('.');
  if (dot < 0 || dot === file.name.length - 1) return 'bin';
  return file.name.slice(dot + 1).toLowerCase();
};

const signUrl = async (
  path: string,
  expiresIn: number = DEFAULT_EXPIRES_IN,
): Promise<string | null> => {
  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) {
    // Don't throw on URL-signing failures during list — surface as null and
    // let the caller decide how to render (e.g. a placeholder).
    console.error('Failed to sign URL for', path, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
};

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Uploads `file` to the `medical` bucket at
 * `${clinicId}/${patientId}/${docId}.${ext}`, then inserts the matching
 * `documents` row. Returns the inserted row joined with a fresh signed URL.
 */
export const upload = async (
  file: File,
  patientId: string,
  category: DocumentCategory,
): Promise<DocumentWithUrl> => {
  const clinicId = await getCurrentClinicId();
  const userId = await getCurrentUserId();

  // Generate a UUID-ish doc id on the client. crypto.randomUUID is supported
  // by every browser DentFlow targets.
  const docId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const ext = extOf(file);
  const storagePath = `${clinicId}/${patientId}/${docId}.${ext}`;

  const { error: uploadErr } = await supabase
    .storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadErr) throw uploadErr;

  const insertPayload = {
    id: docId,
    clinic_id: clinicId,
    patient_id: patientId,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    category,
    uploaded_by: userId,
  };

  const { data: row, error: insertErr } = await supabase
    .from('documents')
    .insert(insertPayload)
    .select()
    .single();

  if (insertErr) {
    // Best-effort cleanup: remove the orphaned storage object.
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
    throw insertErr;
  }

  const signed_url = await signUrl(storagePath);
  return { ...(row as DocumentRow), signed_url };
};

/**
 * Lists active documents for `patientId`, joined with a freshly created
 * signed URL (default 10-minute lifetime). Filter by `category` via opts.
 */
export const list = async (
  patientId: string,
  opts: ListOptions = {},
): Promise<DocumentWithUrl[]> => {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('patient_id', patientId)
    .order('uploaded_at', { ascending: false });

  if (opts.category) query = query.eq('category', opts.category);
  if (!opts.includeArchived) query = query.is('archived_at', null);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as DocumentRow[];
  const expiresIn = opts.signedUrlExpiresIn ?? DEFAULT_EXPIRES_IN;

  // Sign in parallel.
  const signed = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      signed_url: await signUrl(r.storage_path, expiresIn),
    })),
  );

  return signed;
};

/**
 * Returns a fresh signed URL for an existing document.
 */
export const signedUrl = async (
  documentId: string,
  expiresIn: number = DEFAULT_EXPIRES_IN,
): Promise<string> => {
  const { data, error } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .single();
  if (error) throw error;
  if (!data?.storage_path) throw new Error('Document has no storage path');

  const url = await signUrl(data.storage_path as string, expiresIn);
  if (!url) throw new Error('Failed to create signed URL');
  return url;
};

/**
 * Soft-deletes a document by stamping `archived_at`. The underlying
 * storage object is left in place so we can restore later if needed.
 */
export const archive = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const documentsService = { upload, list, signedUrl, archive };
