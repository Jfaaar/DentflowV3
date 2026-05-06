/**
 * Insurance service — Supabase-backed.
 *
 * Combines policies and claims into one module since they share the
 * insurance domain. Policies are tenant-scoped; providers (CNSS / CNOPS)
 * are seeded as global presets and read-only for non-super-admins.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { InsurancePolicy, InsuranceClaim } from '../../types';

const POLICIES_TABLE = 'insurance_policies';
const CLAIMS_TABLE = 'insurance_claims';
const PROVIDERS_TABLE = 'insurance_providers';
const POLICIES_PREFIX = 'cache:insurance_policies:';
const CLAIMS_PREFIX = 'cache:insurance_claims:';

interface DBPolicy {
  id: string;
  clinic_id: string;
  patient_id: string;
  provider_id: string | null;
  policy_number: string | null;
  coverage_pct: string | number | null;
  valid_until: string | null;
}

interface DBClaim {
  id: string;
  clinic_id: string;
  patient_id: string;
  invoice_id: string | null;
  policy_id: string | null;
  status: InsuranceClaim['status'];
  submitted_at: string | null;
  amount_claimed: string | number | null;
  amount_reimbursed: string | number | null;
  notes: string | null;
}

interface DBProvider {
  id: string;
  clinic_id: string | null;
  name: string;
  default_coverage_pct: string | number | null;
  contact_phone: string | null;
  contact_email: string | null;
}

const numOrUndef = (v: string | number | null | undefined): number | undefined =>
  v == null ? undefined : typeof v === 'number' ? v : Number(v);

const policyFromDb = (row: DBPolicy): InsurancePolicy => ({
  id: row.id,
  clinicId: row.clinic_id,
  patientId: row.patient_id,
  providerId: row.provider_id ?? undefined,
  policyNumber: row.policy_number ?? undefined,
  coveragePct: numOrUndef(row.coverage_pct),
  validUntil: row.valid_until ?? undefined,
});

const claimFromDb = (row: DBClaim): InsuranceClaim => ({
  id: row.id,
  clinicId: row.clinic_id,
  patientId: row.patient_id,
  invoiceId: row.invoice_id ?? undefined,
  policyId: row.policy_id ?? undefined,
  status: row.status,
  submittedAt: row.submitted_at ?? undefined,
  amountClaimed: numOrUndef(row.amount_claimed),
  amountReimbursed: numOrUndef(row.amount_reimbursed),
  notes: row.notes ?? undefined,
});

interface PolicyListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface ClaimListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
  filters?: { status?: InsuranceClaim['status'] };
}

interface ListResult<T> {
  data: T[];
  total: number;
}

export const insuranceService = {
  // ── Providers (read-only listing of global + clinic presets) ──
  async listProviders() {
    const { data, error } = await supabase
      .from(PROVIDERS_TABLE)
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as DBProvider[];
  },

  // ── Policies ──
  async listPolicies(opts: PolicyListOpts = {}): Promise<ListResult<InsurancePolicy>> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 50;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(POLICIES_TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (opts.patientId) q = q.eq('patient_id', opts.patientId);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => policyFromDb(r as DBPolicy)),
      total: count ?? 0,
    };
  },

  async getPolicy(id: string): Promise<InsurancePolicy | null> {
    const { data, error } = await supabase
      .from(POLICIES_TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? policyFromDb(data as DBPolicy) : null;
  },

  async createPolicy(
    input: Omit<InsurancePolicy, 'id' | 'clinicId'>,
  ): Promise<InsurancePolicy> {
    const { clinicId } = await getServiceContext();
    const row = {
      clinic_id: clinicId,
      patient_id: input.patientId,
      provider_id: input.providerId ?? null,
      policy_number: input.policyNumber ?? null,
      coverage_pct: input.coveragePct ?? null,
      valid_until: input.validUntil ?? null,
    };
    const { data, error } = await supabase
      .from(POLICIES_TABLE)
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(POLICIES_PREFIX);
    return policyFromDb(data as DBPolicy);
  },

  async updatePolicy(
    id: string,
    input: Partial<InsurancePolicy>,
  ): Promise<InsurancePolicy> {
    const row: Record<string, unknown> = {};
    if (input.providerId !== undefined) row.provider_id = input.providerId ?? null;
    if (input.policyNumber !== undefined) row.policy_number = input.policyNumber ?? null;
    if (input.coveragePct !== undefined) row.coverage_pct = input.coveragePct ?? null;
    if (input.validUntil !== undefined) row.valid_until = input.validUntil ?? null;
    const { data, error } = await supabase
      .from(POLICIES_TABLE)
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(POLICIES_PREFIX);
    return policyFromDb(data as DBPolicy);
  },

  async archivePolicy(id: string): Promise<void> {
    const { error } = await supabase.from(POLICIES_TABLE).delete().eq('id', id);
    if (error) throw error;
    cache.invalidate(POLICIES_PREFIX);
  },

  // ── Claims ──
  async listClaims(opts: ClaimListOpts = {}): Promise<ListResult<InsuranceClaim>> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 50;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(CLAIMS_TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (opts.patientId) q = q.eq('patient_id', opts.patientId);
    if (opts.filters?.status) q = q.eq('status', opts.filters.status);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => claimFromDb(r as DBClaim)),
      total: count ?? 0,
    };
  },

  async getClaim(id: string): Promise<InsuranceClaim | null> {
    const { data, error } = await supabase
      .from(CLAIMS_TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? claimFromDb(data as DBClaim) : null;
  },

  async createClaim(
    input: Omit<InsuranceClaim, 'id' | 'clinicId'>,
  ): Promise<InsuranceClaim> {
    const { clinicId } = await getServiceContext();
    const row = {
      clinic_id: clinicId,
      patient_id: input.patientId,
      invoice_id: input.invoiceId ?? null,
      policy_id: input.policyId ?? null,
      status: input.status,
      submitted_at: input.submittedAt ?? null,
      amount_claimed: input.amountClaimed ?? null,
      amount_reimbursed: input.amountReimbursed ?? null,
      notes: input.notes ?? null,
    };
    const { data, error } = await supabase
      .from(CLAIMS_TABLE)
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CLAIMS_PREFIX);
    return claimFromDb(data as DBClaim);
  },

  async updateClaim(
    id: string,
    input: Partial<InsuranceClaim>,
  ): Promise<InsuranceClaim> {
    const row: Record<string, unknown> = {};
    if (input.status !== undefined) row.status = input.status;
    if (input.submittedAt !== undefined) row.submitted_at = input.submittedAt ?? null;
    if (input.amountClaimed !== undefined) row.amount_claimed = input.amountClaimed ?? null;
    if (input.amountReimbursed !== undefined) row.amount_reimbursed = input.amountReimbursed ?? null;
    if (input.notes !== undefined) row.notes = input.notes ?? null;
    if (input.invoiceId !== undefined) row.invoice_id = input.invoiceId ?? null;
    if (input.policyId !== undefined) row.policy_id = input.policyId ?? null;
    const { data, error } = await supabase
      .from(CLAIMS_TABLE)
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CLAIMS_PREFIX);
    return claimFromDb(data as DBClaim);
  },

  async archiveClaim(id: string): Promise<void> {
    return this.updateClaim(id, { status: 'rejected' }).then(() => undefined);
  },
};

export type {
  PolicyListOpts as InsurancePoliciesListOpts,
  ClaimListOpts as InsuranceClaimsListOpts,
};
