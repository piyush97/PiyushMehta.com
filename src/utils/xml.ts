/** JSON embedded in a script element must not contain HTML opening delimiters. */
export function serializeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/** Escape text and quoted attributes interpolated into RSS or sitemap XML. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
