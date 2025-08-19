// Login API endpoint
import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../lib/supabase';
import { createSessionToken, getClientIP } from '../../../middleware/auth';
import { loginRateLimit } from '../../../middleware/rateLimit';

export const POST: APIRoute = async (context) => {
  try {
    const { email, password } = await context.request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting
    await loginRateLimit(context, email);

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For now, we'll use Supabase Auth instead of manual password hashing
    // This is a placeholder for manual auth - we'll use Supabase Auth in production
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password,
    });

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update login statistics
    const ipAddress = getClientIP(context.request);
    await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        login_count: user.login_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Create session token
    const sessionToken = createSessionToken(user.id);

    // Store session in database
    await supabase.from('user_sessions').insert({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      ip_address: ipAddress,
      user_agent: context.request.headers.get('user-agent') || 'Unknown',
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          is_admin: user.is_admin,
        },
        sessionToken,
        message: 'Login successful',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session-token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}; Path=/`,
        },
      }
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Login error:', error);
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
