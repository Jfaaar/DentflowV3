const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/treatmentPlansController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
router.post('/', asyncHandler(ctrl.create));
router.put('/:id', asyncHandler(ctrl.update));
router.post('/:id/cancel', asyncHandler(ctrl.cancel));

// Status transitions
router.post('/:id/accept', asyncHandler(ctrl.accept));
router.post('/:id/reject', asyncHandler(ctrl.reject));

// Items (treatments scoped to plan)
router.get('/:id/items', asyncHandler(ctrl.listItems));
router.post('/:id/items', asyncHandler(ctrl.addItem));
router.delete('/items/:id', asyncHandler(ctrl.removeItem));

// Conversions
router.post('/:id/convert-to-invoice', asyncHandler(ctrl.convertToInvoice));
router.post('/:id/convert-to-appointments', asyncHandler(ctrl.convertToAppointments));

module.exports = router;
