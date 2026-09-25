import { strict as assert } from 'node:assert';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { slug as githubSlug } from 'github-slugger';
import manifest from '../src/data/published-post-slugs.json';
import { isPublishedPostSlug, toPublishedPostSlug } from '../src/utils/published-posts';

describe('published post slugs', () => {
  it('uses the same case-folded slug space as Astro content entries', () => {
    assert.equal(toPublishedPostSlug('Kubernetes-Docker'), 'kubernetes-docker');
    assert.equal(toPublishedPostSlug('The-Silent-S-in-HTTPS'), 'the-silent-s-in-https');
    assert.equal(
      toPublishedPostSlug('What-is-Event-Loop-in-JavaScript'),
      'what-is-event-loop-in-javascript',
    );
  });

  it('accepts canonical and legacy casing for published posts', () => {
    assert.equal(isPublishedPostSlug('kubernetes-docker'), true);
    assert.equal(isPublishedPostSlug('Kubernetes-Docker'), true);
    assert.equal(isPublishedPostSlug('not-a-published-post'), false);
  });

  it('matches the canonical slug for every published content directory', () => {
    const contentRoot = join(process.cwd(), 'src', 'content', 'blog');
    const expected = readdirSync(contentRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const mdxPath = join(contentRoot, entry.name, 'index.mdx');
        const mdPath = join(contentRoot, entry.name, 'index.md');
        const postPath = existsSync(mdxPath) ? mdxPath : mdPath;
        if (!existsSync(postPath)) return [];
        const frontmatter = readFileSync(postPath, 'utf8').match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
        return /^draft\s*:\s*true\s*$/m.test(frontmatter) ? [] : [githubSlug(entry.name)];
      })
      .sort();

    assert.deepEqual(manifest, expected);
  });
});
