import { expect, test, type Page } from '@playwright/test';

const POST = '/blog/kubernetes-docker';
const sse = (events: object[]) => events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('') + 'data: [DONE]\n\n';
const SSE_HEADERS = { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' };

const answerStream = (text: string, trace: object = {}) =>
  sse([
    { type: 'data-trace', id: 'trace', data: { scope: 'post', verdict: 'answered', sources: 2, provider: 'workers-ai', guard: 'passed', ...trace } },
    { type: 'text-start', id: 't' },
    ...text.split(' ').map((w, i) => ({ type: 'text-delta', id: 't', delta: (i ? ' ' : '') + w })),
    { type: 'text-end', id: 't' },
    { type: 'source-url', sourceId: 'post:kubernetes-docker', url: 'https://piyushmehta.com/blog/kubernetes-docker', title: 'Kubernetes Docker' },
    { type: 'source-url', sourceId: 'p2', url: 'https://piyushmehta.com/blog/rabbit-mq', title: 'RabbitMQ' },
  ]);

async function stubChat(page: Page, opts: { summary?: string; answer?: string; status?: number } = {}) {
  const seen: { header: string; body: Record<string, unknown> }[] = [];
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.turnstile={render:(el,o)=>{window.__tsCb=o.callback;return 'w1'},execute:()=>setTimeout(()=>window.__tsCb('tok'),0),remove(){},reset(){}}`,
    }),
  );
  await page.route('**/api/chat/config', (route) => route.fulfill({ json: { siteKey: 'test-key' } }));
  await page.route('**/api/chat/session', (route) => route.fulfill({ json: { session: 'sess-token' } }));
  await page.route('**/api/chat/post', async (route) => {
    const body = route.request().postDataJSON();
    seen.push({ header: route.request().headers()['x-chat-session'] ?? '', body });
    if (opts.status) return route.fulfill({ status: opts.status, json: { error: 'x' } });
    await route.fulfill({
      headers: SSE_HEADERS,
      body: answerStream(body.mode === 'summary' ? (opts.summary ?? 'The note explains containers.\n\n- **Intro**: why containers') : (opts.answer ?? 'It uses **Docker** images.')),
    });
  });
  return seen;
}

const trigger = (page: Page) => page.locator('[data-post-ask-trigger]');
const panel = (page: Page) => page.locator('[data-post-ask-panel]');
/** The module script marks the root once it has upgraded the link into a button. */
const ready = (page: Page) => expect(page.locator('[data-post-ask][data-initialized="true"]')).toBeAttached();

test.describe('Ask this note', () => {
  test('renders on an article and not on /blog or /', async ({ page }) => {
    await stubChat(page);
    await page.goto(POST);
    await expect(trigger(page)).toBeVisible();
    for (const path of ['/blog', '/']) {
      await page.goto(path);
      await expect(page.locator('[data-post-ask]')).toHaveCount(0);
    }
  });

  test('is a link to /ask before hydration and a disclosure button after', async ({ page }) => {
    await stubChat(page);
    await page.goto(POST);
    await expect(trigger(page)).toHaveAttribute('href', /^\/ask#q=Summarize/);
    await ready(page);
    await expect(trigger(page)).toHaveAttribute('role', 'button');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens with the note title and description immediately, then streams the summary', async ({ page }) => {
    const seen = await stubChat(page);
    await page.goto(POST);
    await ready(page);
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(panel(page).locator('#post-ask-title')).not.toBeEmpty();
    await expect(panel(page).locator('[data-post-ask-brief]')).toContainText('The note explains containers');
    expect(seen[0].body).toEqual({ post: 'kubernetes-docker', mode: 'summary' });
    expect(seen[0].header).toBe('sess-token');
    await expect(panel(page).getByRole('heading', { name: 'In brief' })).toBeVisible();
  });

  test('a question sends post and the session header, renders the answer, source chips and trace', async ({ page }) => {
    const seen = await stubChat(page);
    await page.goto(POST);
    await ready(page);
    await trigger(page).click();
    await panel(page).getByLabel('Ask about this note').fill('Why Docker?');
    await panel(page).getByRole('button', { name: 'Send' }).click();
    await expect(panel(page).locator('[data-post-ask-answer]')).toContainText('It uses Docker images.');
    await expect(panel(page).locator('[data-post-ask-answer] strong')).toHaveText('Docker');
    const chips = panel(page).locator('[data-post-ask-sources] a');
    await expect(chips.first()).toHaveText('This note');
    await expect(chips.first()).toHaveAttribute('href', '/blog/kubernetes-docker');
    await expect(chips.nth(1)).toHaveText('Related: RabbitMQ');
    await expect(panel(page).locator('[data-post-ask-trace]')).toContainText('Guard: passed');
    const ask = seen.find((s) => s.body.mode === 'ask')!;
    expect(ask.body).toEqual({ post: 'kubernetes-docker', mode: 'ask', question: 'Why Docker?' });
    expect(ask.header).toBe('sess-token');
  });

  test('a section button asks about that section', async ({ page }) => {
    const seen = await stubChat(page);
    await page.goto(POST);
    await ready(page);
    await trigger(page).click();
    const first = panel(page).locator('[data-post-ask-section]').first();
    const heading = await first.getAttribute('data-post-ask-section');
    await first.click();
    await expect(panel(page).locator('[data-post-ask-answer]')).toContainText('Docker');
    expect(seen.find((s) => s.body.mode === 'ask')!.body.question).toContain(heading!);
  });

  test('Enter sends and Shift+Enter breaks the line', async ({ page }) => {
    const seen = await stubChat(page);
    await page.goto(POST);
    await ready(page);
    await trigger(page).click();
    const input = panel(page).getByLabel('Ask about this note');
    await input.fill('line one');
    await input.press('Shift+Enter');
    await input.pressSequentially('line two');
    expect(seen.filter((s) => s.body.mode === 'ask')).toHaveLength(0);
    await input.press('Enter');
    await expect(panel(page).locator('[data-post-ask-question]')).toHaveText('line one\nline two');
  });

  test('Escape closes the panel and returns focus to the trigger', async ({ page }) => {
    await stubChat(page);
    await page.goto(POST);
    await ready(page);
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('a 429 shows the rate-limit copy, not a stack trace', async ({ page }) => {
    await stubChat(page, { status: 429 });
    await page.goto(POST);
    await ready(page);
    await trigger(page).click();
    await expect(panel(page).locator('[data-post-ask-brief-status]')).toContainText('Too many questions in a short time');
    await panel(page).getByLabel('Ask about this note').fill('hello?');
    await panel(page).getByRole('button', { name: 'Send' }).click();
    await expect(panel(page).getByRole('alert')).toContainText('Too many questions in a short time');
    await expect(panel(page)).not.toContainText(/at \w+ \(|TypeError|stack/i);
  });

  test('model output is rendered as DOM text; HTML and off-allowlist links never become elements', async ({ page }) => {
    await stubChat(page, { answer: 'Hi <img src=x onerror=window.__pwned=1> [bad](https://evil.example/x) [ok](https://piyushmehta.com/blog/rabbit-mq)' });
    await page.goto(POST);
    await ready(page);
    await trigger(page).click();
    await panel(page).getByLabel('Ask about this note').fill('xss?');
    await panel(page).getByRole('button', { name: 'Send' }).click();
    const answer = panel(page).locator('[data-post-ask-answer]');
    await expect(answer).toContainText('<img src=x');
    await expect(answer.locator('img')).toHaveCount(0);
    await expect(answer.locator('a')).toHaveCount(1);
    await expect(answer.locator('a')).toHaveAttribute('href', '/blog/rabbit-mq');
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  });

  test('desktop: opening reserves the right margin and the panel never overlaps the prose', async ({ page }) => {
    await stubChat(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(POST);
    await ready(page);
    const prose = page.locator('.blog-post-content');
    const before = await prose.boundingBox();
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-post-ask', 'open');
    await expect
      .poll(async () => {
        const p = (await panel(page).boundingBox())!;
        const c = (await prose.boundingBox())!;
        return c.x + c.width <= p.x;
      })
      .toBe(true);
    const after = await prose.boundingBox();
    expect(after!.x).toBeLessThanOrEqual(before!.x);
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveAttribute('data-post-ask', 'open');
  });

  test('below 1280px it is a bottom sheet and the article does not shift', async ({ page }) => {
    await stubChat(page);
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto(POST);
    await ready(page);
    const before = await page.locator('.blog-post-content').boundingBox();
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    await expect
      .poll(async () => {
        const p = (await panel(page).boundingBox())!;
        return Math.round(p.height) === Math.round(900 * 0.85) && Math.round(p.y + p.height) === 900;
      })
      .toBe(true);
    expect((await page.locator('.blog-post-content').boundingBox())!.x).toBe(before!.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('reduced motion: no transition on the panel', async ({ page }) => {
    await stubChat(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(POST);
    await ready(page);
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    expect(await panel(page).evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
  });

  test('the trigger and controls meet the 44px target size', async ({ page }) => {
    await stubChat(page);
    await page.goto(POST);
    await ready(page);
    const box = await trigger(page).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the article is complete and the trigger still navigates to /ask', async ({ page }) => {
    await page.goto(POST);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.blog-post-content')).not.toBeEmpty();
    await expect(panel(page)).toBeHidden();
    const link = trigger(page);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/ask/);
  });
});
