const service = require('../services/featuresService');

async function listFeatures(req, res) {
  res.json({ data: await service.listFeatures(req) });
}

async function setFeatureOverride(req, res) {
  const { key } = req.params;
  const { enabled } = req.body ?? {};
  res.json({ data: await service.setFeatureOverride(req, key, enabled) });
}

async function clearFeatureOverride(req, res) {
  const { key } = req.params;
  res.json({ data: await service.clearFeatureOverride(req, key) });
}

async function listRolePermissions(req, res) {
  res.json({ data: await service.listRolePermissions(req) });
}

async function setRolePermission(req, res) {
  const { role, permission } = req.params;
  const { granted } = req.body ?? {};
  res.json({ data: await service.setRolePermission(req, role, permission, granted) });
}

async function clearRolePermission(req, res) {
  const { role, permission } = req.params;
  res.json({ data: await service.clearRolePermission(req, role, permission) });
}

module.exports = {
  listFeatures,
  setFeatureOverride,
  clearFeatureOverride,
  listRolePermissions,
  setRolePermission,
  clearRolePermission,
};
