/**
 * Insurance service: providers (incl. global presets), policies, and claims.
 */
import { supabase } from '../supabase';
import type {
  InsuranceProvider, InsurancePolicy, InsuranceClaim, InsuranceClaimStatus,
} from '../../types';

const PROV = 'insurance_providers';
const POL = 'insurance_policies';
const CLAIM = 'insurance_claims';

interface ProvRow {
  id: string;
  name: string;
  code?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  default_coverage_pct?: number | null;
  clinic_id?: string | null;
  created_at?: string | null;
}

interface PolRow {
  id: string;
  patient_id: string;
  provider_id: string;
  provider_name?: string | null;
  policy_number: string;
  group_number?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  coverage_pct?: number | null;
  notes?: string | null;
  clinic_id: string;
  created_at: string;
}

interface ClaimRow {
  id: string;
  policy_id: string;
  patient_id: string;
  invoice_id?: string | null;
  amount: number;
  reimbursed_amount?: number | null;
  status: InsuranceClaimStatus;
  submitted_at?: string | null;
  reimbursed_at?: string | null;
  notes?: string | null;
  clinic_id: string;
  created_at: string;
}

const fromProv = (r: ProvRow): InsuranceProvider => ({
  id: r.id,
  name: r.name,
  code: r.code ?? undefined,
  contactPhone: r.contact_phone ?? undefined,
  contactEmail: r.contact_email ?? undefined,
  defaultCoveragePct: r.default_coverage_pct ?? undefined,
  clinicId: r.clinic_id ?? null,
  createdAt: r.created_at ?? undefined,
});

const fromPol = (r: PolRow): InsurancePolicy => ({
  id: r.id,
  patientId: r.patient_id,
  providerId: r.provider_id,
  providerName: r.provider_name ?? undefined,
  policyNumber: r.policy_number,
  groupNumber: r.group_number ?? undefined,
  validFrom: r.valid_from ?? undefined,
  validTo: r.valid_to ?? undefined,
  coveragePct: r.coverage_pct ?? undefined,
  notes: r.notes ?? undefined,
  clinicId: r.clinic_id,
  createdAt: r.created_at,
});

const fromClaim = (r: ClaimRow): InsuranceClaim => ({
  id: r.id,
  policyId: r.policy_id,
  patientId: r.patient_id,
  invoiceId: r.invoice_id ?? undefined,
  amount: Number(r.amount) || 0,
  reimbursedAmount: r.reimbursed_amount ?? undefined,
  status: r.status,
  submittedAt: r.submitted_at ?? undefined,
  reimbursedAt: r.reimbursed_at ?? undefined,
  notes: r.notes ?? undefined,
  clinicId: r.clinic_id,
  createdAt: r.created_at,
});

export const insuranceService = {
  // ----- Providers --------------------------------------------------------
  /** Returns clinic-scoped providers + global presets (clinic_id IS NULL). */
  async listProviders(): Promise<InsuranceProvider[]> {
    const { data, error } = await supabase
      .from(PROV)
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as ProvRow[] | null)?.map(fromProv) ?? [];
  },

  // ----- Policies ---------------------------------------------------------
  async listPolicies(patientId: string): Promise<InsurancePolicy[]> {
    const { data, error } = await supabase
      .from(POL).select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data as PolRow[] | null)?.map(fromPol) ?? [];
  },

  async createPolicy(p: Omit<InsurancePolicy, 'id' | 'createdAt'>): Promise<InsurancePolicy> {
    const row = {
      patient_id: p.patientId,
      provider_id: p.providerId,
      provider_name: p.providerName ?? null,
      policy_number: p.policyNumber,
      group_number: p.groupNumber ?? null,
      valid_from: p.validFrom ?? null,
      valid_to: p.validTo ?? null,
      coverage_pct: p.coveragePct ?? null,
      notes: p.notes ?? null,
      clinic_id: p.clinicId,
    };
    const { data, error } = await supabase.from(POL).insert(row).select().single();
    if (error) throw error;
    return fromPol(data as PolRow);
  },

  async updatePolicy(id: string, patch: Partial<InsurancePolicy>): Promise<InsurancePolicy> {
    const row: Record<string, any> = {};
    if (patch.providerId !== undefined) row.provider_id = patch.providerId;
    if (patch.providerName !== undefined) row.provider_name = patch.providerName ?? null;
    if (patch.policyNumber !== undefined) row.policy_number = patch.policyNumber;
    if (patch.groupNumber !== undefined) row.group_number = patch.groupNumber ?? null;
    if (patch.validFrom !== undefined) row.valid_from = patch.validFrom ?? null;
    if (patch.validTo !== undefined) row.valid_to = patch.validTo ?? null;
    if (patch.coveragePct !== undefined) row.coverage_pct = patch.coveragePct ?? null;
    if (patch.notes !== undefined) row.notes = patch.notes ?? null;
    const { data, error } = await supabase.from(POL).update(row).eq('id', id).select().single();
    if (error) throw error;
    return fromPol(data as PolRow);
  },

  async removePolicy(id: string): Promise<void> {
    const { error } = await supabase.from(POL).delete().eq('id', id);
    if (error) throw error;
  },

  // ----- Claims -----------------------------------------------------------
  async listClaims(patientId: string): Promise<InsuranceClaim[]> {
    const { data, error } = await supabase
      .from(CLAIM).select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data as ClaimRow[] | null)?.map(fromClaim) ?? [];
  },

  async createClaim(c: Omit<InsuranceClaim, 'id' | 'createdAt'>): Promise<InsuranceClaim> {
    const row = {
      policy_id: c.policyId,
      patient_id: c.patientId,
      invoice_id: c.invoiceId ?? null,
      amount: c.amount,
      reimbursed_amount: c.reimbursedAmount ?? null,
      status: c.status || 'draft',
      submitted_at: c.submittedAt ?? null,
      reimbursed_at: c.reimbursedAt ?? null,
      notes: c.notes ?? null,
      clinic_id: c.clinicId,
    };
    const { data, error } = await supabase.from(CLAIM).insert(row).select().single();
    if (error) throw error;
    return fromClaim(data as ClaimRow);
  },

  async updateClaim(id: string, patch: Partial<InsuranceClaim>): Promise<InsuranceClaim> {
    const row: Record<string, any> = {};
    if (patch.amount !== undefined) row.amount = patch.amount;
    if (patch.reimbursedAmount !== undefined) row.reimbursed_amount = patch.reimbursedAmount ?? null;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.notes !== undefined) row.notes = patch.notes ?? null;
    if (patch.invoiceId !== undefined) row.invoice_id = patch.invoiceId ?? null;
    const { data, error } = await supabase.from(CLAIM).update(row).eq('id', id).select().single();
    if (error) throw error;
    return fromClaim(data as ClaimRow);
  },

  async submitClaim(id: string): Promise<InsuranceClaim> {
    const { data, error } = await supabase
      .from(CLAIM)
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return fromClaim(data as ClaimRow);
  },

  async reimburseClaim(id: string, amount: number): Promise<InsuranceClaim> {
    const { data, error } = await supabase
      .from(CLAIM)
      .update({
        status: 'reimbursed',
        reimbursed_amount: amount,
        reimbursed_at: new Date().toISOString(),
      })
      .eq('id', id).select().single();
    if (error) throw error;
    return fromClaim(data as ClaimRow);
  },

  async removeClaim(id: string): Promise<void> {
    const { error } = await supabase.from(CLAIM).delete().eq('id', id);
    if (error) throw error;
  },
};
