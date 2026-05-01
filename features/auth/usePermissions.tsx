import React, { ReactNode, useMemo } from 'react';
import { useAuth } from './useAuth';
import { hasAllPermissions, hasAnyPermission, hasPermission, Permission } from '../../lib/permissions';
import type { UserRole } from '../../types';

export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  return useMemo(
    () => ({
      role,
      can: (p: Permission) => hasPermission(role, p),
      canAny: (ps: Permission[]) => hasAnyPermission(role, ps),
      canAll: (ps: Permission[]) => hasAllPermissions(role, ps),
    }),
    [role],
  );
};

interface PermissionGateProps {
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally render children based on the current user's permissions.
 * Provide one of `permission`, `anyOf`, or `allOf`.
 */
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
