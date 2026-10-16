#!/usr/bin/env node
/**
 * Builds the Ask Piyush retrieval index (BM25, no network) from published posts,
 * typed portfolio data, and src/content/chat/facts.md.
 * Output: src/data/chat-index.json (imported by the Worker bundle).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slug as githubSlug } from 'github-slugger';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'src', 'content', 'blog');
const OUT = join(ROOT, 'src', 'data', 'chat-index.json');
const CHUNK_WORDS = 220;

const stripMdx = (s) =>
  s
    .replace(/^import .*$/gm, '')
    .replace(/^export .*$/gm, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function frontmatter(source) {
  const m = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const fm = m?.[1] ?? '';
  const get = (k) => fm.match(new RegExp(`^${k}\\s*:\\s*['"]?(.*?)['"]?\\s*$`, 'm'))?.[1] ?? '';
  return {
    title: get('title'),
    draft: /^draft\s*:\s*true\s*$/m.test(fm),
    body: source.slice(m?.[0].length ?? 0),
  };
}

function chunk(text) {
  const words = text.split(' ').filter(Boolean);
  const out = [];
  for (let i = 0; i < words.length; i += CHUNK_WORDS)
    out.push(words.slice(i, i + CHUNK_WORDS).join(' '));
  return out;
}

const docs = [];

for (const entry of readdirSync(BLOG, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = ['index.mdx', 'index.md'].map((f) => join(BLOG, entry.name, f)).find(existsSync);
  if (!file) continue;
  const { title, draft, body } = frontmatter(readFileSync(file, 'utf8'));
  if (draft) continue;
  const url = `/blog/${githubSlug(entry.name)}`;
  chunk(stripMdx(body)).forEach((text, i) =>
    docs.push({ id: `post:${entry.name}:${i}`, title, url, text: `${title}. ${text}` }),
  );
}

const facts = readFileSync(join(ROOT, 'src', 'content', 'chat', 'facts.md'), 'utf8');
chunk(stripMdx(facts)).forEach((text, i) =>
  docs.push({ id: `facts:${i}`, title: 'About Piyush Mehta', url: '/about', text }),
);

const p = await import('../src/data/portfolio.ts');
const json = (v) => stripMdx(JSON.stringify(v).replace(/[{}[\]"]/g, ' '));
for (const c of p.caseStudies ?? []) {
  chunk(json(c)).forEach((text, i) =>
    docs.push({
      id: `case:${c.title}:${i}`,
      title: `Case study: ${c.title}`,
      url: '/projects',
      text,
    }),
  );
}
for (const r of p.resumeRoles ?? []) {
  docs.push({
    id: `role:${r.company}`,
    title: `Role: ${r.title}, ${r.company}`,
    url: '/resume',
    text: json(r),
  });
}
docs.push({
  id: 'resume:skills',
  title: 'Skills',
  url: '/resume',
  text: json({
    skills: p.resumeSkillGroups,
    education: p.resumeEducation,
    achievements: p.resumeAchievements,
    facts: p.resumeQuickFacts,
  }),
});
docs.push({
  id: 'services',
  title: 'Services',
  url: '/services',
  text: json(p.serviceEngagements ?? []),
});
docs.push({
  id: 'contact',
  title: 'Contact',
  url: '/contact-me',
  text: json({ channels: p.contactChannels, topics: p.contactTopics }),
});

writeFileSync(OUT, JSON.stringify({ version: 1, docs }) + '\n');
console.log(`✅ Wrote chat index (${docs.length} chunks)`);
