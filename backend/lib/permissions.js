// JS port of lib/permissions.ts (Phase 4 backend hardening)
// Roles: super_admin (platform owner), clinic_admin, doctor, assistant
// Permission matrix is intentionally explicit so it can be reviewed at a glance.

const ROLES = ['super_admin', 'clinic_admin', 'doctor', 'assistant'];

// Permission keys describe what can be done on the server.
const PERMISSIONS = {
  // Backoffice / platform-owner scope
  'clinic:create': ['super_admin'],
  'clinic:read': ['super_admin', 'clinic_admin'],
  'clinic:update': ['super_admin'],
  'clinic:delete': ['super_admin'],
  'backoffice:stats': ['super_admin'],

  // User management on the platform side
  'user:create': ['super_admin', 'clinic_admin'],
  'user:read': ['super_admin', 'clinic_admin'],
  'user:update': ['super_admin', 'clinic_admin'],
  'user:delete': ['super_admin', 'clinic_admin'],
  'user:reset-password': ['super_admin'],
  'user:role-change': ['super_admin'],

  // Staff management (clinic scope)
  'staff:create': ['super_admin', 'clinic_admin'],
  'staff:read': ['super_admin', 'clinic_admin', 'doctor', 'assistant'],
  'staff:delete': ['super_admin', 'clinic_admin'],

  // Invitations
  'invitation:create': ['super_admin', 'clinic_admin'],
  'invitation:read': ['super_admin', 'clinic_admin'],

  // Patients & clinical
  'patient:read': ['super_admin', 'clinic_admin', 'doctor', 'assistant'],
  'patient:write': ['super_admin', 'clinic_admin', 'doctor', 'assistant'],

  // Documents (radiology)
  'document:read': ['super_admin', 'clinic_admin', 'doctor', 'assistant'],
  'document:write': ['super_admin', 'clinic_admin', 'doctor', 'assistant'],
  'document:delete': ['super_admin', 'clinic_admin', 'doctor'],
};

function hasPermission(role, permission) {
  if (!role) return false;
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

function hasAnyRole(role, roles) {
  if (!role) return false;
  return roles.includes(role);
}

module.exports = { ROLES, PERMISSIONS, hasPermission, hasAnyRole };
