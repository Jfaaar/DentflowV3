import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Environment check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        mode: import.meta.env.MODE,
        allEnvKeys: Object.keys(import.meta.env)
    });
    throw new Error(`Missing Supabase environment variables. VITE_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}, VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
