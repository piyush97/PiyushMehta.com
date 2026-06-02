#!/usr/bin/env node
/**
 * Send a newsletter broadcast via Resend.
 *
 * Usage:
 *   bunx scripts/send-newsletter.mjs --subject "Issue #1: AI in prod" --html-file ./email.html
 *   bunx scripts/send-newsletter.mjs --subject "..." --text "Plain text body"
 *
 * Required env:
 *   RESEND_API_KEY       (re_xxx)
 *   RESEND_SEGMENT_ID    (UUID — create via POST /segments or in dashboard)
 *   RESEND_FROM          (bare email, e.g. "news@piyushmehta.com";
 *                         the script wraps it as "Piyush Mehta <news@piyushmehta.com>")
 *
 * Optional env:
 *   RESEND_REPLY_TO      (defaults to RESEND_FROM address)
 *
 * What it does:
 *   1. Creates a draft Broadcast in Resend targeting your audience
 *   2. Confirms with you before sending (unless --yes is passed)
 *   3. Schedules it for immediate send
 *
 * Cost: counts against your Resend monthly email quota. Free tier: 3,000/mo
 * transactional + 1,000 contacts on Marketing tier (broadcasts are unlimited sends).
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    subject: { type: 'string' },
    html: { type: 'string' },
    'html-file': { type: 'string' },
    text: { type: 'string' },
    reply: { type: 'string' },
    yes: { type: 'boolean', default: false },
  },
});

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

const apiKey = requireEnv('RESEND_API_KEY', process.env.RESEND_API_KEY);
const segmentId = requireEnv('RESEND_SEGMENT_ID', process.env.RESEND_SEGMENT_ID);
const fromAddress = requireEnv('RESEND_FROM', process.env.RESEND_FROM);
// Wrap the bare address in a friendly "Name <email>" format for Resend.
const from = `Piyush Mehta <${fromAddress}>`;
const replyTo = values.reply ?? process.env.RESEND_REPLY_TO;

if (!values.subject) {
  console.error('Missing --subject');
  process.exit(1);
}

let html = values.html;
if (values['html-file']) {
  html = readFileSync(values['html-file'], 'utf8');
}
if (!html && !values.text) {
  console.error('Provide either --html, --html-file, or --text');
  process.exit(1);
}

async function resend(path, method, body) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'piyushmehta.com/1.0',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend ${method} ${path} failed (${res.status}): ${err}`);
  }
  return res.json();
}

async function main() {
  console.log('Creating broadcast...');
  const broadcast = await resend('/broadcasts', 'POST', {
    name: values.subject,
    segment_id: segmentId,
    from,
    subject: values.subject,
    html,
    text: values.text,
    reply_to: replyTo,
  });
  console.log('Broadcast created:', broadcast.id, '(status:', `${broadcast.status})`);

  if (!values.yes) {
    console.log('\nAbout to send. Press Ctrl+C to cancel, or wait 5s...');
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log('Sending broadcast...');
  const sent = await resend(`/broadcasts/${broadcast.id}/send`, 'POST');
  console.log('Broadcast sent:', sent);
  console.log(
    `\nCheck Resend dashboard for delivery stats: https://resend.com/broadcasts/${broadcast.id}`
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
