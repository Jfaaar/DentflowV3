/**
 * RBAC permission map for DentFlow.
 *
 * Phase 3 introduces granular permissions for the clinical, treatments,
 * prescriptions, and insurance modules. Permission strings follow
 * `<resource>.<action>` and are checked via `hasPermission(role, key)` and
 * the <PermissionGate /> component.
 */
import type { UserRole } from '../types';

export type PermissionKey =
  // Clinical notes
  | 'clinical.read'
  | 'clinical.create'
  | 'clinical.edit'
  | 'clinical.sign'
  | 'clinical.delete'
  // Dental chart
  | 'dentalChart.read'
  | 'dentalChart.edit'
  // Treatments / treatment plans
  | 'treatments.read'
  | 'treatments.create'
  | 'treatments.edit'
  | 'treatments.accept'
  | 'treatments.convert'
  | 'treatments.delete'
  // Prescriptions
  | 'prescriptions.read'
  | 'prescriptions.create'
  | 'prescriptions.sign'
  | 'prescriptions.delete'
  // Insurance
  | 'insurance.read'
  | 'insurance.edit'
  | 'insurance.submit'
  | 'insurance.reimburse';

const allClinical: PermissionKey[] = [
  'clinical.read', 'clinical.create', 'clinical.edit',
  'clinical.sign', 'clinical.delete',
  'dentalChart.read', 'dentalChart.edit',
  'treatments.read', 'treatments.create', 'treatments.edit',
  'treatments.accept', 'treatments.convert', 'treatments.delete',
  'prescriptions.read', 'prescriptions.create',
  'prescriptions.sign', 'prescriptions.delete',
  'insurance.read', 'insurance.edit', 'insurance.submit',
  'insurance.reimburse',
];

const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  super_admin: allClinical,
  clinic_admin: allClinical,
  doctor: [
    'clinical.read', 'clinical.create', 'clinical.edit', 'clinical.sign',
    'dentalChart.read', 'dentalChart.edit',
    'treatments.read', 'treatments.create', 'treatments.edit',
    'treatments.accept', 'treatments.convert',
    'prescriptions.read', 'prescriptions.create', 'prescriptions.sign',
    'insurance.read', 'insurance.edit', 'insurance.submit', 'insurance.reimburse',
  ],
  assistant: [
    'clinical.read',
    'dentalChart.read',
    'treatments.read',
    'prescriptions.read',
    'insurance.read',
  ],
};

export function hasPermission(role: UserRole | undefined, key: PermissionKey): boolean {
  if (!role) return false;
  const list = ROLE_PERMISSIONS[role] || [];
  return list.includes(key);
}

export function getRolePermissions(role: UserRole | undefined): PermissionKey[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
}
