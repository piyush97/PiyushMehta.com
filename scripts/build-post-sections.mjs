#!/usr/bin/env node
/**
 * Builds the structured, section-aware note corpus used by post-scoped Ask (ADR-0004).
 * Output: src/data/post-sections.json, one entry per published note:
 *   { title, description, digest, sections: [{ level, heading, text, code[] }] }
 *
 * Sections follow the article's own TOC rule (depth 2 and 3). Fenced code is kept verbatim in
 * `code[]` of the section it appeared in. A note with no depth 2/3 heading gets one synthetic
 * section (`level: 0, heading: null`). Prose before the first heading becomes a `level: 0`
 * lead section. MDX components are not recoverable from source and are dropped.
 *
 * Usage: node scripts/build-post-sections.mjs          write the artifact
 *        node scripts/build-post-sections.mjs --check  fail if the committed file is not byte-identical
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slug as githubSlug } from 'github-slugger';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'src', 'content', 'blog');
const OUT = join(ROOT, 'src', 'data', 'post-sections.json');

function frontmatter(source) {
  const m = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const fm = m?.[1] ?? '';
  const get = (k) => fm.match(new RegExp(`^${k}\\s*:\\s*['"]?(.*?)['"]?\\s*$`, 'm'))?.[1] ?? '';
  return {
    title: get('title'),
    description: get('description'),
    draft: /^draft\s*:\s*true\s*$/m.test(fm),
    body: source.slice(m?.[0].length ?? 0),
  };
}

/** Flatten inline markdown and JSX so only prose remains. */
const flatten = (s) =>
  s
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[A-Za-z/][^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/(\*\*|__|\*|`)/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const FENCE = /^(\s{0,3})(`{3,}|~{3,})/;
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

function parseSections(body) {
  const sections = [];
  let current = { level: 0, heading: null, lines: [], code: [] };
  let fence = null;
  let codeLines = [];

  const push = () => {
    const text = flatten(current.lines.join('\n'));
    if (current.heading !== null || text || current.code.length)
      sections.push({ level: current.level, heading: current.heading, text, code: current.code });
  };

  for (const line of body.split('\n')) {
    if (fence) {
      if (line.trim().startsWith(fence) && /^\s{0,3}(`{3,}|~{3,})\s*$/.test(line)) {
        current.code.push(codeLines.join('\n'));
        fence = null;
        codeLines = [];
      } else {
        codeLines.push(line);
      }
      continue;
    }
    const open = line.match(FENCE);
    if (open) {
      fence = open[2];
      codeLines = [];
      continue;
    }
    if (/^(import|export)\s/.test(line)) continue;
    const h = line.match(HEADING);
    if (h && (h[1].length === 2 || h[1].length === 3)) {
      push();
      current = { level: h[1].length, heading: flatten(h[2]), lines: [], code: [] };
      continue;
    }
    // Depth 1 and 4+ headings stay in the prose of the surrounding section.
    current.lines.push(h ? h[2] : line);
  }
  if (fence) current.code.push(codeLines.join('\n'));
  push();

  if (!sections.some((s) => s.heading !== null)) {
    const all = {
      level: 0,
      heading: null,
      text: sections
        .map((s) => s.text)
        .filter(Boolean)
        .join('\n\n'),
      code: sections.flatMap((s) => s.code),
    };
    return [all];
  }
  return sections;
}

const posts = {};
for (const entry of readdirSync(BLOG, { withFileTypes: true }).sort((a, b) =>
  a.name.localeCompare(b.name),
)) {
  if (!entry.isDirectory()) continue;
  const file = ['index.mdx', 'index.md'].map((f) => join(BLOG, entry.name, f)).find(existsSync);
  if (!file) continue;
  const { title, description, draft, body } = frontmatter(readFileSync(file, 'utf8'));
  if (draft) continue;
  const sections = parseSections(body);
  const digest = createHash('sha256')
    .update(JSON.stringify({ title, sections }))
    .digest('hex')
    .slice(0, 16);
  posts[githubSlug(entry.name)] = { title, description, digest, sections };
}

const sorted = Object.fromEntries(Object.entries(posts).sort(([a], [b]) => a.localeCompare(b)));
const output = JSON.stringify({ version: 1, posts: sorted }, null, 1) + '\n';
const count = Object.keys(sorted).length;

if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
  if (current !== output) {
    console.error(
      'src/data/post-sections.json is stale or missing. Run `bun run build:post-sections` and commit it.',
    );
    process.exit(1);
  }
  console.log(`✅ Post sections are current (${count} notes)`);
} else {
  writeFileSync(OUT, output);
  console.log(`✅ Wrote post sections (${count} notes)`);
}
