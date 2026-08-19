/**
 * Build-time resume PDF generation
 * Uses Playwright to render the resume page and save as PDF.
 * Run as part of the build pipeline: node scripts/generate-resume-pdf.mjs
 *
 * Starts a temporary dev server when one is not already available.
 */

import { spawn } from 'node:child_process';
import { mkdirSync } from 'fs';
import { resolve } from 'path';
import { chromium } from 'playwright';

const PORT = process.env.PORT || '4321';
const BASE = process.env.BASE_URL || `http://localhost:${PORT}`;
const OUTPUT = resolve(import.meta.dirname, '..', 'public', 'resume.pdf');

async function isServerAvailable() {
  try {
    const response = await fetch(BASE, { signal: AbortSignal.timeout(1_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function startServerIfNeeded() {
  if (await isServerAvailable()) {
    return undefined;
  }

  console.log(`[generate-resume-pdf] Starting dev server at ${BASE} ...`);
  const server = spawn('bun', ['run', 'dev'], {
    env: { ...process.env, ASTRO_DEV_BACKGROUND: '1' },
    stdio: 'inherit',
  });

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await isServerAvailable()) {
      return server;
    }
    if (server.exitCode !== null) {
      throw new Error(`Dev server exited before becoming ready (exit ${server.exitCode}).`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  server.kill('SIGTERM');
  throw new Error(`Dev server did not become ready at ${BASE} within 30 seconds.`);
}

async function generate() {
  console.log(`[generate-resume-pdf] Navigating to ${BASE}/resume/ ...`);

  const server = await startServerIfNeeded();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      deviceScaleFactor: 2,
      colorScheme: 'light',
    });
    const page = await context.newPage();

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
    process.exitCode = 1;
  } finally {
    await browser?.close();
    server?.kill('SIGTERM');
  }
}

void generate();
