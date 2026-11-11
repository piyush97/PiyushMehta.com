import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('llms.txt surface', () => {
  const route = read('src/pages/llms.txt.ts');

  it('is a prerendered plain-text GET route that filters drafts', () => {
    assert.match(route, /export const prerender = true/);
    assert.match(route, /export async function GET/);
    assert.match(route, /text\/plain; charset=utf-8/);
    assert.match(route, /!data\.draft/);
  });

  it('follows the llms.txt layout: H1, blockquote, then H2 link sections', () => {
    assert.match(route, /`# \$\{SITE_NAME\}`/);
    assert.match(route, /`> \$\{SUMMARY\}`/);
    assert.match(route, /## Pages/);
    assert.match(route, /## Posts/);
  });

  it('builds absolute links through the canonical URL helper', () => {
    assert.match(route, /generateCanonicalUrl\(path, site\)/);
  });

  it('is advertised from robots.txt', () => {
    assert.match(read('src/pages/robots.txt.js'), /\/llms\.txt/);
  });

  it('only uses series names that every member post spells identically', () => {
    const root = join(process.cwd(), 'src', 'content', 'blog');
    const bySeries = new Map<string, number[]>();
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const fm = readFileSync(join(root, entry.name, 'index.mdx'), 'utf8').match(
        /^---\s*\n([\s\S]*?)\n---/,
      )?.[1];
      const name = fm?.match(/^series\s*:\s*["']?(.+?)["']?\s*$/m)?.[1];
      const order = Number(fm?.match(/^seriesOrder\s*:\s*(\d+)\s*$/m)?.[1]);
      if (!name) continue;
      assert.ok(Number.isInteger(order) && order > 0, `${entry.name}: seriesOrder required`);
      bySeries.set(name, [...(bySeries.get(name) ?? []), order]);
    }
    for (const [name, orders] of bySeries) {
      assert.equal(new Set(orders).size, orders.length, `${name}: duplicate seriesOrder`);
    }
  });
});
