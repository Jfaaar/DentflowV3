const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureGuard');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/medicamentsCatalogController');

const router = express.Router();

router.use(authenticateToken);
router.use(requireFeature('medicaments'));

// Specific routes first so they're not captured by /:id.
router.get('/groups', asyncHandler(ctrl.listGroups));
router.get('/stats', asyncHandler(ctrl.stats));
router.get('/labs', asyncHandler(ctrl.labs));

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
router.get('/:id/price', asyncHandler(ctrl.getPrice));
router.get('/:id/history', asyncHandler(ctrl.history));

module.exports = router;
