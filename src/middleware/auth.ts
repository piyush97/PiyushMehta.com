// Authentication middleware for Astro
import type { APIContext } from 'astro';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  is_admin?: boolean;
  email_verified?: boolean;
}

interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
}

export interface AuthContext extends APIContext {
  user?: AuthUser;
  isAuthenticated: boolean;
}

/**
 * Get user from session token
 */
export async function getUserFromSession(sessionToken?: string): Promise<AuthUser | null> {
  if (!sessionToken) return null;

  try {
    // Verify JWT token
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as JWTPayload;

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.sub)
      .single();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      avatar_url: user.avatar_url || undefined,
      is_admin: user.is_admin,
      email_verified: user.email_verified,
    };
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

/**
 * Get user from request cookies
 */
export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;

  // Parse session token from cookies
  const sessionMatch = cookies.match(/session-token=([^;]+)/);
  const sessionToken = sessionMatch?.[1];

  return getUserFromSession(sessionToken);
}

/**
 * Require authentication middleware
 */
export async function requireAuth(context: APIContext): Promise<AuthUser> {
  const user = await getUserFromRequest(context.request);

  if (!user) {
    throw new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return user;
}

/**
 * Require admin middleware
 */
export async function requireAdmin(context: APIContext): Promise<AuthUser> {
  const user = await requireAuth(context);

  if (!user.is_admin) {
    throw new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return user;
}

/**
 * Create session token
 */
export function createSessionToken(userId: string): string {
  return jwt.sign(
    {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    },
    process.env.JWT_SECRET!
  );
}

/**
 * Get client IP address
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();

  return '127.0.0.1';
}

/**
 * Enhanced context with authentication
 */
export async function withAuth(context: APIContext): Promise<AuthContext> {
  const user = await getUserFromRequest(context.request);

  return {
    ...context,
    user: user || undefined,
    isAuthenticated: !!user,
  };
}
