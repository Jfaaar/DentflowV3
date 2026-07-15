import { baseApi } from '@/services/api/baseApi';

export interface InsuranceProvider {
  id: string;
  name: string;
  default_coverage_pct?: number | string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
}

export interface InsurancePolicy {
  id: string;
  clinicId: string;
  patientId: string;
  providerId?: string;
  policyNumber?: string;
  coveragePct?: number;
  validUntil?: string;
}

export type InsuranceClaimStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'partial'
  | 'rejected'
  | 'paid';

export interface InsuranceClaim {
  id: string;
  clinicId: string;
  patientId: string;
  invoiceId?: string;
  policyId?: string;
  status: InsuranceClaimStatus;
  submittedAt?: string;
  amountClaimed?: number;
  amountReimbursed?: number;
  notes?: string;
}

export const insuranceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listInsuranceProviders: build.query<InsuranceProvider[], void>({
      query: () => ({ url: 'insurance/providers' }),
      transformResponse: (r: { data: InsuranceProvider[] }) => r.data,
    }),

    listInsurancePolicies: build.query<
      { data: InsurancePolicy[]; page: number; pageSize: number; total: number },
      { page?: number; pageSize?: number; patientId?: string } | void
    >({
      query: (params) => ({
        url: 'insurance/policies',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: {
        data: { data: InsurancePolicy[]; page: number; pageSize: number; total: number };
      }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((p) => ({ type: 'InsurancePolicy' as const, id: p.id })),
              { type: 'InsurancePolicy' as const, id: 'LIST' },
            ]
          : [{ type: 'InsurancePolicy' as const, id: 'LIST' }],
    }),
    getInsurancePolicy: build.query<InsurancePolicy, string>({
      query: (id) => ({ url: `insurance/policies/${id}` }),
      transformResponse: (r: { data: InsurancePolicy }) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'InsurancePolicy', id }],
    }),
    createInsurancePolicy: build.mutation<InsurancePolicy, Partial<InsurancePolicy>>({
      query: (body) => ({ url: 'insurance/policies', method: 'POST', body }),
      transformResponse: (r: { data: InsurancePolicy }) => r.data,
      invalidatesTags: [{ type: 'InsurancePolicy', id: 'LIST' }],
    }),
    updateInsurancePolicy: build.mutation<
      InsurancePolicy,
      { id: string; patch: Partial<InsurancePolicy> }
    >({
      query: ({ id, patch }) => ({
        url: `insurance/policies/${id}`,
        method: 'PUT',
        body: patch,
      }),
      transformResponse: (r: { data: InsurancePolicy }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'InsurancePolicy', id },
        { type: 'InsurancePolicy', id: 'LIST' },
      ],
    }),
    deleteInsurancePolicy: build.mutation<void, string>({
      query: (id) => ({ url: `insurance/policies/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'InsurancePolicy', id },
        { type: 'InsurancePolicy', id: 'LIST' },
      ],
    }),

    listInsuranceClaims: build.query<
      { data: InsuranceClaim[]; page: number; pageSize: number; total: number },
      { page?: number; pageSize?: number; patientId?: string; status?: InsuranceClaimStatus } | void
    >({
      query: (params) => ({
        url: 'insurance/claims',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: {
        data: { data: InsuranceClaim[]; page: number; pageSize: number; total: number };
      }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((c) => ({ type: 'InsuranceClaim' as const, id: c.id })),
              { type: 'InsuranceClaim' as const, id: 'LIST' },
            ]
          : [{ type: 'InsuranceClaim' as const, id: 'LIST' }],
    }),
    createInsuranceClaim: build.mutation<InsuranceClaim, Partial<InsuranceClaim>>({
      query: (body) => ({ url: 'insurance/claims', method: 'POST', body }),
      transformResponse: (r: { data: InsuranceClaim }) => r.data,
      invalidatesTags: [{ type: 'InsuranceClaim', id: 'LIST' }],
    }),
    updateInsuranceClaim: build.mutation<
      InsuranceClaim,
      { id: string; patch: Partial<InsuranceClaim> }
    >({
      query: ({ id, patch }) => ({
        url: `insurance/claims/${id}`,
        method: 'PUT',
        body: patch,
      }),
      transformResponse: (r: { data: InsuranceClaim }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'InsuranceClaim', id },
        { type: 'InsuranceClaim', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListInsuranceProvidersQuery,
  useListInsurancePoliciesQuery,
  useGetInsurancePolicyQuery,
  useCreateInsurancePolicyMutation,
  useUpdateInsurancePolicyMutation,
  useDeleteInsurancePolicyMutation,
  useListInsuranceClaimsQuery,
  useCreateInsuranceClaimMutation,
  useUpdateInsuranceClaimMutation,
} = insuranceApi;
