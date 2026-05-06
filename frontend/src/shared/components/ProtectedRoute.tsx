import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { usePermissions } from '@/features/auth/usePermissions';
import type { Permission } from '../../lib/permissions';
import type { UserRole } from '../../types';
import { ROUTES } from '../constants/routes';

const FullScreenLoader: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-surface-50 dark:bg-surface-900">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
  </div>
);

export interface ProtectedRouteProps {
  /** If set, only these roles may pass. */
  roles?: UserRole[];
  /** If set, the user must hold this single permission. */
  permission?: Permission;
  /** If set, the user must hold at least one of these permissions. */
  anyPermissionOf?: Permission[];
  /** Where to send unauthenticated users. Defaults to /login. */
  loginRedirect?: string;
  /** Where to send authenticated users who fail role/permission checks. */
  forbiddenRedirect?: string;
}

/**
 * Single Outlet-based gate for auth + role + permission checks. Replaces the
 * legacy <RequireAuth> / <RequireRole> / <RequirePermission> trio in new code.
 *
 *   <Route element={<ProtectedRoute roles={['doctor']} permission="clinical.view" />}>
 *     <Route path="/foo" element={<Foo />} />
 *   </Route>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  roles,
  permission,
  anyPermissionOf,
  loginRedirect = ROUTES.auth.login,
  forbiddenRedirect = ROUTES.app.dashboard,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { can, canAny } = usePermissions();

  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated || !user) {
    return <Navigate to={loginRedirect} replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role as UserRole)) {
    return <Navigate to={forbiddenRedirect} replace />;
  }

  const permOk =
    (!permission || can(permission)) && (!anyPermissionOf || canAny(anyPermissionOf));
  if (!permOk) {
    return <Navigate to={forbiddenRedirect} replace />;
  }

  return <Outlet />;
};
