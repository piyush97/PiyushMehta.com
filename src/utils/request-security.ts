const ALLOWED_FORM_ORIGINS = new Set([
  'https://piyushmehta.com',
  'http://localhost:4321',
  'http://localhost:3000',
]);

function requestOrigin(request: Request): string {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const referer = request.headers.get('referer');
  if (!referer) return '';
  try {
    return new URL(referer).origin;
  } catch {
    return '';
  }
}

export function isAllowedFormOrigin(request: Request): boolean {
  const origin = requestOrigin(request);
  if (ALLOWED_FORM_ORIGINS.has(origin)) return true;

  try {
    // Preview and local Worker hostnames are trusted only when the browser
    // origin matches the URL the request was actually sent to.
    return new URL(request.url).origin === origin;
  } catch {
    return false;
  }
}
