// Logout API endpoint
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getUserFromRequest } from '../../../middleware/auth';

export const POST: APIRoute = async (context) => {
  try {
    // Get current user
    const user = await getUserFromRequest(context.request);

    if (user) {
      // Invalidate session in database
      const cookies = context.request.headers.get('cookie');
      const sessionMatch = cookies?.match(/session-token=([^;]+)/);
      const sessionToken = sessionMatch?.[1];

      if (sessionToken) {
        await supabase.from('user_sessions').delete().eq('session_token', sessionToken);
      }

      // Sign out from Supabase Auth
      await supabase.auth.signOut();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'session-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
        },
      }
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Logout error:', error);
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
