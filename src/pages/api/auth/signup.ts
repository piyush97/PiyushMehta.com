// Signup API endpoint
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getClientIP } from '../../../middleware/auth';
import { apiRateLimit } from '../../../middleware/rateLimit';

export const POST: APIRoute = async (context) => {
  try {
    const { email, password, name } = await context.request.json();

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'Email, password, and name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Apply rate limiting
    await apiRateLimit(context);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'An account with this email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          name: name.trim(),
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=3b82f6`,
        },
      },
    });

    if (authError) {
      if (import.meta.env.DEV) {
        console.error('Supabase signup error:', authError);
      }
      return new Response(
        JSON.stringify({ error: authError.message || 'Failed to create account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'Failed to create account' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create user record in our users table
    const _ipAddress = getClientIP(context.request);
    const { error: userInsertError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: email.toLowerCase(),
      name: name.trim(),
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=3b82f6`,
      is_admin: false,
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      login_count: 0,
      consent_analytics: false,
      consent_marketing: false,
      data_retention_agreed: false,
    });

    if (userInsertError) {
      if (import.meta.env.DEV) {
        console.error('User insert error:', userInsertError);
      }
      // Try to clean up auth user if our user insert failed
      await supabase.auth.admin.deleteUser(authData.user.id);

      return new Response(JSON.stringify({ error: 'Failed to create user profile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
        user: {
          id: authData.user.id,
          email: email.toLowerCase(),
          name: name.trim(),
          email_verified: false,
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Signup error:', error);
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
