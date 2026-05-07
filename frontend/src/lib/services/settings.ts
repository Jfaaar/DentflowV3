// Clinic Settings service — thin fetch shim over /api/v1/settings.
import { http } from '../http';

export type SpecialtyCode =
  | 'general_practice'
  | 'dental'
  | 'pediatrics'
  | 'gynecology'
  | 'cardiology'
  | 'dermatology'
  | 'ent'
  | 'ophthalmology'
  | 'orthopedics'
  | 'psychiatry'
  | 'other';

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
  primarySpecialty: SpecialtyCode;
  enabledSpecialties: SpecialtyCode[];
  updatedAt: string;
}

export const settingsService = {
  async list() {
    const settings = await http<ClinicSettings | null>('GET', 'settings');
    if (!settings) return { data: [], total: 0 };
    return { data: [settings], total: 1 };
  },

  async get(): Promise<ClinicSettings | null> {
    return http<ClinicSettings | null>('GET', 'settings');
  },

  async create(input: Partial<ClinicSettings>): Promise<ClinicSettings> {
    return this.update(input);
  },

  async update(input: Partial<ClinicSettings>): Promise<ClinicSettings> {
    return http<ClinicSettings>('PUT', 'settings', { body: input });
  },

  async archive(): Promise<void> {
    throw new Error('clinic_settings cannot be archived directly');
  },
};
