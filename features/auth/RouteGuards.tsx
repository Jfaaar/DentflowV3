import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import type { Permission } from '../../lib/permissions';
import type { UserRole } from '../../types';

const FullScreenLoader: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-surface-50 dark:bg-surface-900">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-medical-blue border-t-transparent" />
  </div>
);

/**
 * Guards routes that require authentication.
 * Redirects to /login while preserving the destination.
 */
export const RequireAuth: React.FC<{ redirectTo?: string }> = ({ redirectTo = '/login' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};

/**
 * Guards routes by role. `roles` is an allowlist.
 * Non-matching authenticated users are sent to /app/dashboard.
 */
export const RequireRole: React.FC<{ roles: UserRole[]; fallback?: string }> = ({
  roles,
  fallback = '/app/dashboard',
}) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  if (!user || !roles.includes(user.role as UserRole)) {
    return <Navigate to={fallback} replace />;
  }
  return <Outlet />;
};

/**
 * Guards a route by required permission(s).
 */
export const RequirePermission: React.FC<{
  permission?: Permission;
  anyOf?: Permission[];
  fallback?: string;
}> = ({ permission, anyOf, fallback = '/app/dashboard' }) => {
  const { can, canAny } = usePermissions();
  const ok = (permission && can(permission)) || (anyOf && canAny(anyOf));
  if (!ok) return <Navigate to={fallback} replace />;
  return <Outlet />;
};

/**
 * Redirect to the role-appropriate landing page after login.
 */
export const RoleLanding: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'super_admin') return <Navigate to="/backoffice" replace />;
  return <Navigate to="/app/dashboard" replace />;
};
