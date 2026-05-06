const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const ctrl = require('../controllers/settingsController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', asyncHandler(ctrl.get));
router.put('/', asyncHandler(ctrl.update));

module.exports = router;
