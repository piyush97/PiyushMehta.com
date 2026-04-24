import { expect, test } from "@playwright/test";

test.describe("astro v6 migration smoke", () => {
  test("core routes render", async ({ page }) => {
    for (const route of ["/", "/blog/", "/projects/"]) {
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.ok(), `${route} should return success`).toBeTruthy();
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(page.locator("h1").first()).toBeVisible();
    }
  });

  test("blog detail routes resolve from index links", async ({ page }) => {
    await page.goto("/blog/", { waitUntil: "networkidle" });

    const postLink = page.locator('a[href^="/blog/"]').first();
    test.skip((await postLink.count()) === 0, "No blog links found on /blog/");

    const href = await postLink.getAttribute("href");
    expect(href).toBeTruthy();
    await postLink.click();
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/blog/");
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("blog index shows non-zero published pieces", async ({ page }) => {
    await page.goto("/blog/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/\d+\s+published pieces/i)).toBeVisible();
    await expect(page.getByText(/^0\s+published pieces$/i)).toHaveCount(0);
  });

  test("blog filters hydrate from URL query params", async ({ page }) => {
    await page.goto("/blog/?q=astro&sort=title&order=asc", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#blog-search")).toHaveValue("astro");
    await expect(page.locator("[data-filter-sort]")).toHaveValue("title");
    await expect(page.locator("[data-filter-order]")).toHaveValue("asc");
  });

  test("rss and sitemap return xml", async ({ request }) => {
    const rss = await request.get("/rss.xml");
    expect(rss.ok()).toBeTruthy();
    expect(rss.headers()["content-type"] || "").toContain("xml");
    expect(await rss.text()).toContain("<rss");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(sitemap.headers()["content-type"] || "").toContain("xml");
    expect(await sitemap.text()).toContain("<urlset");
  });

  test("service worker artifact available", async ({ request }) => {
    const sw = await request.get("/sw.js");
    expect(sw.ok()).toBeTruthy();
    expect(sw.headers()["content-type"] || "").toContain("javascript");
  });
});
