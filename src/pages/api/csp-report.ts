// CSP violation reporting endpoint
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type');

    if (
      !contentType?.includes('application/csp-report') &&
      !contentType?.includes('application/json')
    ) {
      return new Response('Invalid content type', { status: 400 });
    }

    const body = await request.json();
    const violation = body['csp-report'] || body;

    // Log CSP violation for monitoring
    console.warn('CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
      originalPolicy: violation['original-policy'],
      userAgent: request.headers.get('user-agent'),
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip'),
    });

    // In production, you might want to:
    // 1. Store violations in a database
    // 2. Send alerts for critical violations
    // 3. Aggregate violation data for analysis
    // 4. Filter out known false positives

    return new Response('OK', { status: 204 });
  } catch (error) {
    console.error('CSP report processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
