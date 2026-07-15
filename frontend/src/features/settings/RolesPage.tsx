// Roles admin page — edit the per-clinic role × permission matrix on top of
// the static ROLE_PERMISSIONS defaults.
//
// Each row is a permission; each column is an overridable role (clinic_admin,
// doctor, assistant). A checkbox reflects the *effective* state; toggling
// writes a row to role_permission_overrides. A subtle "default: on/off" hint
// shows the static-matrix value so admins know when they are diverging from
// the standard role, and a reset action removes the override.
//
// Permissions are grouped by domain (the prefix before the dot) for scan-ability.
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
  useGetRolePermissionsQuery,
  useSetRolePermissionMutation,
  useClearRolePermissionMutation,
  type OverridableRole,
  type RolePermissionMatrix,
} from './api/featuresApi';
import { useAuth } from '../auth/useAuth';
import type { Permission } from '@/lib/permissions';

const ROLES: OverridableRole[] = ['clinic_admin', 'doctor', 'assistant'];

const ROLE_LABEL: Record<OverridableRole, string> = {
  clinic_admin: 'Admin',
  doctor: 'Médecin',
  assistant: 'Assistant',
};

// Static defaults pulled from the matrix endpoint (each row's `defaults`).
// Used to display the "default" hint and to power reset semantics.
function defaultsFor(matrix: RolePermissionMatrix[] | undefined, role: OverridableRole): Set<Permission> {
  const entry = matrix?.find((m) => m.role === role);
  return new Set((entry?.defaults ?? []) as Permission[]);
}

function effectiveFor(matrix: RolePermissionMatrix[] | undefined, role: OverridableRole): Set<Permission> {
  const entry = matrix?.find((m) => m.role === role);
  return new Set((entry?.effective ?? []) as Permission[]);
}

function overridesFor(matrix: RolePermissionMatrix[] | undefined, role: OverridableRole) {
  const entry = matrix?.find((m) => m.role === role);
  return entry?.overrides ?? {};
}

// Group permissions by the domain prefix (e.g. "patients", "clinical").
function groupPermissions(perms: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const p of perms) {
    const domain = p.split('.')[0] ?? 'other';
    (groups[domain] ||= []).push(p);
  }
  for (const k of Object.keys(groups)) groups[k].sort();
  return groups;
}

export const RolesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'clinic_admin' || user?.role === 'super_admin';

  const { data: matrix, isLoading } = useGetRolePermissionsQuery();
  const [setPerm] = useSetRolePermissionMutation();
  const [clearPerm] = useClearRolePermissionMutation();

  // Union of all permissions known to any role's `defaults` (= the full set
  // the server treats as valid; mirrors lib/rolePermissions.js ALL_PERMISSIONS).
  const allPermissions = useMemo<Permission[]>(() => {
    const set = new Set<string>();
    for (const m of matrix ?? []) for (const p of m.defaults) set.add(p);
    return [...set].sort() as Permission[];
  }, [matrix]);

  const grouped = useMemo(() => groupPermissions(allPermissions), [allPermissions]);

  const roleState = useMemo(
    () => ({
      clinic_admin: {
        defaults: defaultsFor(matrix, 'clinic_admin'),
        effective: effectiveFor(matrix, 'clinic_admin'),
        overrides: overridesFor(matrix, 'clinic_admin'),
      },
      doctor: {
        defaults: defaultsFor(matrix, 'doctor'),
        effective: effectiveFor(matrix, 'doctor'),
        overrides: overridesFor(matrix, 'doctor'),
      },
      assistant: {
        defaults: defaultsFor(matrix, 'assistant'),
        effective: effectiveFor(matrix, 'assistant'),
        overrides: overridesFor(matrix, 'assistant'),
      },
    }),
    [matrix],
  );

  if (!isAdmin) {
    return (
      <div className="p-10 text-center text-surface-500">
        {t('rolesPermissionDenied', 'You do not have permission to manage roles.')}
      </div>
    );
  }

  const cell = (permission: Permission, role: OverridableRole) => {
    const st = roleState[role];
    const isOverridden = permission in st.overrides;
    const checked = st.effective.has(permission);
    const isDefault = st.defaults.has(permission);
    return (
      <td key={`${permission}:${role}`} className="px-3 py-2 align-middle">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={() =>
              setPerm({ role, permission, granted: !checked })
            }
            className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
          />
          {isOverridden && (
            <button
              type="button"
              onClick={() => clearPerm({ role, permission })}
              title={t('rolesResetTitle', `Reset to default (${isDefault ? 'on' : 'off'})`) as string}
              className="text-surface-400 hover:text-primary-600"
            >
              <RotateCcw size={12} />
            </button>
          )}
          {!isOverridden && (
            <span
              className="text-[10px] text-surface-400"
              title={t('rolesDefaultHint', 'Static default') as string}
            >
              {isDefault ? '·' : ''}
            </span>
          )}
        </div>
      </td>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          {t('rolesTitle', 'Roles & permissions')}
        </h1>
        <p className="text-surface-500">
          {t(
            'rolesDescription',
            'Customize what each role can do in this clinic. Defaults come from the platform role matrix; overrides apply only here.',
          )}
        </p>
      </header>

      {isLoading && <div className="text-sm text-surface-500">{t('loading', 'Loading…')}</div>}

      {Object.entries(grouped).map(([domain, perms]) => (
        <Card key={domain} noPadding className="overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-surface-100 dark:border-surface-800">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-500">
              {domain}
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-900/40">
                <th className="text-start px-6 py-2 text-xs font-medium text-surface-500">
                  {t('rolesPermissionCol', 'Permission')}
                </th>
                {ROLES.map((r) => (
                  <th
                    key={r}
                    className="text-start px-3 py-2 text-xs font-medium text-surface-500 w-32"
                  >
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map((p) => (
                <tr key={p} className="border-t border-surface-100 dark:border-surface-800">
                  <td className="px-6 py-2 align-middle">
                    <code className="text-xs text-surface-700 dark:text-surface-200">{p}</code>
                  </td>
                  {ROLES.map((r) => cell(p as Permission, r))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}

      <Card>
        <div className="text-xs text-surface-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <RotateCcw size={11} className="inline mr-1" />
            {t('rolesLegendReset', 'Reset to default')}
          </span>
          <span>· = {t('rolesLegendDefault', 'matches static default')}</span>
        </div>
      </Card>
    </div>
  );
};
