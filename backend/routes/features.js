// Specialty-driven feature catalog + per-clinic role permission overrides.
//
//   GET    /api/v1/features                              → effective feature list
//   PUT    /api/v1/features/:key            { enabled }  → set override (admin)
//   DELETE /api/v1/features/:key                         → clear override (admin)
//
//   GET    /api/v1/features/role-permissions             → role × permission matrix
//   PUT    /api/v1/features/role-permissions/:role/:permission  { granted } → set override (admin)
//   DELETE /api/v1/features/role-permissions/:role/:permission  → clear override (admin)

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/featuresController');

const router = express.Router();

router.use(authenticateToken);

// Read endpoints — any clinic user.
router.get('/', asyncHandler(ctrl.listFeatures));
router.get('/role-permissions', asyncHandler(ctrl.listRolePermissions));

// Write endpoints — admin only.
const adminOnly = requireRole('super_admin', 'clinic_admin');

router.put('/:key', adminOnly, asyncHandler(ctrl.setFeatureOverride));
router.delete('/:key', adminOnly, asyncHandler(ctrl.clearFeatureOverride));

router.put(
  '/role-permissions/:role/:permission',
  adminOnly,
  asyncHandler(ctrl.setRolePermission),
);
router.delete(
  '/role-permissions/:role/:permission',
  adminOnly,
  asyncHandler(ctrl.clearRolePermission),
);

module.exports = router;
