// Medical-MVP routes: vitals, problems, vaccinations, body-regions.
// Authenticated; tenant-scoped via RLS in 0008_medical_mvp.sql.
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/medicalController');

const router = express.Router();

router.use(authenticateToken);

function mount(prefix, handlers) {
  router.get(`${prefix}`, asyncHandler(handlers.list));
  router.get(`${prefix}/:id`, asyncHandler(handlers.get));
  router.post(`${prefix}`, asyncHandler(handlers.create));
  router.put(`${prefix}/:id`, asyncHandler(handlers.update));
  router.delete(`${prefix}/:id`, asyncHandler(handlers.remove));
}

mount('/vitals', ctrl.vitals);
mount('/problems', ctrl.problems);
mount('/vaccinations', ctrl.vaccinations);
mount('/body-regions', ctrl.bodyRegions);

module.exports = router;
