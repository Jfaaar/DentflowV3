// Auth middleware. Two modes:
//
//   1. BACKEND_DEV_AUTH=true (or NODE_ENV !== 'production' AND no
//      SUPABASE_URL set) → DEV BYPASS. Skips token validation, attaches
//      a synthesized req.user matching the dev seed in
//      backend/db/init/99_dev_seed.sql, and attaches the local pg pool
//      as req.db. Pairs with the demo/demo bypass on the frontend.
//
//   2. Supabase token mode (default in production). Validates the
//      Bearer JWT via supabaseAuth.auth.getUser(), reads the profile,
//      attaches req.user. The user-scoped Supabase client is exposed
//      as req.supabase for repositories that haven't been rewritten to
//      pg yet (rewriting them is in flight — see patientsRepository as
//      the template).
//
// Either mode also attaches req.db (the pg pool) so repositories that
// have been migrated to plain Postgres work uniformly.
const { supabaseAuth, supabaseAdmin } = require('../lib/supabase');
const { makeUserClient } = require('../db/supabase');
const { getPool } = require('../db/pg');

const DEV_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@dentflow.local',
  role: 'clinic_admin',
  name: 'Demo User',
  clinicId: '00000000-0000-0000-0000-0000000000c1',
};

function devAuthEnabled() {
  // Tests always exercise the real auth gate (the existing supertest specs
  // assert 401 on unauthenticated requests).
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return false;
  if (process.env.BACKEND_DEV_AUTH === 'true') return true;
  if (process.env.BACKEND_DEV_AUTH === 'false') return false;
  // Auto-on in non-production when Supabase isn't configured.
  return process.env.NODE_ENV !== 'production' && !process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL;
}

async function authenticateToken(req, res, next) {
  // ── Dev bypass ───────────────────────────────────────────────────────────
  if (devAuthEnabled()) {
    req.user = DEV_USER;
    req.db = getPool();
    return next();
  }

  // ── Supabase JWT mode ────────────────────────────────────────────────────
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
  }

  if (!supabaseAuth || !supabaseAdmin) {
    return res.status(500).json({ error: { code: 'AUTH_UNCONFIGURED', message: 'Auth not configured' } });
  }

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      // eslint-disable-next-line no-console
      console.error('Auth error:', error?.message);
      return res.status(403).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, name, clinic_id')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'assistant',
      name: profile?.name || user.email,
      clinicId: profile?.clinic_id || null,
    };

    req.supabase = makeUserClient(token);
    req.db = getPool();

    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Token validation error:', err);
    return res.status(500).json({ error: { code: 'AUTH_SERVER_ERROR', message: 'Auth server error' } });
  }
}

module.exports = { authenticateToken };
