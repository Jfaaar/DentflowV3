// Supabase token validation middleware.
// Validates the Bearer access token, attaches req.user and req.supabase.
//
// req.supabase is a per-request user-scoped Supabase client whose Authorization
// header is the validated token, so RLS still applies in repositories.
const { supabaseAuth, supabaseAdmin } = require('../lib/supabase');
const { makeUserClient } = require('../db/supabase');

async function authenticateToken(req, res, next) {
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

    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Token validation error:', err);
    return res.status(500).json({ error: { code: 'AUTH_SERVER_ERROR', message: 'Auth server error' } });
  }
}

module.exports = { authenticateToken };
