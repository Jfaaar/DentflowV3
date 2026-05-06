// Supabase token validation middleware.
// Mirrors the original `authenticateToken` from server/index.js but is now reusable.
const { supabaseAuth, supabaseAdmin } = require('../lib/supabase');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if (!supabaseAuth || !supabaseAdmin) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      // eslint-disable-next-line no-console
      console.error('Auth error:', error?.message);
      return res.status(403).json({ error: 'Invalid token' });
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

    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Token validation error:', err);
    return res.status(500).json({ error: 'Auth server error' });
  }
}

module.exports = { authenticateToken };
