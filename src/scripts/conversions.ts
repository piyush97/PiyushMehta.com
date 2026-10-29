/** Reports clicks on `[data-conversion]` links. Delegated once, so client navigation needs no re-init. */
export function initConversionBeacon(): void {
  document.addEventListener('click', (e) => {
    const target = (e.target as Element | null)?.closest<HTMLElement>('[data-conversion]');
    const event = target?.dataset.conversion;
    if (!event) return;
    try {
      navigator.sendBeacon(
        '/api/conversions',
        new Blob([JSON.stringify({ event })], { type: 'text/plain' }),
      );
    } catch {
      // Counting must never block the click.
    }
  });
}
