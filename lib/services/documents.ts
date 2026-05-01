/**
 * Documents service — Supabase-backed.
 *
 * Files live in the private `medical` storage bucket under
 * `{clinic_id}/{patient_id}/{document_id}.{ext}`. The DB row in `documents`
 * is the authoritative metadata record.
 *
 * Legacy `Radio` shape is preserved by `radiosService` below for the existing
 * radiology gallery UI; it just constrains category to `'radiology'` and
 * resolves a fresh signed URL on read.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { ClinicDocument, Radio } from '../../types';

const TABLE = 'documents';
const CACHE_PREFIX = 'cache:documents:';
const BUCKET = 'medical';

interface DBDocument {
  id: string;
  clinic_id: string;
  patient_id: string | null;
  appointment_id: string | null;
  category: ClinicDocument['category'];
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | string | null;
  uploaded_by: string | null;
  created_at: string;
  archived_at: string | null;
}

const fromDb = (row: DBDocument): ClinicDocument => ({
  id: row.id,
  clinicId: row.clinic_id,
  patientId: row.patient_id ?? undefined,
  appointmentId: row.appointment_id ?? undefined,
  category: row.category,
  fileName: row.file_name,
  storagePath: row.storage_path,
  mimeType: row.mime_type ?? undefined,
  sizeBytes: row.size_bytes == null ? undefined : Number(row.size_bytes),
  uploadedBy: row.uploaded_by ?? undefined,
  createdAt: row.created_at,
});

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
  filters?: { category?: ClinicDocument['category'] };
}

interface ListResult {
  data: ClinicDocument[];
  total: number;
}

export const documentsService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 50;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (opts.patientId) q = q.eq('patient_id', opts.patientId);
    if (opts.filters?.category) q = q.eq('category', opts.filters.category);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => fromDb(r as DBDocument)),
      total: count ?? 0,
    };
  },

  async get(id: string): Promise<ClinicDocument | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBDocument) : null;
  },

  async create(
    input: Omit<ClinicDocument, 'id' | 'clinicId' | 'createdAt'>,
  ): Promise<ClinicDocument> {
    const { clinicId, userId } = await getServiceContext();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        clinic_id: clinicId,
        patient_id: input.patientId ?? null,
        appointment_id: input.appointmentId ?? null,
        category: input.category,
        file_name: input.fileName,
        storage_path: input.storagePath,
        mime_type: input.mimeType ?? null,
        size_bytes: input.sizeBytes ?? null,
        uploaded_by: input.uploadedBy ?? userId,
      })
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBDocument);
  },

  async upload(
    file: File,
    opts: {
      patientId?: string;
      appointmentId?: string;
      category: ClinicDocument['category'];
    },
  ): Promise<ClinicDocument> {
    const { clinicId } = await getServiceContext();
    const docId = crypto.randomUUID();
    const ext = file.name.includes('.')
      ? file.name.split('.').pop()!.toLowerCase()
      : 'bin';
    const path = `${clinicId}/${opts.patientId ?? 'misc'}/${docId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });
    if (uploadErr) throw uploadErr;

    return this.create({
      patientId: opts.patientId,
      appointmentId: opts.appointmentId,
      category: opts.category,
      fileName: file.name,
      storagePath: path,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  },

  async update(
    id: string,
    input: Partial<Pick<ClinicDocument, 'category' | 'fileName'>>,
  ): Promise<ClinicDocument> {
    const row: Record<string, unknown> = {};
    if (input.category !== undefined) row.category = input.category;
    if (input.fileName !== undefined) row.file_name = input.fileName;
    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBDocument);
  },

  async archive(id: string): Promise<void> {
    const doc = await this.get(id);
    const { error } = await supabase
      .from(TABLE)
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    if (doc?.storagePath) {
      // Best-effort: remove the underlying object too.
      await supabase.storage.from(BUCKET).remove([doc.storagePath]);
    }
    cache.invalidate(CACHE_PREFIX);
  },

  async signedUrl(storagePath: string, expiresInSec = 60 * 10): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, expiresInSec);
    if (error) throw error;
    return data.signedUrl;
  },
};

// ─── Legacy Radio adapter ─────────────────────────────────────────────────
// Some screens still consume the `Radio` type. We surface the radiology
// subset of `documents` through this service so existing components don't
// need to change.

export const radiosService = {
  async list(patientId: string): Promise<Radio[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('patient_id', patientId)
      .eq('category', 'radiology')
      .is('archived_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as DBDocument[];
    const withUrls = await Promise.all(
      rows.map(async (r) => {
        try {
          const url = await documentsService.signedUrl(r.storage_path);
          const radio: Radio = {
            id: r.id,
            patientId: r.patient_id ?? '',
            url,
            fileName: r.file_name,
            date: r.created_at,
          };
          return radio;
        } catch {
          return null;
        }
      }),
    );
    return withUrls.filter((r): r is Radio => r !== null);
  },

  async upload(patientId: string, file: File): Promise<Radio> {
    const doc = await documentsService.upload(file, {
      patientId,
      category: 'radiology',
    });
    const url = await documentsService.signedUrl(doc.storagePath);
    return {
      id: doc.id,
      patientId,
      url,
      fileName: doc.fileName,
      date: doc.createdAt,
    };
  },

  async delete(id: string): Promise<void> {
    return documentsService.archive(id);
  },
};

export type { ListOpts as DocumentsListOpts, ListResult as DocumentsListResult };
