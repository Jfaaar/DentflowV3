const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/statsController');

const router = express.Router();

router.use(authenticateToken);

router.get('/dashboard', asyncHandler(ctrl.dashboard));
router.get('/revenue', asyncHandler(ctrl.revenue));

module.exports = router;
