#!/usr/bin/env node
/**
 * Generates the GitHub social preview card (1280x640) for this repository.
 *
 * Usage: node scripts/generate-repo-social-preview.mjs [outfile]
 * Default outfile: .github/social-preview.png
 *
 * GitHub exposes no REST or GraphQL API for this image — it can only be set
 * from Settings -> Social preview in the web UI. The rendered file is checked
 * in so the branding is versioned and can be re-uploaded after a change.
 * Uses the same Inter font and palette as the site's own Satori cards.
 */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 1280;
const H = 640;

// process.cwd() is not reliable when this runs from a different directory, so
// resolve the font relative to this module first and fall back to cwd — the
// same approach as src/utils/social-card-renderer.ts.
const moduleDir = dirname(fileURLToPath(import.meta.url));
const FONT_PATH = [
  join(moduleDir, '..', 'InterVariable.ttf'),
  resolve(process.cwd(), 'InterVariable.ttf'),
].find((candidate) => existsSync(candidate));

if (!FONT_PATH) {
  throw new Error('InterVariable.ttf not found. Run this from the project root.');
}

const font = readFileSync(FONT_PATH);

// Satori matches weight per registered font, so register each one we use.
const fonts = [400, 500, 600, 700, 800, 900].map((weight) => ({
  name: 'Inter',
  data: font,
  weight,
  style: 'normal',
}));

const AMBER = '#ffcc68';
const INK = '#f6f7ff';
const MUTED = '#c8cbe8';
const DIM = '#8f96ba';
const BG = '#171a2f';

/** Satori node helper: children may be a node, an array, or a string. */
const div = (style, children) => ({
  type: 'div',
  props: { style, children },
});

const card = div(
  {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: BG,
  },
  [
    // Top accent rule
    div({ display: 'flex', width: '100%', height: 14, backgroundColor: AMBER }, []),

    div(
      {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexGrow: 1,
        padding: '0 84px',
      },
      [
        div(
          {
            display: 'flex',
            fontSize: 21,
            letterSpacing: 4,
            color: AMBER,
            fontWeight: 700,
          },
          'THE SYSTEMS LEDGER',
        ),
        div(
          {
            display: 'flex',
            fontSize: 64,
            fontWeight: 800,
            color: INK,
            lineHeight: 1.1,
            marginTop: 24,
            letterSpacing: -1.5,
          },
          'PiyushMehta.com',
        ),
        div(
          {
            display: 'flex',
            fontSize: 27,
            fontWeight: 500,
            color: MUTED,
            marginTop: 18,
          },
          'Portfolio and technical blog — Astro 7, Cloudflare Workers',
        ),
      ],
    ),

    // Footer
    div(
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 84px 56px',
      },
      [
        div({ display: 'flex', fontSize: 23, fontWeight: 600, color: DIM }, 'piyushmehta.com'),
        div({ display: 'flex', fontSize: 23, fontWeight: 600, color: AMBER }, 'MIT License'),
      ],
    ),
  ],
);

const svg = await satori(card, { width: W, height: H, fonts });
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: W },
  font: { loadSystemFonts: false, defaultFontFamily: 'Inter' },
})
  .render()
  .asPng();

const out = process.argv[2] || resolve(moduleDir, '..', '.github', 'social-preview.png');
writeFileSync(out, png);
console.log(`${out}  ${W}x${H}  ${(png.length / 1024).toFixed(0)} KB`);
