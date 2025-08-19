// GDPR consent tracking API
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { getClientIP, getUserFromRequest } from '../../middleware/auth';
import { apiRateLimit } from '../../middleware/rateLimit';

export const POST: APIRoute = async (context) => {
  try {
    // Apply rate limiting
    await apiRateLimit(context);

    const { preferences, privacyPolicyVersion } = await context.request.json();

    if (!preferences || !privacyPolicyVersion) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user if authenticated, otherwise track by IP
    const user = await getUserFromRequest(context.request);
    const ipAddress = getClientIP(context.request);

    // Save consent to database
    const { data, error } = await supabase
      .from('gdpr_consents')
      .insert({
        user_id: user?.id || null,
        ip_address: ipAddress,
        consent_analytics: preferences.analytics || false,
        consent_marketing: preferences.marketing || false,
        consent_functional: preferences.functional !== false, // Default true
        data_retention_agreed: preferences.dataRetention || false,
        privacy_policy_version: privacyPolicyVersion,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error saving GDPR consent:', error);
      }
      return new Response(JSON.stringify({ error: 'Failed to save consent' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Consent preferences saved successfully',
        consentId: data.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('GDPR consent API error:', error);
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async (context) => {
  try {
    // Get user consent history
    const user = await getUserFromRequest(context.request);
    const ipAddress = getClientIP(context.request);

    let query = supabase
      .from('gdpr_consents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('ip_address', ipAddress);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      // Not found is okay
      if (import.meta.env.DEV) {
        console.error('Error fetching GDPR consent:', error);
      }
      return new Response(JSON.stringify({ error: 'Failed to fetch consent' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        consent: data || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('GDPR consent fetch error:', error);
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
