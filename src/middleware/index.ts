/**
 * Astro Middleware Entry Point
 *
 * Astro looks for middleware at src/middleware/index.ts.
 * This file chains all middleware modules together.
 */

import { sequence } from 'astro/middleware';
import { onRequest as securityHeaders } from './security';

export const onRequest = sequence(securityHeaders);

export default onRequest;
