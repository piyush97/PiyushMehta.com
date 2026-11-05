const ALLOWED_FORM_ORIGINS = new Set([
  'https://piyushmehta.com',
  'http://localhost:4321',
  'http://localhost:3000',
]);

/** Reads at most `max` bytes, including bodies without Content-Length. */
export async function readLimitedText(request: Request, max: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > max) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const all = new Uint8Array(size);
    let at = 0;
    for (const chunk of chunks) {
      all.set(chunk, at);
      at += chunk.byteLength;
    }
    return new TextDecoder().decode(all);
  } finally {
    reader.releaseLock();
  }
}

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
