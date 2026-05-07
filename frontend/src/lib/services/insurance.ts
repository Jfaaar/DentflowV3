// Insurance — thin fetch shim over /api/v1/insurance/{providers,policies,claims}.
import { http } from '../http';
import type { InsurancePolicy, InsuranceClaim } from '../../types';

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

interface BackendPaged<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export const insuranceService = {
  // Providers
  async listProviders() {
    return http<unknown[]>('GET', 'insurance/providers');
  },

  // Policies
  async listPolicies(opts: PolicyListOpts = {}) {
    const r = await http<BackendPaged<InsurancePolicy>>('GET', 'insurance/policies', { params: opts });
    return { data: r.data, total: r.total };
  },

  async getPolicy(id: string) {
    try {
      return await http<InsurancePolicy>('GET', `insurance/policies/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async createPolicy(input: Omit<InsurancePolicy, 'id' | 'clinicId'>) {
    return http<InsurancePolicy>('POST', 'insurance/policies', { body: input });
  },

  async updatePolicy(id: string, input: Partial<InsurancePolicy>) {
    return http<InsurancePolicy>('PUT', `insurance/policies/${id}`, { body: input });
  },

  async archivePolicy(id: string) {
    await http<void>('DELETE', `insurance/policies/${id}`);
  },

  // Claims
  async listClaims(opts: ClaimListOpts = {}) {
    const r = await http<BackendPaged<InsuranceClaim>>('GET', 'insurance/claims', {
      params: {
        page: opts.page,
        pageSize: opts.pageSize,
        patientId: opts.patientId,
        status: opts.filters?.status,
      },
    });
    return { data: r.data, total: r.total };
  },

  async getClaim(id: string) {
    try {
      return await http<InsuranceClaim>('GET', `insurance/claims/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async createClaim(input: Omit<InsuranceClaim, 'id' | 'clinicId'>) {
    return http<InsuranceClaim>('POST', 'insurance/claims', { body: input });
  },

  async updateClaim(id: string, input: Partial<InsuranceClaim>) {
    return http<InsuranceClaim>('PUT', `insurance/claims/${id}`, { body: input });
  },

  async archiveClaim(id: string) {
    return this.updateClaim(id, { status: 'rejected' }).then(() => undefined);
  },
};

export type { PolicyListOpts as InsurancePoliciesListOpts, ClaimListOpts as InsuranceClaimsListOpts };
