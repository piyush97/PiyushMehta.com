/**
 * Reports clicks on `[data-conversion]` links and one view per post per session.
 * The click listener is delegated once; post views re-check on `astro:page-load` for client navigation.
 */
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

  reportPostView();
  document.addEventListener('astro:page-load', reportPostView);
}

/** Reports the current post once per session; a missing slug means this is not a post page. */
function reportPostView(): void {
  const slug = document.querySelector<HTMLElement>('[data-post-slug]')?.dataset.postSlug;
  if (!slug) return;
  const seenKey = `conversion:post_view:${slug}`;
  try {
    if (sessionStorage.getItem(seenKey)) return;
  } catch {
    // Storage is unavailable: report without the session guard.
  }
  try {
    navigator.sendBeacon(
      '/api/conversions',
      new Blob([JSON.stringify({ event: 'post_view', post: slug })], { type: 'text/plain' }),
    );
  } catch {
    // Counting must never block the page.
    return;
  }
  try {
    sessionStorage.setItem(seenKey, '1');
  } catch {
    // Storage is unavailable: a navigation reports the view again.
  }
}
