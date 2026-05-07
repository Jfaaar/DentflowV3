// Documents service — stubbed. Supabase Storage was removed alongside
// supabase-js; a local-storage replacement (S3, GCS, or backend
// /api/v1/uploads) needs to be wired in before patient document upload
// works again.
//
// The exported shape is preserved so consumers compile, but every method
// rejects at call time with a clear marker.

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

export interface DocumentWithUrl extends DocumentRow {
  signed_url: string | null;
}

export interface ListOptions {
  category?: DocumentCategory;
  includeArchived?: boolean;
  signedUrlExpiresIn?: number;
}

const NOT_IMPLEMENTED = (op: string) =>
  Promise.reject(
    new Error(
      `Document storage is not configured (operation: ${op}). Wire a backend uploads endpoint or an object-storage client.`,
    ),
  );

export const upload = (
  _file: File,
  _patientId: string,
  _category: DocumentCategory,
): Promise<DocumentWithUrl> => NOT_IMPLEMENTED('upload');

export const list = (_patientId: string, _opts: ListOptions = {}): Promise<DocumentWithUrl[]> =>
  NOT_IMPLEMENTED('list');

export const signedUrl = (_documentId: string, _expiresIn?: number): Promise<string> =>
  NOT_IMPLEMENTED('signedUrl');

export const archive = (_id: string): Promise<void> => NOT_IMPLEMENTED('archive');

export const documentsService = { upload, list, signedUrl, archive };
