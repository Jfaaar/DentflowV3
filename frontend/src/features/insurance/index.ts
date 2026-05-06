export {
  insuranceApi,
  useListInsuranceProvidersQuery,
  useListInsurancePoliciesQuery,
  useGetInsurancePolicyQuery,
  useCreateInsurancePolicyMutation,
  useUpdateInsurancePolicyMutation,
  useDeleteInsurancePolicyMutation,
  useListInsuranceClaimsQuery,
  useCreateInsuranceClaimMutation,
  useUpdateInsuranceClaimMutation,
} from './api/insuranceApi';
export type {
  InsuranceProvider,
  InsurancePolicy,
  InsuranceClaim,
  InsuranceClaimStatus,
} from './api/insuranceApi';
