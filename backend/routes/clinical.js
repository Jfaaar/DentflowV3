const express = require('express');
const { authenticateToken } = require('../middleware/auth');
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

// Dental chart
router.get('/dental-chart', asyncHandler(ctrl.listChartEntries));
router.get('/dental-chart/:id', asyncHandler(ctrl.getChartEntry));
router.post('/dental-chart', asyncHandler(ctrl.createChartEntry));
router.put('/dental-chart/:id', asyncHandler(ctrl.updateChartEntry));
router.delete('/dental-chart/:id', asyncHandler(ctrl.deleteChartEntry));

module.exports = router;
