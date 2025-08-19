// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

if (!import.meta.env.PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.PUBLIC_SUPABASE_URL');
}

if (!import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'piyushmehta.com@3.2.0',
      },
    },
  }
);

let supabaseAdmin: ReturnType<typeof createClient<Database>> | undefined;

if (import.meta.env.PROD && import.meta.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Service role client for admin operations
  supabaseAdmin = createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export { supabaseAdmin };

// Export types for convenience
export type { Database } from '../types/database';
