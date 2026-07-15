// Medical-MVP routes: vitals, problems, vaccinations, body-regions.
// Authenticated; tenant-scoped via RLS in 0008_medical_mvp.sql.
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureGuard');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/medicalController');

const router = express.Router();

router.use(authenticateToken);

function mount(prefix, featureKey, handlers) {
  const gate = requireFeature(featureKey);
  router.get(`${prefix}`, gate, asyncHandler(handlers.list));
  router.get(`${prefix}/:id`, gate, asyncHandler(handlers.get));
  router.post(`${prefix}`, gate, asyncHandler(handlers.create));
  router.put(`${prefix}/:id`, gate, asyncHandler(handlers.update));
  router.delete(`${prefix}/:id`, gate, asyncHandler(handlers.remove));
}

mount('/vitals', 'vitals', ctrl.vitals);
mount('/problems', 'problemList', ctrl.problems);
mount('/vaccinations', 'vaccinations', ctrl.vaccinations);
mount('/body-regions', 'bodyRegionChart', ctrl.bodyRegions);

module.exports = router;
