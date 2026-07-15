import React, { ReactNode, useMemo } from 'react';
import { useAuth } from './useAuth';
import { hasAllPermissions, hasAnyPermission, hasPermission, Permission } from '../../lib/permissions';
import type { UserRole } from '../../types';
import { useGetRolePermissionsQuery } from '../settings/api/featuresApi';

// Consults per-clinic role_permission_overrides when available, falling back
// to the static ROLE_PERMISSIONS matrix while the query is in flight.
//
// super_admin short-circuits to true ("*" in the matrix); other roles get the
// effective list (defaults ± overrides) from the /features/role-permissions
// endpoint.
export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  // Skip the override query for super_admin (no clinic) and unauthenticated
  // sessions; falls back to static-matrix evaluation in those cases.
  const skip = !role || role === 'super_admin';
  const { data: matrix } = useGetRolePermissionsQuery(undefined, { skip });

  return useMemo(() => {
    const overridable = role === 'clinic_admin' || role === 'doctor' || role === 'assistant';
    const effective = overridable ? matrix?.find((m) => m.role === role)?.effective : undefined;

    const can = (p: Permission): boolean => {
      if (!role) return false;
      if (role === 'super_admin') return true;
      if (effective) return effective.includes(p);
      return hasPermission(role, p);
    };

    return {
      role,
      can,
      canAny: (ps: Permission[]) => ps.some(can),
      canAll: (ps: Permission[]) => ps.every(can),
      // Expose the legacy static helpers for callers that explicitly want the
      // pre-override matrix (e.g. the Roles settings page showing defaults).
      staticCan: (p: Permission) => hasPermission(role, p),
      staticCanAny: (ps: Permission[]) => hasAnyPermission(role, ps),
      staticCanAll: (ps: Permission[]) => hasAllPermissions(role, ps),
    };
  }, [role, matrix]);
};

interface PermissionGateProps {
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}) => {
  const { can, canAny, canAll } = usePermissions();

  const allowed =
    (permission && can(permission)) ||
    (anyOf && canAny(anyOf)) ||
    (allOf && canAll(allOf));

  return <>{allowed ? children : fallback}</>;
};
