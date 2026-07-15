// Backoffice (super_admin) routes — stubbed pending the post-Supabase
// auth rewire.
//
// The legacy implementation depended on supabaseAdmin.auth.admin (createUser,
// listUsers, deleteUser, resetPassword, etc.) — Supabase-specific surfaces
// with no direct pg equivalent. Those endpoints now return 501 with a
// clear marker so the frontend's existing /api/backoffice/* callsites
// fail fast until auth is wired in.
//
// Auth gate is still applied first so unauthenticated callers see 401,
// preserving the contract the existing smoke test asserts.
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

const router = express.Router();

router.use(authenticateToken);

router.all(
  ['/backoffice/*', '/admin/*'],
  requireRole('super_admin'),
  (_req, res) => {
    res.status(501).json({
      error: {
        code: 'NOT_IMPLEMENTED',
        message:
          'Backoffice operations need to be re-wired against the new auth provider.',
      },
    });
  },
);

module.exports = router;
