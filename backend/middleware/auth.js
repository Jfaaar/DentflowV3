// Auth middleware. Two modes:
//
//   1. Dev bypass (default in non-production). Skips token validation,
//      attaches a synthesized clinic_admin user matching the dev seed in
//      backend/db/init/99_dev_seed.sql, and attaches the local pg pool
//      as req.db. Pairs with the demo/demo bypass on the frontend.
//
//   2. JWT mode. When BACKEND_DEV_AUTH=false (or NODE_ENV=production),
//      the middleware verifies a Bearer JWT signed with JWT_SECRET and
//      reads { sub, email, role, clinic_id } from the payload to populate
//      req.user. This stub will be wired to a real auth provider later.
//      For now, any well-formed token signed with the right secret works.
//
// Either mode attaches req.db (the pg pool) so repositories work uniformly.
const jwt = require('jsonwebtoken');
const { getPool } = require('../db/pg');

const DEV_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@medineeo.local',
  role: 'clinic_admin',
  name: 'Demo User',
  clinicId: '00000000-0000-0000-0000-0000000000c1',
};

function devAuthEnabled() {
  // Tests always exercise the real auth gate.
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return false;
  if (process.env.BACKEND_DEV_AUTH === 'true') return true;
  if (process.env.BACKEND_DEV_AUTH === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

async function authenticateToken(req, res, next) {
  // ── Dev bypass ───────────────────────────────────────────────────────────
  if (devAuthEnabled()) {
    req.user = DEV_USER;
    req.db = getPool();
    return next();
  }

  // ── JWT mode ─────────────────────────────────────────────────────────────
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({
      error: { code: 'AUTH_UNCONFIGURED', message: 'JWT_SECRET is not set' },
    });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = {
      id: payload.sub || payload.id,
      email: payload.email,
      role: payload.role || 'assistant',
      name: payload.name || payload.email,
      clinicId: payload.clinic_id || payload.clinicId || null,
    };
    req.db = getPool();
    return next();
  } catch (err) {
    return res.status(403).json({
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    });
  }
}

module.exports = { authenticateToken };
