/**
 * Parser for the constrained post-mode answer subset: paragraphs, "- " bullets, **bold**,
 * `code` and [text](url). Pure and DOM-free; the panel turns the result into DOM nodes with
 * createElement/textContent only, so no HTML can be produced from model output.
 */
import { isAllowedUrl } from './guard';

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string };

export type Block = { type: 'paragraph'; inline: Inline[] } | { type: 'list'; items: Inline[][] };

const INLINE =
  /\*\*([^*\n]+)\*\*|`([^`\n]+)`|\[([^\]\n]+)\]\(\s*<?((?:[^\s()<>]|\([^\s()]*\))+)>?\s*\)/g;

export function parseInline(line: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  const push = (text: string) => {
    if (!text) return;
    const prev = out[out.length - 1];
    if (prev?.type === 'text') prev.text += text;
    else out.push({ type: 'text', text });
  };
  for (const m of line.matchAll(INLINE)) {
    push(line.slice(last, m.index));
    if (m[1] !== undefined) out.push({ type: 'bold', text: m[1] });
    else if (m[2] !== undefined) out.push({ type: 'code', text: m[2] });
    // A link only exists when the URL passes the same allowlist the server guard enforces;
    // otherwise only its label survives, as plain text.
    else if (isAllowedUrl(m[4])) out.push({ type: 'link', text: m[3], href: m[4] });
    else push(m[3]);
    last = (m.index ?? 0) + m[0].length;
  }
  push(line.slice(last));
  return out;
}

const BULLET = /^\s{0,3}[-*\u2022]\s+(.*)$/;

export function parseAnswer(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: 'paragraph', inline: parseInline(para.join(' ')) });
    para = [];
  };
  const flushList = () => {
    if (list?.length) blocks.push({ type: 'list', items: list.map(parseInline) });
    list = null;
  };

  for (const raw of text.replaceAll('\r', '').split('\n')) {
    const line = raw.trimEnd();
    const bullet = BULLET.exec(line);
    if (bullet) {
      flushPara();
      (list ??= []).push(bullet[1]);
    } else if (line.trim() === '') {
      flushPara();
      flushList();
    } else if (list && /^\s+\S/.test(line)) {
      // Wrapped continuation of the previous bullet.
      list[list.length - 1] += ' ' + line.trim();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return blocks;
}
