const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/appointmentsController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
router.post('/', asyncHandler(ctrl.create));
router.put('/:id', asyncHandler(ctrl.update));
router.post('/:id/cancel', asyncHandler(ctrl.cancel));
router.post('/:id/restore', asyncHandler(ctrl.restore));
router.post('/cancel-many', asyncHandler(ctrl.cancelMany));

// Waiting-room status transitions
router.post('/:id/check-in', asyncHandler(ctrl.checkIn));
router.post('/:id/start', asyncHandler(ctrl.start));
router.post('/:id/complete', asyncHandler(ctrl.complete));
router.post('/:id/no-show', asyncHandler(ctrl.noShow));

module.exports = router;
