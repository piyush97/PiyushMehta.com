/**
 * Astro Middleware Entry Point
 *
 * Astro looks for middleware at src/middleware/index.ts.
 * This file chains all middleware modules together.
 */

import { sequence } from 'astro/middleware';
import { onRequest as markdownNegotiation } from './markdown';
import { onRequest as securityHeaders } from './security';

export const onRequest = sequence(markdownNegotiation, securityHeaders);

export default onRequest;
