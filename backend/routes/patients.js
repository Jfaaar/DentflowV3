// Patients router — URL → controller wiring only.
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/patientsController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
router.post('/', asyncHandler(ctrl.create));
router.put('/:id', asyncHandler(ctrl.update));
router.post('/:id/archive', asyncHandler(ctrl.archive));
router.delete('/:id', asyncHandler(ctrl.remove));

module.exports = router;
