#!/usr/bin/env bun

/**
 * Manual: email confirmed newsletter subscribers about one published post.
 * Never runs on deploy. Dry-run by default; pass --send to deliver.
 * GitHub Actions: run the "Newsletter" workflow with slug and send=true.
 *
 *   bunx varlock run -- bun scripts/send-new-post.mjs <post-slug>          # dry run
 *   bunx varlock run -- bun scripts/send-new-post.mjs <post-slug> --send   # deliver
 *
 * Needs UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NEWSLETTER_SIGNING_SECRET,
 * RESEND_API_KEY and CONTACT_FROM_EMAIL. Runs under Bun because it imports the shared
 * TypeScript in src/utils/subscribe.ts. Subscriber addresses are never printed.
 * Recipients already mailed for this slug are recorded in Redis and skipped on a rerun.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slug as githubSlug } from 'github-slugger';
import {
  SUBSCRIBERS_KEY,
  buildPostEmail,
  hasUsableSecret,
  normalizeEmail,
  sendEmail,
  signToken,
} from '../src/utils/subscribe.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://piyushmehta.com';
const SEND_DELAY_MS = 600;
const SENT_TTL_SECONDS = 30 * 24 * 60 * 60;

const args = process.argv.slice(2);
const send = args.includes('--send');
const slugArg = args.find((arg) => !arg.startsWith('--'));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function unquote(raw) {
  const value = raw.trim();
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}

function readPost(dir) {
  const file = ['index.mdx', 'index.md']
    .map((name) => join(ROOT, 'src', 'content', 'blog', dir, name))
    .find((path) => existsSync(path));
  if (!file) fail(`No post found for "${dir}" in src/content/blog.`);
  const front = readFileSync(file, 'utf8').match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
  const field = (name) => {
    const match = front.match(new RegExp(`^${name}\\s*:\\s*(.+)$`, 'm'));
    return match ? unquote(match[1]) : '';
  };
  if (/^draft\s*:\s*true\s*$/m.test(front)) fail('That post is a draft. Refusing to send.');
  const title = field('title');
  if (!title) fail('The post has no title in its frontmatter.');
  return { title, description: field('description') };
}

async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) fail('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Redis request failed (${response.status}).`);
  const data = await response.json();
  if (data.error) throw new Error('Redis returned an error.');
  return data.result;
}

async function main() {
  if (!slugArg) fail('Usage: bun scripts/send-new-post.mjs <post-slug> [--send]');
  const post = readPost(slugArg);
  const publicSlug = githubSlug(slugArg);
  const postUrl = `${SITE}/blog/${publicSlug}`;
  const secret = process.env.NEWSLETTER_SIGNING_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = normalizeEmail(process.env.CONTACT_FROM_EMAIL);
  if (!hasUsableSecret(secret)) fail('NEWSLETTER_SIGNING_SECRET must be set (32+ characters).');
  if (send && (!apiKey || !fromAddress))
    fail('RESEND_API_KEY and CONTACT_FROM_EMAIL are required to send.');

  const sentKey = `newsletter:sent:${publicSlug}`;
  const subscribers = (await redisCommand(['SMEMBERS', SUBSCRIBERS_KEY])) ?? [];
  const alreadySent = new Set((await redisCommand(['SMEMBERS', sentKey])) ?? []);
  const pending = subscribers.filter((email) => !alreadySent.has(email));

  console.log(`Post: ${post.title}`);
  console.log(`URL: ${postUrl}`);
  console.log(
    `Confirmed subscribers: ${subscribers.length}, already mailed for this post: ${subscribers.length - pending.length}, to send: ${pending.length}`,
  );

  if (!send) {
    console.log('Dry run. Nothing was sent. Add --send to deliver.');
    return;
  }

  let delivered = 0;
  let failed = 0;
  for (const email of pending) {
    try {
      const unsubscribe = new URL('/api/subscribe/unsubscribe', SITE);
      unsubscribe.searchParams.set('token', await signToken(secret, 'unsubscribe', email));
      await sendEmail(
        apiKey,
        buildPostEmail({
          fromAddress,
          email,
          title: post.title,
          description: post.description,
          url: postUrl,
          unsubscribeUrl: unsubscribe.toString(),
        }),
      );
      await redisCommand(['SADD', sentKey, email]);
      // The sent list only exists to make reruns safe; do not keep addresses past that.
      await redisCommand(['EXPIRE', sentKey, String(SENT_TTL_SECONDS)]);
      delivered += 1;
    } catch (error) {
      failed += 1;
      console.error(`Delivery failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
    await new Promise((done) => setTimeout(done, SEND_DELAY_MS));
  }
  console.log(
    `Done. Delivered: ${delivered}, failed: ${failed}. Rerun the same command to retry failures.`,
  );
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) =>
  fail(`Failed: ${error instanceof Error ? error.message : 'unknown error'}`),
);
