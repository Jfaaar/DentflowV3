// Dental-pack routes (Phase 1).
// Mounted at /api/v1/dental. Each sub-router gates with requireFeature on
// its own key — perioChart, endoChart, orthoModule, plus the dentalLab board
// (which reuses dentalChart's permission as the pack's "you're a dental
// clinic" gate). Endo / ortho / lab handlers ship in slice 1.D.

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureGuard');
const { asyncHandler } = require('../utils/asyncHandler');

const perio = require('../controllers/perioController');

const router = express.Router();
router.use(authenticateToken);

const perioGate = requireFeature('perioChart');
router.get('/perio',          perioGate, asyncHandler(perio.listCharts));
router.get('/perio/:id',      perioGate, asyncHandler(perio.getChart));
router.post('/perio',         perioGate, asyncHandler(perio.createChart));
router.put('/perio/:id',      perioGate, asyncHandler(perio.updateChart));
router.put('/perio/:id/sites', perioGate, asyncHandler(perio.replaceSites));
router.delete('/perio/:id',   perioGate, asyncHandler(perio.deleteChart));

module.exports = router;
