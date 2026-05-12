const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureGuard');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/prescriptionsController');

const router = express.Router();

router.use(authenticateToken);
router.use(requireFeature('prescriptions'));

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
router.post('/', asyncHandler(ctrl.create));
router.put('/:id', asyncHandler(ctrl.update));
router.delete('/:id', asyncHandler(ctrl.remove));

module.exports = router;
