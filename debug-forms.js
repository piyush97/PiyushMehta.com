import { chromium } from '@playwright/test';

async function debugFormAccessibility() {
  console.log('📋 Starting Form Accessibility Debug...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to blog post
    console.log('📍 Navigating to blog post...');
    await page.goto(
      'http://localhost:4322/blog/macos-to-arch-linux-omarchy-developer-productivity/'
    );
    await page.waitForLoadState('networkidle');

    // Find all form inputs
    const inputs = await page.evaluate(() => {
      const inputElements = Array.from(document.querySelectorAll('input, textarea, select'));
      return inputElements.map((input, index) => {
        const id = input.id;
        const name = input.name;
        const type = input.type || input.tagName.toLowerCase();
        const placeholder = input.placeholder;
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledby = input.getAttribute('aria-labelledby');
        const title = input.title;

        // Check for associated label
        let hasLabel = false;
        let labelText = '';

        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) {
            hasLabel = true;
            labelText = label.textContent?.trim() || '';
          }
        }

        // Check if input is inside a label
        if (!hasLabel) {
          const parentLabel = input.closest('label');
          if (parentLabel) {
            hasLabel = true;
            labelText = parentLabel.textContent?.trim() || '';
          }
        }

        const rect = input.getBoundingClientRect();

        return {
          index,
          tagName: input.tagName,
          type,
          id,
          name,
          placeholder,
          ariaLabel,
          ariaLabelledby,
          title,
          hasLabel,
          labelText,
          isVisible: rect.width > 0 && rect.height > 0,
          classList: Array.from(input.classList),
          outerHTML: `${input.outerHTML.slice(0, 200)}...`,
        };
      });
    });

    console.log(`Found ${inputs.length} form elements:\n`);

    inputs.forEach((input) => {
      console.log(`Input ${input.index}:`);
      console.log(`  - Tag: ${input.tagName} (${input.type})`);
      console.log(`  - ID: ${input.id || 'none'}`);
      console.log(`  - Name: ${input.name || 'none'}`);
      console.log(`  - Placeholder: ${input.placeholder || 'none'}`);
      console.log(`  - ARIA Label: ${input.ariaLabel || 'none'}`);
      console.log(`  - ARIA Labelledby: ${input.ariaLabelledby || 'none'}`);
      console.log(`  - Title: ${input.title || 'none'}`);
      console.log(
        `  - Has Label: ${input.hasLabel} ${input.labelText ? `("${input.labelText}")` : ''}`
      );
      console.log(`  - Visible: ${input.isVisible}`);
      console.log(`  - Classes: ${input.classList.join(', ') || 'none'}`);

      // Determine if this has accessible labeling
      const hasAccessibleLabel =
        input.hasLabel ||
        input.ariaLabel ||
        input.ariaLabelledby ||
        (input.placeholder && input.type !== 'password') ||
        input.title;

      if (!hasAccessibleLabel) {
        console.log(`  ❌ MISSING ACCESSIBLE LABEL`);
      } else {
        console.log(`  ✅ Has accessible labeling`);
      }

      console.log(`  - HTML: ${input.outerHTML}`);
      console.log('');
    });

    // Identify the problematic ones
    const problematicInputs = inputs.filter((input) => {
      const hasAccessibleLabel =
        input.hasLabel ||
        input.ariaLabel ||
        input.ariaLabelledby ||
        (input.placeholder && input.type !== 'password') ||
        input.title;
      return !hasAccessibleLabel && input.isVisible;
    });

    console.log(`\n🚨 ${problematicInputs.length} inputs missing accessible labels:`);
    problematicInputs.forEach((input) => {
      console.log(
        `  - Input ${input.index}: ${input.tagName} (${input.type}) - ID: ${input.id || 'none'}`
      );
    });

    console.log('\n✅ Form accessibility debug complete!');
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugFormAccessibility().catch(console.error);
