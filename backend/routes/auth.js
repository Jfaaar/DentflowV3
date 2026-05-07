// Public auth-related routes — stubbed.
//
// Until a real auth provider is wired in (the demo/demo flow on the
// frontend currently bypasses login entirely), these routes return
// 501 Not Implemented. The legacy Supabase invitation flow has been
// removed wholesale.
const express = require('express');

const router = express.Router();

router.all('/:token', (_req, res) => {
  res
    .status(501)
    .json({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Invitation flow needs to be re-wired against the new auth provider.',
      },
    });
});

module.exports = router;
