import { chromium } from '@playwright/test';

async function debugReadingProgress() {
  console.log('🔍 Starting Reading Progress Component Debug...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to a blog post
    console.log('📍 Navigating to blog post...');
    await page.goto(
      'http://localhost:4322/blog/macos-to-arch-linux-omarchy-developer-productivity/'
    );
    await page.waitForLoadState('networkidle');

    // Check if reading progress components exist
    console.log('\n🔎 Checking component existence...');
    const progressContainer = await page.locator('#reading-progress-container');
    const progressBar = await page.locator('#reading-progress-bar');
    const readingInfo = await page.locator('#reading-info');

    console.log('Progress Container exists:', (await progressContainer.count()) > 0);
    console.log('Progress Bar exists:', (await progressBar.count()) > 0);
    console.log('Reading Info exists:', (await readingInfo.count()) > 0);

    // Check initial visibility states
    console.log('\n👁️ Checking initial visibility...');
    if ((await progressContainer.count()) > 0) {
      const containerStyles = await progressContainer.evaluate((el) => ({
        display: getComputedStyle(el).display,
        visibility: getComputedStyle(el).visibility,
        opacity: getComputedStyle(el).opacity,
        position: getComputedStyle(el).position,
        zIndex: getComputedStyle(el).zIndex,
      }));
      console.log('Container styles:', containerStyles);
    }

    if ((await progressBar.count()) > 0) {
      const barStyles = await progressBar.evaluate((el) => ({
        display: getComputedStyle(el).display,
        visibility: getComputedStyle(el).visibility,
        opacity: getComputedStyle(el).opacity,
        width: getComputedStyle(el).width,
        height: getComputedStyle(el).height,
      }));
      console.log('Bar styles:', barStyles);

      const isVisible = await progressBar.isVisible();
      console.log('Progress bar isVisible():', isVisible);
    }

    // Check if this is detected as a blog post
    console.log('\n📝 Checking blog post detection...');
    const isBlogPost = await page.evaluate(() => {
      return (
        window.location.pathname.includes('/blog/') &&
        window.location.pathname !== '/blog/' &&
        !window.location.pathname.endsWith('/blog')
      );
    });
    console.log('Is detected as blog post:', isBlogPost);

    // Check if article content is found
    console.log('\n📄 Checking article content detection...');
    const articleSelectors = [
      'article',
      'main article',
      '[data-pagefind-body]',
      '.prose',
      '.blog-content',
      '.post-content',
      'main',
    ];

    for (const selector of articleSelectors) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        const hasContent = await element.first().evaluate((el) => {
          const textContent = el.textContent || '';
          const wordCount = textContent.trim().split(/\s+/).length;
          return { wordCount, hasSubstantial: wordCount > 100 };
        });
        console.log(`${selector}: found ${count}, content:`, hasContent);
      }
    }

    // Check JavaScript errors
    console.log('\n⚠️ Checking for JavaScript errors...');
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any errors to surface
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('JavaScript errors found:');
      errors.forEach((error) => console.log('  -', error));
    } else {
      console.log('No JavaScript errors detected');
    }

    // Test scrolling behavior
    console.log('\n🖱️ Testing scroll behavior...');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    if ((await progressBar.count()) > 0) {
      const afterScrollStyles = await progressBar.evaluate((el) => ({
        visibility: getComputedStyle(el).visibility,
        opacity: getComputedStyle(el).opacity,
        width: el.style.width,
        computedWidth: getComputedStyle(el).width,
      }));
      console.log('After scroll styles:', afterScrollStyles);
      const isVisibleAfterScroll = await progressBar.isVisible();
      console.log('Progress bar visible after scroll:', isVisibleAfterScroll);
    }

    // Test component initialization
    console.log('\n🚀 Testing component initialization...');
    const readingProgressInstance = await page.evaluate(() => {
      return (
        typeof window !== 'undefined' &&
        document.querySelector('#reading-progress-container') !== null
      );
    });
    console.log('Component initialized:', readingProgressInstance);

    console.log('\n✅ Debug complete!');
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugReadingProgress().catch(console.error);
