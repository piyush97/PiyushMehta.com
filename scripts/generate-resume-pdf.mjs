/**
 * Build-time resume PDF generation
 * Uses Playwright to render the resume page and save as PDF.
 * Run as part of the build pipeline: node scripts/generate-resume-pdf.mjs
 *
 * Requires the dev server to be running (handled by the build script).
 */

import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { chromium } from 'playwright';

const PORT = process.env.PORT || '4321';
const BASE = process.env.BASE_URL || `http://localhost:${PORT}`;
const OUTPUT = resolve(import.meta.dirname, '..', 'public', 'resume.pdf');

async function generate() {
  console.log(`[generate-resume-pdf] Navigating to ${BASE}/resume/ ...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/resume/`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for hero animation to settle
    await page.waitForTimeout(2000);

    // Hide interactive elements that don't print well
    await page.addStyleTag({
      content: `
        nav, footer, .resume-cta, #resume-download-pdf, .metrics-band,
        [data-hero-title] .tw-cursor { display: none !important; }
        body { color: #000 !important; background: #fff !important; }
        .resume-hero h1 { font-size: 24pt !important; }
        .resume-summary, .timeline-card, .info-card {
          border: 1px solid #ccc !important; break-inside: avoid !important;
        }
        a { color: #000 !important; text-decoration: underline !important; }
      `,
    });

    mkdirSync(resolve(import.meta.dirname, '..', 'public'), { recursive: true });

    await page.pdf({
      path: OUTPUT,
      format: 'Letter',
      printBackground: false,
      margin: { top: '0.5in', bottom: '0.5in', left: '0.75in', right: '0.75in' },
    });

    console.log(`[generate-resume-pdf] ✓ Saved to ${OUTPUT}`);
  } catch (err) {
    console.error(`[generate-resume-pdf] ✗ Failed:`, err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generate();
