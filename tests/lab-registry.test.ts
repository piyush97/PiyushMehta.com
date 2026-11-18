import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  LAB_RESERVED_SLUGS,
  getLabDemo,
  labCardForKey,
  labDemos,
  labEmbedPath,
  labOgImage,
  labPath,
} from '../src/data/lab';

const blogRoot = join(process.cwd(), 'src', 'content', 'blog');

function postSource(slug: string): string | undefined {
  for (const file of ['index.mdx', 'index.md']) {
    const path = join(blogRoot, slug, file);
    if (existsSync(path)) return readFileSync(path, 'utf8');
  }
  return undefined;
}

describe('lab registry', () => {
  it('has at least one demo', () => {
    assert.ok(labDemos.length > 0);
  });

  it('uses unique, URL-safe slugs that do not shadow lab routes', () => {
    const slugs = labDemos.map((demo) => demo.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'slugs must be unique');
    for (const slug of slugs) {
      assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(!(LAB_RESERVED_SLUGS as readonly string[]).includes(slug), `${slug} is reserved`);
    }
  });

  it('points every demo at an existing, published post', () => {
    for (const demo of labDemos) {
      const source = postSource(demo.postSlug);
      assert.ok(source, `${demo.slug}: no post at src/content/blog/${demo.postSlug}`);
      const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
      assert.ok(!/^draft\s*:\s*true\s*$/m.test(frontmatter), `${demo.slug}: source post is a draft`);
    }
  });

  it('only uses a component the source post actually renders', () => {
    for (const demo of labDemos) {
      const source = postSource(demo.postSlug) ?? '';
      assert.ok(
        new RegExp(`<${demo.component}[\\s/>]`).test(source),
        `${demo.slug}: ${demo.postSlug} does not render <${demo.component}>`,
      );
    }
  });

  it('has complete, honest copy with no em dashes', () => {
    for (const demo of labDemos) {
      for (const field of ['title', 'description', 'context', 'caveat'] as const) {
        assert.ok(demo[field].trim().length > 10, `${demo.slug}.${field} is empty`);
        assert.ok(!demo[field].includes('\u2014'), `${demo.slug}.${field} contains an em dash`);
      }
      assert.ok(demo.tags.length > 0, `${demo.slug} needs tags`);
      assert.ok(demo.embedHeight >= 300 && demo.embedHeight <= 1400);
    }
  });

  it('builds distinct paths and social cards per demo', () => {
    const images = new Set<string>();
    for (const demo of labDemos) {
      assert.equal(labPath(demo.slug), `/lab/${demo.slug}`);
      assert.equal(labEmbedPath(demo.slug), `/lab/embed/${demo.slug}`);
      assert.equal(getLabDemo(demo.slug), demo);
      assert.equal(labCardForKey(demo.slug)?.title, demo.title);
      images.add(labOgImage(demo.slug));
    }
    assert.equal(images.size, labDemos.length);
    assert.ok(labCardForKey('index'));
    assert.equal(labCardForKey('missing'), undefined);
  });
});
