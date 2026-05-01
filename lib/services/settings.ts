/**
 * Clinic Settings service — Supabase-backed.
 *
 * `clinic_settings` is keyed on `clinic_id` (single row per clinic). The
 * service exposes get/update; "create" upserts so callers don't need to
 * special-case the first save.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';

export interface ClinicSettings {
  clinicId: string;
  logoUrl?: string;
  taxId?: string;
  currency: string;
  timezone: string;
  defaultLanguage: string;
  workingHours?: Record<string, Array<{ start: string; end: string }>>;
  defaultAppointmentMinutes: number;
  invoiceNumberFormat: string;
  invoiceSeq: number;
  prescriptionTemplate?: string;
  quoteTemplate?: string;
  updatedAt: string;
}

interface DBClinicSettings {
  clinic_id: string;
  logo_url: string | null;
  tax_id: string | null;
  currency: string | null;
  timezone: string | null;
  default_language: string | null;
  working_hours: Record<string, Array<{ start: string; end: string }>> | null;
  default_appointment_minutes: number | null;
  invoice_number_format: string | null;
  invoice_seq: number | null;
  prescription_template: string | null;
  quote_template: string | null;
  updated_at: string;
}

const TABLE = 'clinic_settings';
const CACHE_PREFIX = 'cache:clinic_settings:';

const fromDb = (row: DBClinicSettings): ClinicSettings => ({
  clinicId: row.clinic_id,
  logoUrl: row.logo_url ?? undefined,
  taxId: row.tax_id ?? undefined,
  currency: row.currency ?? 'MAD',
  timezone: row.timezone ?? 'Africa/Casablanca',
  defaultLanguage: row.default_language ?? 'fr',
  workingHours: row.working_hours ?? undefined,
  defaultAppointmentMinutes: row.default_appointment_minutes ?? 30,
  invoiceNumberFormat: row.invoice_number_format ?? 'INV-{YYYY}-{SEQ}',
  invoiceSeq: row.invoice_seq ?? 0,
  prescriptionTemplate: row.prescription_template ?? undefined,
  quoteTemplate: row.quote_template ?? undefined,
  updatedAt: row.updated_at,
});

const toDb = (s: Partial<ClinicSettings>) => {
  const row: Record<string, unknown> = {};
  if (s.logoUrl !== undefined) row.logo_url = s.logoUrl ?? null;
  if (s.taxId !== undefined) row.tax_id = s.taxId ?? null;
  if (s.currency !== undefined) row.currency = s.currency;
  if (s.timezone !== undefined) row.timezone = s.timezone;
  if (s.defaultLanguage !== undefined) row.default_language = s.defaultLanguage;
  if (s.workingHours !== undefined) row.working_hours = s.workingHours ?? null;
  if (s.defaultAppointmentMinutes !== undefined)
    row.default_appointment_minutes = s.defaultAppointmentMinutes;
  if (s.invoiceNumberFormat !== undefined)
    row.invoice_number_format = s.invoiceNumberFormat;
  if (s.invoiceSeq !== undefined) row.invoice_seq = s.invoiceSeq;
  if (s.prescriptionTemplate !== undefined)
    row.prescription_template = s.prescriptionTemplate ?? null;
  if (s.quoteTemplate !== undefined) row.quote_template = s.quoteTemplate ?? null;
  return row;
};

export const settingsService = {
  async list() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*');
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => fromDb(r as DBClinicSettings)),
      total: (data ?? []).length,
    };
  },

  async get(clinicId?: string): Promise<ClinicSettings | null> {
    let resolved = clinicId;
    if (!resolved) resolved = (await getServiceContext()).clinicId;

    const cacheKey = `${CACHE_PREFIX}${resolved}`;
    const cached = cache.read<ClinicSettings>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('clinic_id', resolved)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const settings = fromDb(data as DBClinicSettings);
    cache.write(cacheKey, settings);
    return settings;
  },

  async create(input: Partial<ClinicSettings>): Promise<ClinicSettings> {
    return this.update(input);
  },

  async update(input: Partial<ClinicSettings>): Promise<ClinicSettings> {
    const { clinicId } = await getServiceContext();
    const { data, error } = await supabase
      .from(TABLE)
      .upsert({ clinic_id: clinicId, ...toDb(input) }, { onConflict: 'clinic_id' })
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBClinicSettings);
  },

  async archive(): Promise<void> {
    // Clinic settings cannot be deleted independently; archiving the parent
    // clinic cascades. Provided for API symmetry only.
    throw new Error('clinic_settings cannot be archived directly');
  },
};
