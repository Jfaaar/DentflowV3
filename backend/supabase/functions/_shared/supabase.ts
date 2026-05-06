// @ts-nocheck
// -----------------------------------------------------------------------------
// Shared Supabase client for Edge Functions.
//
// Edge Functions run on Deno. They are NOT compiled by the project's tsconfig,
// so the `// @ts-nocheck` above keeps the project-wide `npm run typecheck`
// happy without dragging Deno typings into package.json.
//
// At runtime, Deno.env supplies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// out of the box for every Edge Function project, so no extra setup is
// required to deploy.
// -----------------------------------------------------------------------------

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '[edge:_shared/supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env',
  );
}

/**
 * Service-role client for Edge Functions. Bypasses RLS — use only inside
 * trusted server-side code (cron, webhooks).
 */
export const serviceClient: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
