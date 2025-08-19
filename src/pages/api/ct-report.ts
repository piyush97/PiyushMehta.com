// Certificate Transparency violation reporting endpoint
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Log Certificate Transparency violation
    console.warn('Certificate Transparency Violation:', {
      timestamp: new Date().toISOString(),
      hostname: body.hostname,
      port: body.port,
      effectiveExpirationDate: body['effective-expiration-date'],
      servedCertificateChain: body['served-certificate-chain'],
      validatedCertificateChain: body['validated-certificate-chain'],
      scts: body.scts,
      userAgent: request.headers.get('user-agent'),
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip'),
    });

    // In production, you might want to:
    // 1. Alert security team immediately
    // 2. Store violations for compliance reporting
    // 3. Integrate with certificate monitoring tools
    // 4. Trigger certificate renewal if needed

    return new Response('OK', { status: 204 });
  } catch (error) {
    console.error('CT report processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
