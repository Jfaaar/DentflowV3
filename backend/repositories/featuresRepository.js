// Feature access + per-clinic role permission overrides — pg.
//
// Two compute paths:
//   resolveClinicFeatures(db, clinicId)    → [{key, displayName, ..., enabled, source}]
//   resolveRolePermissions(db, clinicId, role) → { role, defaults: [...], overrides: {perm: granted}, effective: Set }
//
// All resolution is read-time. We don't denormalize "enabled" anywhere — the
// effective state is always defaultSpecialties ∩ enabled_specialties, with an
// override row taking precedence.

const { staticPermissionsFor, isKnownPermission, OVERRIDABLE_ROLES } = require('../lib/rolePermissions');

// ── feature_definitions catalog ─────────────────────────────────────────────
async function listDefinitions(db) {
  const r = await db.query(
    `SELECT feature_key, display_name, description, default_specialties,
            default_permission, category, sort_order
       FROM feature_definitions
      ORDER BY sort_order, feature_key`,
  );
  return r.rows.map(definitionFromDb);
}

function definitionFromDb(row) {
  return {
    featureKey: row.feature_key,
    displayName: row.display_name,
    description: row.description ?? null,
    defaultSpecialties: row.default_specialties ?? [],
    defaultPermission: row.default_permission,
    category: row.category,
    sortOrder: row.sort_order,
  };
}

// ── clinic_feature_overrides ────────────────────────────────────────────────
async function listClinicOverrides(db, clinicId) {
  const r = await db.query(
    `SELECT feature_key, enabled, updated_at, updated_by
       FROM clinic_feature_overrides
      WHERE clinic_id = $1`,
    [clinicId],
  );
  const map = new Map();
  for (const row of r.rows) {
    map.set(row.feature_key, {
      enabled: row.enabled,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    });
  }
  return map;
}

async function upsertClinicOverride(db, clinicId, featureKey, enabled, updatedBy) {
  await db.query(
    `INSERT INTO clinic_feature_overrides (clinic_id, feature_key, enabled, updated_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clinic_id, feature_key)
     DO UPDATE SET enabled = EXCLUDED.enabled,
                   updated_by = EXCLUDED.updated_by,
                   updated_at = NOW()`,
    [clinicId, featureKey, enabled, updatedBy ?? null],
  );
}

async function deleteClinicOverride(db, clinicId, featureKey) {
  await db.query(
    `DELETE FROM clinic_feature_overrides
      WHERE clinic_id = $1 AND feature_key = $2`,
    [clinicId, featureKey],
  );
}

// ── role_permission_overrides ───────────────────────────────────────────────
async function listRoleOverrides(db, clinicId, role = null) {
  const params = [clinicId];
  let sql = `SELECT role, permission, granted, updated_at, updated_by
               FROM role_permission_overrides
              WHERE clinic_id = $1`;
  if (role) {
    params.push(role);
    sql += ` AND role = $2`;
  }
  const r = await db.query(sql, params);
  return r.rows.map((row) => ({
    role: row.role,
    permission: row.permission,
    granted: row.granted,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  }));
}

async function upsertRoleOverride(db, clinicId, role, permission, granted, updatedBy) {
  await db.query(
    `INSERT INTO role_permission_overrides (clinic_id, role, permission, granted, updated_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (clinic_id, role, permission)
     DO UPDATE SET granted = EXCLUDED.granted,
                   updated_by = EXCLUDED.updated_by,
                   updated_at = NOW()`,
    [clinicId, role, permission, granted, updatedBy ?? null],
  );
}

async function deleteRoleOverride(db, clinicId, role, permission) {
  await db.query(
    `DELETE FROM role_permission_overrides
      WHERE clinic_id = $1 AND role = $2 AND permission = $3`,
    [clinicId, role, permission],
  );
}

// ── Effective state resolution ──────────────────────────────────────────────
async function getEnabledSpecialties(db, clinicId) {
  const r = await db.query(
    `SELECT enabled_specialties FROM clinic_settings WHERE clinic_id = $1 LIMIT 1`,
    [clinicId],
  );
  return r.rows[0]?.enabled_specialties ?? ['general_practice'];
}

function defaultEnabled(definition, enabledSpecialties) {
  if (!definition.defaultSpecialties.length) return false;
  return definition.defaultSpecialties.some((s) => enabledSpecialties.includes(s));
}

async function resolveClinicFeatures(db, clinicId) {
  const [definitions, overrides, enabledSpecialties] = await Promise.all([
    listDefinitions(db),
    listClinicOverrides(db, clinicId),
    getEnabledSpecialties(db, clinicId),
  ]);

  return definitions.map((def) => {
    const override = overrides.get(def.featureKey);
    const autoEnabled = defaultEnabled(def, enabledSpecialties);
    const enabled = override ? override.enabled : autoEnabled;
    return {
      ...def,
      autoEnabled,
      enabled,
      source: override ? 'override' : 'auto',
      overrideUpdatedAt: override?.updatedAt ?? null,
    };
  });
}

async function isFeatureEnabled(db, clinicId, featureKey) {
  const r = await db.query(
    `SELECT enabled FROM clinic_feature_overrides
      WHERE clinic_id = $1 AND feature_key = $2 LIMIT 1`,
    [clinicId, featureKey],
  );
  if (r.rows.length) return r.rows[0].enabled === true;

  // Fall back to default_specialties ∩ enabled_specialties.
  const r2 = await db.query(
    `SELECT (fd.default_specialties && cs.enabled_specialties) AS enabled
       FROM feature_definitions fd
       CROSS JOIN clinic_settings cs
      WHERE fd.feature_key = $1 AND cs.clinic_id = $2
      LIMIT 1`,
    [featureKey, clinicId],
  );
  return r2.rows[0]?.enabled === true;
}

async function resolveRolePermissions(db, clinicId, role) {
  const defaults = staticPermissionsFor(role);
  const overrides = await listRoleOverrides(db, clinicId, role);
  const effective = new Set(defaults);
  const overrideMap = {};
  for (const o of overrides) {
    overrideMap[o.permission] = o.granted;
    if (o.granted) effective.add(o.permission);
    else effective.delete(o.permission);
  }
  return {
    role,
    defaults,
    overrides: overrideMap,
    effective: [...effective],
  };
}

async function resolveAllRolePermissions(db, clinicId) {
  return Promise.all(OVERRIDABLE_ROLES.map((r) => resolveRolePermissions(db, clinicId, r)));
}

async function hasEffectivePermission(db, clinicId, role, permission) {
  if (role === 'super_admin') return true;
  if (!isKnownPermission(permission)) return false;

  const r = await db.query(
    `SELECT granted FROM role_permission_overrides
      WHERE clinic_id = $1 AND role = $2 AND permission = $3 LIMIT 1`,
    [clinicId, role, permission],
  );
  if (r.rows.length) return r.rows[0].granted === true;

  // No override — fall back to the static matrix.
  return staticPermissionsFor(role).includes(permission);
}

module.exports = {
  listDefinitions,
  listClinicOverrides,
  upsertClinicOverride,
  deleteClinicOverride,
  listRoleOverrides,
  upsertRoleOverride,
  deleteRoleOverride,
  resolveClinicFeatures,
  resolveRolePermissions,
  resolveAllRolePermissions,
  isFeatureEnabled,
  hasEffectivePermission,
};
