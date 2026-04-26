import { chromium } from '@playwright/test';

async function auditAccessibility() {
  console.log('♿ Starting Accessibility Audit...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to blog post with interactive components
    console.log('📍 Navigating to blog post with interactive components...');
    await page.goto(
      'http://localhost:4322/blog/macos-to-arch-linux-omarchy-developer-productivity/'
    );
    await page.waitForLoadState('networkidle');

    // Test 1: Check interactive components have proper ARIA labels
    console.log('\n🎯 Testing Interactive Components Accessibility...');

    // SetupShowcase component buttons
    const setupButtons = await page.locator('.command-item, [data-action], button').all();
    console.log(`Found ${setupButtons.length} interactive elements`);

    const missingLabels = [];
    const missingTypes = [];

    for (let i = 0; i < setupButtons.length; i++) {
      const button = setupButtons[i];
      const tagName = await button.evaluate((el) => el.tagName.toLowerCase());

      if (tagName === 'button') {
        // Check button type
        const type = await button.getAttribute('type');
        if (!type) {
          const text = await button.textContent();
          missingTypes.push(`Button "${text?.slice(0, 30)}..." missing type attribute`);
        }

        // Check ARIA labels or accessible text
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        const title = await button.getAttribute('title');

        if (!ariaLabel && (!textContent || textContent.trim().length === 0) && !title) {
          missingLabels.push(`Button at index ${i} has no accessible text`);
        }
      }
    }

    if (missingTypes.length > 0) {
      console.log('❌ Buttons missing type attribute:');
      missingTypes.forEach((issue) => console.log('  -', issue));
    } else {
      console.log('✅ All buttons have type attributes');
    }

    if (missingLabels.length > 0) {
      console.log('❌ Elements missing accessible labels:');
      missingLabels.forEach((issue) => console.log('  -', issue));
    } else {
      console.log('✅ All interactive elements have accessible text');
    }

    // Test 2: Check keyboard navigation
    console.log('\n⌨️ Testing Keyboard Navigation...');

    // Test Tab navigation through interactive elements
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log('First tab focus:', focusedElement);

    // Test command palette keyboard shortcut
    console.log('\n🎹 Testing Command Palette Accessibility...');
    await page.keyboard.press('Meta+KeyK');
    await page.waitForTimeout(300);

    const commandPalette = page.locator('#command-palette');
    const isVisible = await commandPalette.isVisible();
    console.log('Command palette opens with Cmd+K:', isVisible);

    if (isVisible) {
      // Check if search input gets focus
      const searchInput = page.locator('#command-search');
      const isFocused = await searchInput.evaluate((el) => document.activeElement === el);
      console.log('Search input gets focus:', isFocused);

      // Check ARIA attributes
      const role = await commandPalette.getAttribute('role');
      const ariaLabelledby = await commandPalette.getAttribute('aria-labelledby');
      const ariaHidden = await commandPalette.getAttribute('aria-hidden');

      console.log('Command palette ARIA attributes:');
      console.log('  - role:', role);
      console.log('  - aria-labelledby:', ariaLabelledby);
      console.log('  - aria-hidden:', ariaHidden);

      // Test arrow key navigation
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      const highlightedItem = await page
        .locator('.highlighted, .command-item.bg-light-800')
        .count();
      console.log('Arrow key navigation works:', highlightedItem > 0);

      // Close palette
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    // Test 3: Check color contrast issues
    console.log('\n🌈 Checking Color Contrast...');

    // Get colors of key elements
    const textColors = await page.evaluate(() => {
      const elements = [
        { selector: 'h1', name: 'Main heading' },
        { selector: 'p', name: 'Body text' },
        { selector: 'button', name: 'Button text' },
        { selector: '.text-text-secondary', name: 'Secondary text' },
      ];

      return elements.map(({ selector, name }) => {
        const el = document.querySelector(selector);
        if (el) {
          const styles = getComputedStyle(el);
          return {
            name,
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
          };
        }
        return { name, error: 'Element not found' };
      });
    });

    console.log('Element color information:');
    textColors.forEach((item) => {
      if (item.error) {
        console.log(`  - ${item.name}: ${item.error}`);
      } else {
        console.log(`  - ${item.name}: ${item.color} on ${item.backgroundColor}`);
      }
    });

    // Test 4: Check form accessibility
    console.log('\n📋 Testing Form Accessibility...');

    const inputs = await page.locator('input, textarea, select').all();
    console.log(`Found ${inputs.length} form elements`);

    const formIssues = [];

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');

      // Check if input has associated label
      let hasLabel = false;
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }

      if (!hasLabel && !ariaLabel && !placeholder) {
        formIssues.push(`Input ${i} has no accessible label`);
      }
    }

    if (formIssues.length > 0) {
      console.log('❌ Form accessibility issues:');
      formIssues.forEach((issue) => console.log('  -', issue));
    } else {
      console.log('✅ All form elements have accessible labels');
    }

    // Test 5: Check heading hierarchy
    console.log('\n📑 Checking Heading Hierarchy...');

    const headings = await page.evaluate(() => {
      const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headingElements.map((h) => ({
        level: parseInt(h.tagName.charAt(1)),
        text: `${h.textContent?.slice(0, 50)}...`,
        hasContent: (h.textContent?.trim().length || 0) > 0,
      }));
    });

    console.log('Heading structure:');
    headings.forEach((h, _i) => {
      console.log(`  - H${h.level}: ${h.text} ${h.hasContent ? '✅' : '❌ Empty'}`);
    });

    // Check for proper heading hierarchy
    const hierarchyIssues = [];
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i].level;
      const previous = headings[i - 1].level;

      if (current > previous + 1) {
        hierarchyIssues.push(`Heading level jumps from H${previous} to H${current}`);
      }
    }

    if (hierarchyIssues.length > 0) {
      console.log('❌ Heading hierarchy issues:');
      hierarchyIssues.forEach((issue) => console.log('  -', issue));
    } else {
      console.log('✅ Heading hierarchy is properly structured');
    }

    console.log('\n✅ Accessibility audit complete!');
  } catch (error) {
    console.error('❌ Audit error:', error);
  } finally {
    await browser.close();
  }
}

auditAccessibility().catch(console.error);
