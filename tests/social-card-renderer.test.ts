/**
 * Unit tests for social card (Twitter/OG image) rendering.
 * Run: npx tsx tests/social-card-renderer.test.ts
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  createSocialCardResponse,
  renderFallbackPng,
  renderSocialCardPng,
} from '../src/utils/social-card-renderer';
import type { SocialCardData } from '../src/utils/social-card';

const SAMPLE_DATA: SocialCardData = {
  title: 'Herdr is the runtime your coding agents live on',
  description: 'A look at building a terminal multiplexer for coding agents.',
  type: 'article',
  template: 'blog',
  theme: 'dark',
  date: '2026-08-26',
};

describe('renderSocialCardPng', () => {
  it('renders successfully when process.cwd() is not the project root', async () => {
    // Reproduces the serverless failure mode: the deployed runtime does not
    // reliably use the project root as its working directory, so font loading
    // must not depend on it.
    const originalCwd = process.cwd();
    process.chdir('/tmp');
    try {
      const png = await renderSocialCardPng(SAMPLE_DATA);
      assert.ok(Buffer.isBuffer(png), 'should return a Buffer');
      // The blank fallback PNG is exactly 4423 bytes; a real rendered card
      // with title/description/tags text is substantially larger.
      assert.ok(
        png.byteLength > 10_000,
        `expected a real rendered PNG (>10KB), got ${png.byteLength} bytes`
      );
    } finally {
      process.chdir(originalCwd);
    }
  });
});

describe('renderFallbackPng', () => {
  it('rasterizes visible title text rather than a blank background', () => {
    // A PNG with real glyph curves encodes to meaningfully more bytes than
    // one with no glyphs at all. Comparing two very different title lengths
    // catches the case where text silently fails to render (e.g. no font
    // available in the runtime), which otherwise still returns a "successful"
    // fixed-size PNG.
    const shortTitlePng = renderFallbackPng('Hi');
    const longTitlePng = renderFallbackPng(
      'A considerably longer fallback headline used to verify glyphs are actually drawn'
    );

    assert.notEqual(
      shortTitlePng.byteLength,
      longTitlePng.byteLength,
      'expected different titles to produce visibly different output (text is being rasterized)'
    );
    assert.ok(
      longTitlePng.byteLength > shortTitlePng.byteLength * 1.5,
      `expected the longer title to encode to noticeably more bytes than the short one, got ${shortTitlePng.byteLength} vs ${longTitlePng.byteLength}`
    );
  });
});

describe('createSocialCardResponse', () => {
  it('serves the real rendered card, not the degenerate fallback, even from an unexpected cwd', async () => {
    const originalCwd = process.cwd();
    process.chdir('/tmp');
    try {
      const response = await createSocialCardResponse(SAMPLE_DATA);
      const png = Buffer.from(await response.arrayBuffer());

      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Content-Type'), 'image/png');
      assert.equal(
        response.headers.get('X-Fallback-Image'),
        null,
        'should not have degraded to the blank fallback image'
      );
      assert.ok(
        png.byteLength > 10_000,
        `expected a real rendered PNG (>10KB), got ${png.byteLength} bytes`
      );
    } finally {
      process.chdir(originalCwd);
    }
  });
});

console.log('\n✅ All tests complete');
