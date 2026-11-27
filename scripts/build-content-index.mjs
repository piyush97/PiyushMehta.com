#!/usr/bin/env node
/**
 * Opt-in build path: enumerate the published posts once, hand the list to the
 * prebuilt `content-index` Rust binary (RUST_CONTENT_INDEX_BIN), and finalize both
 * the chat index and section corpus from its single output. Use --check-sections
 * to verify the committed section corpus during a build.
 *
 * The binary reads a JSON array of `{ name, file }` on stdin and writes, in the same
 * order, a JSON array of `{ name, chat, sections }` where each is `null` for a draft.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeChatIndex } from './build-chat-index.mjs';
import {
  checkPostSections,
  renderPostSections,
  writePostSections,
} from './build-post-sections.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'src', 'content', 'blog');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const binary = process.env.RUST_CONTENT_INDEX_BIN;
if (!binary)
  fail('RUST_CONTENT_INDEX_BIN is not set; pass the path to the prebuilt content-index binary.');

const inputs = [];
for (const entry of readdirSync(BLOG, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = ['index.mdx', 'index.md'].map((f) => join(BLOG, entry.name, f)).find(existsSync);
  if (!file) continue;
  inputs.push({ name: entry.name, file });
}

const run = spawnSync(binary, [], {
  input: JSON.stringify(inputs),
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});
if (run.error) fail(`could not run RUST_CONTENT_INDEX_BIN (${binary}): ${run.error.message}`);
if (run.signal) fail(`content-index was terminated by signal ${run.signal}`);
if (run.status !== 0)
  fail(`content-index exited with code ${run.status}${run.stderr ? `: ${run.stderr.trim()}` : ''}`);

let results;
try {
  results = JSON.parse(run.stdout);
} catch (error) {
  fail(`content-index returned invalid JSON: ${error.message}`);
}
if (!Array.isArray(results) || results.length !== inputs.length) {
  fail(
    `content-index returned ${Array.isArray(results) ? results.length : 'a non-array'} result(s) for ${inputs.length} input(s)`,
  );
}

const chatEntries = [];
const sectionEntries = [];
results.forEach((result, index) => {
  if (!result || result.name !== inputs[index].name)
    fail(`content-index returned results out of order at index ${index}`);
  if (Boolean(result.chat) !== Boolean(result.sections))
    fail(`content-index returned an inconsistent draft state for ${result.name}`);
  if (result.chat)
    chatEntries.push({ name: result.name, title: result.chat.title, chunks: result.chat.chunks });
  if (result.sections)
    sectionEntries.push({
      name: result.name,
      title: result.sections.title,
      description: result.sections.description,
      sections: result.sections.sections,
    });
});

const { output, count } = renderPostSections(sectionEntries);
const checkSections = process.argv.includes('--check-sections');
if (checkSections) checkPostSections(output, count);
await writeChatIndex(chatEntries);
if (!checkSections) writePostSections(output, count);
