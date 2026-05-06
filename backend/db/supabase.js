// Per-request Supabase client factory.
//
// `makeUserClient(token)` returns a Supabase client whose Authorization header
// is the user's access token, so RLS policies (`auth.uid()`, `auth.jwt()`)
// resolve to that user. This is the client repositories should use by default.
//
// `getAdminClient()` returns the service-role client. ONLY backofficeRepository
// is permitted to import it (for legitimate cross-tenant queries). Other
// repositories must use the user-scoped client.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'frontend', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function makeUserClient(token) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase env not configured (SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

let adminClient = null;
function getAdminClient() {
  if (adminClient) return adminClient;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Service-role env not configured (SUPABASE_SERVICE_ROLE_KEY)');
  }
  adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

module.exports = { makeUserClient, getAdminClient };
