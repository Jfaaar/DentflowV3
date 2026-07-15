// RTK Query endpoints for feature access + per-clinic role permission overrides.
// Backend: backend/routes/features.js (mounted at /api/v1/features).
import { baseApi } from '@/services/api/baseApi';
import type { FeatureKey, FeatureState } from '@/lib/features';
import type { Permission } from '@/lib/permissions';

export type OverridableRole = 'clinic_admin' | 'doctor' | 'assistant';

export interface RolePermissionMatrix {
  role: OverridableRole;
  defaults: Permission[];
  overrides: Partial<Record<Permission, boolean>>;
  effective: Permission[];
}

export const featuresApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Features ────────────────────────────────────────────────────────────
    getFeatures: build.query<FeatureState[], void>({
      query: () => ({ url: 'features' }),
      transformResponse: (r: { data: FeatureState[] }) => r.data,
      providesTags: (result) =>
        result
          ? [
              { type: 'Feature', id: 'LIST' },
              ...result.map((f) => ({ type: 'Feature' as const, id: f.featureKey })),
            ]
          : [{ type: 'Feature', id: 'LIST' }],
    }),
    setFeatureOverride: build.mutation<FeatureState[], { featureKey: FeatureKey; enabled: boolean }>({
      query: ({ featureKey, enabled }) => ({
        url: `features/${featureKey}`,
        method: 'PUT',
        body: { enabled },
      }),
      transformResponse: (r: { data: FeatureState[] }) => r.data,
      invalidatesTags: [{ type: 'Feature', id: 'LIST' }],
    }),
    clearFeatureOverride: build.mutation<FeatureState[], FeatureKey>({
      query: (featureKey) => ({
        url: `features/${featureKey}`,
        method: 'DELETE',
      }),
      transformResponse: (r: { data: FeatureState[] }) => r.data,
      invalidatesTags: [{ type: 'Feature', id: 'LIST' }],
    }),

    // ── Role permissions ────────────────────────────────────────────────────
    getRolePermissions: build.query<RolePermissionMatrix[], void>({
      query: () => ({ url: 'features/role-permissions' }),
      transformResponse: (r: { data: RolePermissionMatrix[] }) => r.data,
      providesTags: [{ type: 'RolePermissions', id: 'LIST' }],
    }),
    setRolePermission: build.mutation<
      RolePermissionMatrix,
      { role: OverridableRole; permission: Permission; granted: boolean }
    >({
      query: ({ role, permission, granted }) => ({
        url: `features/role-permissions/${role}/${permission}`,
        method: 'PUT',
        body: { granted },
      }),
      transformResponse: (r: { data: RolePermissionMatrix }) => r.data,
      invalidatesTags: [{ type: 'RolePermissions', id: 'LIST' }],
    }),
    clearRolePermission: build.mutation<
      RolePermissionMatrix,
      { role: OverridableRole; permission: Permission }
    >({
      query: ({ role, permission }) => ({
        url: `features/role-permissions/${role}/${permission}`,
        method: 'DELETE',
      }),
      transformResponse: (r: { data: RolePermissionMatrix }) => r.data,
      invalidatesTags: [{ type: 'RolePermissions', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetFeaturesQuery,
  useSetFeatureOverrideMutation,
  useClearFeatureOverrideMutation,
  useGetRolePermissionsQuery,
  useSetRolePermissionMutation,
  useClearRolePermissionMutation,
} = featuresApi;
