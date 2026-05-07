// Staff invitation routes — stubbed pending the post-Supabase auth rewire.
//
// These previously created invitation rows + Supabase Auth users. They'll
// come back online when an auth provider replaces Supabase Auth.
const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.all(['/staff', '/clinics/:clinicId/invitations'], (_req, res) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message:
        'Staff invitation flow needs to be re-wired against the new auth provider.',
    },
  });
});

module.exports = router;
