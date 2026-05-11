// Features + role permission overrides — thin orchestration over the repo.
//
// Authorization:
//   • Read endpoints (list features, list role permissions) are allowed for
//     any authenticated clinic user — the UI uses them to gate navigation.
//   • Write endpoints (toggle feature override, toggle role permission) are
//     restricted to clinic_admin / super_admin at the controller layer.

const repo = require('../repositories/featuresRepository');
const { ApiError } = require('../middleware/errorHandler');
const { isFeatureKey } = require('../lib/features');
const { OVERRIDABLE_ROLES, isKnownPermission } = require('../lib/rolePermissions');

function requireClinic(req) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return req.user.clinicId;
}

function assertFeatureKey(key) {
  if (!isFeatureKey(key)) {
    throw new ApiError(404, 'UNKNOWN_FEATURE', `Unknown feature_key '${key}'`);
  }
}

function assertOverridableRole(role) {
  if (!OVERRIDABLE_ROLES.includes(role)) {
    throw new ApiError(400, 'INVALID_ROLE', `Role '${role}' is not overridable`);
  }
}

function assertPermission(permission) {
  if (!isKnownPermission(permission)) {
    throw new ApiError(400, 'UNKNOWN_PERMISSION', `Unknown permission '${permission}'`);
  }
}

// ── Features ────────────────────────────────────────────────────────────────
function listFeatures(req) {
  return repo.resolveClinicFeatures(req.db, requireClinic(req));
}

async function setFeatureOverride(req, featureKey, enabled) {
  assertFeatureKey(featureKey);
  if (typeof enabled !== 'boolean') {
    throw new ApiError(400, 'VALIDATION', '`enabled` must be boolean');
  }
  const clinicId = requireClinic(req);
  await repo.upsertClinicOverride(req.db, clinicId, featureKey, enabled, req.user?.id);
  return repo.resolveClinicFeatures(req.db, clinicId);
}

async function clearFeatureOverride(req, featureKey) {
  assertFeatureKey(featureKey);
  const clinicId = requireClinic(req);
  await repo.deleteClinicOverride(req.db, clinicId, featureKey);
  return repo.resolveClinicFeatures(req.db, clinicId);
}

// ── Role permissions ────────────────────────────────────────────────────────
function listRolePermissions(req) {
  return repo.resolveAllRolePermissions(req.db, requireClinic(req));
}

async function setRolePermission(req, role, permission, granted) {
  assertOverridableRole(role);
  assertPermission(permission);
  if (typeof granted !== 'boolean') {
    throw new ApiError(400, 'VALIDATION', '`granted` must be boolean');
  }
  const clinicId = requireClinic(req);
  await repo.upsertRoleOverride(req.db, clinicId, role, permission, granted, req.user?.id);
  return repo.resolveRolePermissions(req.db, clinicId, role);
}

async function clearRolePermission(req, role, permission) {
  assertOverridableRole(role);
  assertPermission(permission);
  const clinicId = requireClinic(req);
  await repo.deleteRoleOverride(req.db, clinicId, role, permission);
  return repo.resolveRolePermissions(req.db, clinicId, role);
}

module.exports = {
  listFeatures,
  setFeatureOverride,
  clearFeatureOverride,
  listRolePermissions,
  setRolePermission,
  clearRolePermission,
};
