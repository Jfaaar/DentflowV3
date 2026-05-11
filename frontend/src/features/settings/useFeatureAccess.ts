// useFeatureAccess — the single source of truth for "should I show this module
// to this user in this clinic?". Combines:
//   1. feature_definitions ∩ enabled_specialties (from /features endpoint), and
//   2. role × permission matrix with per-clinic overrides (from /features/role-permissions).
//
// Routes, sidebar items, page buttons should all gate through this hook so
// behavior stays in sync with the server's enforcement.
//
// Loading semantics: while either query is loading we return `enabled = false`
// and `isLoading = true`. Callers that want to render a skeleton instead of a
// 404 redirect can branch on `isLoading`. ProtectedRoute does this.
import { useMemo } from 'react';
import { useGetFeaturesQuery, useGetRolePermissionsQuery } from './api/featuresApi';
import type { FeatureKey, FeatureState } from '@/lib/features';
import type { Permission } from '@/lib/permissions';
import { useAuth } from '../auth/useAuth';

export interface FeatureAccessResult {
  enabled: boolean;
  can: boolean;
  isLoading: boolean;
  feature: FeatureState | null;
}

export interface FeatureAccessApi {
  isLoading: boolean;
  /** Just the feature gate — ignores role permissions. */
  isFeatureEnabled: (key: FeatureKey) => boolean;
  /** Effective permission for the current user in the current clinic. */
  canEffective: (permission: Permission) => boolean;
  /** Feature gate AND (override permission OR feature's default permission). */
  access: (key: FeatureKey, overridePermission?: Permission) => FeatureAccessResult;
  /** All features as a map for cheap repeated lookups. */
  features: Record<string, FeatureState>;
}

export function useFeatureAccessApi(): FeatureAccessApi {
  const { user } = useAuth();
  const role = user?.role;

  const { data: features, isLoading: loadingFeatures } = useGetFeaturesQuery();
  const { data: roleMatrix, isLoading: loadingRoles } = useGetRolePermissionsQuery();

  return useMemo(() => {
    const isLoading = loadingFeatures || loadingRoles;

    const featuresMap: Record<string, FeatureState> = {};
    for (const f of features ?? []) featuresMap[f.featureKey] = f;

    const isFeatureEnabled = (key: FeatureKey) => featuresMap[key]?.enabled === true;

    const canEffective = (permission: Permission): boolean => {
      if (!role) return false;
      if (role === 'super_admin') return true;
      if (role === 'clinic_admin' || role === 'doctor' || role === 'assistant') {
        const entry = roleMatrix?.find((m) => m.role === role);
        if (!entry) return false;
        return entry.effective.includes(permission);
      }
      return false;
    };

    const access = (key: FeatureKey, overridePermission?: Permission): FeatureAccessResult => {
      const feature = featuresMap[key] ?? null;
      const enabled = feature?.enabled === true;
      const perm = overridePermission ?? feature?.defaultPermission;
      const can = enabled && (!!perm ? canEffective(perm) : false);
      return { enabled, can, isLoading, feature };
    };

    return { isLoading, isFeatureEnabled, canEffective, access, features: featuresMap };
  }, [features, roleMatrix, role, loadingFeatures, loadingRoles]);
}

export function useFeatureAccess(
  key: FeatureKey,
  permission?: Permission,
): FeatureAccessResult {
  const api = useFeatureAccessApi();
  return useMemo(() => api.access(key, permission), [api, key, permission]);
}
