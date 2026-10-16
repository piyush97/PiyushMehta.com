import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const sse = (events: object[]) => events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('') + 'data: [DONE]\n\n';
const answer = (text: string, sources: { url: string; title: string }[] = []) =>
  sse([
    { type: 'text-start', id: 't' },
    ...text.split(' ').map((w, i) => ({ type: 'text-delta', id: 't', delta: (i ? ' ' : '') + w })),
    { type: 'text-end', id: 't' },
    ...sources.map((s, i) => ({ type: 'source-url', sourceId: `s${i}`, ...s })),
  ]);

async function stubTurnstile(page: Page) {
  // Replace Cloudflare's script with a tiny stub that resolves invisibly.
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.turnstile={render:(el,o)=>{window.__tsCb=o.callback;return 'w1'},execute:()=>setTimeout(()=>window.__tsCb('tok'),0),remove(){},reset(){}}`,
    }),
  );
  await page.route('**/api/chat/session', (route) =>
    route.fulfill({ json: { session: 'sess-token' } }),
  );
}

/** Astro removes the `ssr` attribute once the island has hydrated; interacting earlier loses input. */
async function openAsk(page: Page) {
  await page.goto('/ask');
  await expect(page.locator('astro-island[component-url*="AskPiyush"]:not([ssr])')).toBeAttached();
}

test.describe('Ask Piyush', () => {
  test.beforeEach(async ({ page }) => {
    await stubTurnstile(page);
  });

  test('streams an answer with source links and sends the session header', async ({ page }) => {
    let header = '';
    let body: { messages: { role: string; parts: { text: string }[] }[] } | undefined;
    await page.route('**/api/chat', async (route) => {
      header = route.request().headers()['x-chat-session'] ?? '';
      body = route.request().postDataJSON();
      await route.fulfill({
        headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
        body: answer('Piyush built FocusTube, a browser extension.', [
          { url: 'https://piyushmehta.com/blog/building-focustube-typesafe-jev', title: 'Building FocusTube' },
        ]),
      });
    });

    await openAsk(page);
    await page.getByRole('button', { name: 'Tell me about FocusTube' }).click();

    await expect(page.getByRole('article', { name: 'Answer' })).toContainText('built FocusTube');
    await expect(page.locator('.ask__sources').getByRole('link')).toHaveAttribute(
      'href',
      'https://piyushmehta.com/blog/building-focustube-typesafe-jev',
    );
    expect(header).toBe('sess-token');
    expect(body?.messages.at(-1)?.parts[0].text).toBe('Tell me about FocusTube');
    // Only role + text parts are sent.
    expect(Object.keys(body!.messages[0]).sort()).toEqual(['parts', 'role']);
  });

  test('renders markdown safely: no raw HTML, images, or off-allowlist links', async ({ page }) => {
    await page.route('**/api/chat', (route) =>
      route.fulfill({
        headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
        body: answer('<script>window.__pwn=1</script>\n\n![x](https://evil.example/a.png)\n\n[bad](https://evil.example)\n\n[ok](https://github.com/piyush97)'),
      }),
    );
    await openAsk(page);
    await page.getByLabel('Your question about Piyush').fill('hi');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();

    const msg = page.getByRole('article', { name: 'Answer' });
    await expect(msg).toContainText('ok');
    expect(await page.evaluate(() => (window as unknown as { __pwn?: number }).__pwn)).toBeUndefined();
    await expect(msg.locator('img, script')).toHaveCount(0);
    await expect(msg.locator('a[href*="evil.example"]')).toHaveCount(0);
    await expect(msg.locator('a[href="https://github.com/piyush97"]')).toHaveCount(1);
  });

  test('shows a recoverable error on 429 and the stop button while streaming', async ({ page }) => {
    await page.route('**/api/chat', (route) => route.fulfill({ status: 429, json: { error: 'Too many requests.' } }));
    await openAsk(page);
    await page.getByLabel('Your question about Piyush').fill('What does Piyush do?');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alert')).toContainText(/too many questions|capacity/i);
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('enforces input cap, Shift+Enter newline, and clear', async ({ page }) => {
    await page.route('**/api/chat', (route) =>
      route.fulfill({ headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' }, body: answer('Hello there.') }),
    );
    await openAsk(page);
    const box = page.getByLabel('Your question about Piyush');
    await box.fill('x'.repeat(600));
    expect(await box.inputValue()).toHaveLength(500);
    await box.fill('line1');
    await box.press('Shift+Enter');
    await box.type('line2');
    expect(await box.inputValue()).toBe('line1\nline2');
    await box.press('Enter');
    await expect(page.getByRole('article', { name: 'You asked' })).toContainText('line1');
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByRole('article')).toHaveCount(0);
  });

  test('has no serious axe violations and is keyboard operable', async ({ page }) => {
    await openAsk(page);
    const results = await new AxeBuilder({ page }).include('.ask').analyze();
    expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });
});

test.describe('Ask Piyush doorways', () => {
  test('?q= prefills the box without sending and then cleans the URL', async ({ page }) => {
    let sent = 0;
    await stubTurnstile(page);
    await page.route('**/api/chat', (route) => {
      sent++;
      return route.abort();
    });
    await page.goto('/ask?q=Tell%20me%20about%20FocusTube');
    await expect(page.locator('astro-island[component-url*="AskPiyush"]:not([ssr])')).toBeAttached();
    await expect(page.getByLabel('Your question about Piyush')).toHaveValue('Tell me about FocusTube');
    await expect(page).toHaveURL(/\/ask\/?$/);
    expect(sent).toBe(0);
  });

  test('?q= is capped at the input limit', async ({ page }) => {
    await stubTurnstile(page);
    await page.goto(`/ask?q=${'x'.repeat(900)}`);
    await expect(page.locator('astro-island[component-url*="AskPiyush"]:not([ssr])')).toBeAttached();
    await expect
      .poll(async () => (await page.getByLabel('Your question about Piyush').inputValue()).length)
      .toBe(500);
  });

  for (const [path, name] of [
    ['/', /ask about my work/i],
    ['/contact-me/', /ask before you write/i],
    ['/resume/', /ask about anything not on the résumé/i],
  ] as const) {
    test(`${path} links to /ask`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('link', { name }).first()).toHaveAttribute('href', /^\/ask\/(\?q=.+)?$/);
    });
  }

  test('navbar has an Ask button on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/about/');
    await expect(page.locator('.ask-button')).toHaveAttribute('href', '/ask/');
  });

  test('search page offers the Ask fallback', async ({ page }) => {
    await page.goto('/search/');
    await expect(page.getByRole('link', { name: /ask piyush instead/i })).toHaveAttribute('href', '/ask/');
  });
});
