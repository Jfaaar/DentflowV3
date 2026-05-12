const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureGuard');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/clinicalController');

const router = express.Router();

router.use(authenticateToken);

// Clinical notes
router.get('/notes', asyncHandler(ctrl.listNotes));
router.get('/notes/:id', asyncHandler(ctrl.getNote));
router.post('/notes', asyncHandler(ctrl.createNote));
router.put('/notes/:id', asyncHandler(ctrl.updateNote));
router.post('/notes/:id/sign', asyncHandler(ctrl.signNote));
router.delete('/notes/:id', asyncHandler(ctrl.deleteNote));

// Dental chart — gated by clinic feature (defaults to dental specialty,
// can be force-enabled or disabled per clinic via clinic_feature_overrides).
const dentalChartGate = requireFeature('dentalChart');
router.get('/dental-chart', dentalChartGate, asyncHandler(ctrl.listChartEntries));
router.get('/dental-chart/:id', dentalChartGate, asyncHandler(ctrl.getChartEntry));
router.post('/dental-chart', dentalChartGate, asyncHandler(ctrl.createChartEntry));
router.put('/dental-chart/:id', dentalChartGate, asyncHandler(ctrl.updateChartEntry));
router.delete('/dental-chart/:id', dentalChartGate, asyncHandler(ctrl.deleteChartEntry));

module.exports = router;
