const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureGuard');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/insuranceController');

const router = express.Router();

router.use(authenticateToken);
router.use(requireFeature('insurance'));

// Providers
router.get('/providers', asyncHandler(ctrl.listProviders));

// Policies
router.get('/policies', asyncHandler(ctrl.listPolicies));
router.get('/policies/:id', asyncHandler(ctrl.getPolicy));
router.post('/policies', asyncHandler(ctrl.createPolicy));
router.put('/policies/:id', asyncHandler(ctrl.updatePolicy));
router.delete('/policies/:id', asyncHandler(ctrl.deletePolicy));

// Claims
router.get('/claims', asyncHandler(ctrl.listClaims));
router.get('/claims/:id', asyncHandler(ctrl.getClaim));
router.post('/claims', asyncHandler(ctrl.createClaim));
router.put('/claims/:id', asyncHandler(ctrl.updateClaim));

module.exports = router;
