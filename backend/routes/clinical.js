const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireSpecialty } = require('../middleware/requireSpecialty');
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

// Dental chart — gated by clinic specialty.
const dentalOnly = requireSpecialty(['dental']);
router.get('/dental-chart', dentalOnly, asyncHandler(ctrl.listChartEntries));
router.get('/dental-chart/:id', dentalOnly, asyncHandler(ctrl.getChartEntry));
router.post('/dental-chart', dentalOnly, asyncHandler(ctrl.createChartEntry));
router.put('/dental-chart/:id', dentalOnly, asyncHandler(ctrl.updateChartEntry));
router.delete('/dental-chart/:id', dentalOnly, asyncHandler(ctrl.deleteChartEntry));

module.exports = router;
