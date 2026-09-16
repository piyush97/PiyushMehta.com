import { fromHtml } from 'hast-util-from-html';
import { toMdast } from 'hast-util-to-mdast';
import { toMarkdown } from 'mdast-util-to-markdown';
import type { MiddlewareHandler } from 'astro';
import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

const OMITTED_ELEMENTS = new Set(['footer', 'nav', 'script', 'style', 'svg']);

const toMarkdownDocument = (html: string) => {
  const document = fromHtml(html);
  let main: Element | undefined;

  visit(document, 'element', (node: Element, index, parent) => {
    if (OMITTED_ELEMENTS.has(node.tagName) && parent && index !== undefined) {
      parent.children.splice(index, 1);
      return index - 1;
    }
    if (node.tagName === 'main' && !main) {
      main = node;
    }
  });

  const source: Root = main ? { type: 'root', children: main.children } : document;
  return toMarkdown(toMdast(source)).trim();
};

export const onRequest: MiddlewareHandler = async ({ request }, next) => {
  const response = await next();
  const accept = request.headers.get('accept') ?? '';
  const acceptsMarkdown = /(?:^|,)\s*text\/markdown(?:\s*;[^,]*)?(?:,|$)/i.test(accept);

  if (!acceptsMarkdown || !response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }

  const markdown = toMarkdownDocument(await response.text());
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set(
    'x-markdown-tokens',
    String(Math.ceil(markdown.split(/\s+/).filter(Boolean).length / 0.75)),
  );
  headers.set('Vary', 'Accept');

  return new Response(markdown, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default onRequest;
