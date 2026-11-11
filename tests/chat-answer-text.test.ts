import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseAnswer, parseInline } from '../src/utils/chat/answer-text';

describe('parseAnswer', () => {
  it('splits paragraphs on blank lines and joins soft wraps', () => {
    assert.deepEqual(parseAnswer('One\nstill one.\n\nTwo.'), [
      { type: 'paragraph', inline: [{ type: 'text', text: 'One still one.' }] },
      { type: 'paragraph', inline: [{ type: 'text', text: 'Two.' }] },
    ]);
  });

  it('parses bullets, wrapped bullets and a paragraph before them', () => {
    assert.deepEqual(parseAnswer('Intro.\n- **Queue**: first\n  continued\n- second\n\nAfter.'), [
      { type: 'paragraph', inline: [{ type: 'text', text: 'Intro.' }] },
      {
        type: 'list',
        items: [
          [{ type: 'bold', text: 'Queue' }, { type: 'text', text: ': first continued' }],
          [{ type: 'text', text: 'second' }],
        ],
      },
      { type: 'paragraph', inline: [{ type: 'text', text: 'After.' }] },
    ]);
  });

  it('returns nothing for empty text', () => {
    assert.deepEqual(parseAnswer(''), []);
    assert.deepEqual(parseAnswer('\n\n  \n'), []);
  });
});

describe('parseInline', () => {
  it('parses bold, inline code and text in order', () => {
    assert.deepEqual(parseInline('use **retry** with `backoff()` now'), [
      { type: 'text', text: 'use ' },
      { type: 'bold', text: 'retry' },
      { type: 'text', text: ' with ' },
      { type: 'code', text: 'backoff()' },
      { type: 'text', text: ' now' },
    ]);
  });

  it('renders an allowlisted link as a link', () => {
    assert.deepEqual(parseInline('[the note](https://piyushmehta.com/blog/kubernetes-docker)'), [
      { type: 'link', text: 'the note', href: 'https://piyushmehta.com/blog/kubernetes-docker' },
    ]);
    assert.equal(parseInline('[me](https://github.com/piyush97)')[0].type, 'link');
  });

  it('does not render a link whose host is not on the allowlist; only the label survives', () => {
    for (const url of [
      'https://evil.example/x',
      'http://piyushmehta.com/x',
      'javascript:alert(1)',
      'https://piyushmehta.com.evil.example/',
      'https://github.com/other',
      'data:text/html,hi',
      '//evil.example',
    ])
      assert.deepEqual(parseInline(`[label](${url})`), [{ type: 'text', text: 'label' }], url);
  });

  it('never produces markup: HTML stays literal text', () => {
    const inline = parseAnswer('<img src=x onerror=alert(1)> <script>x</script> ![i](https://piyushmehta.com/a.png)');
    const flat = JSON.stringify(inline);
    assert.ok(!flat.includes('"type":"html"'));
    for (const block of inline)
      assert.ok(block.type === 'paragraph' || block.type === 'list');
    // Only text, bold, code and link nodes exist; the angle brackets survive as plain text.
    const kinds = new Set<string>();
    for (const b of inline) for (const i of b.type === 'paragraph' ? b.inline : b.items.flat()) kinds.add(i.type);
    assert.ok([...kinds].every((k) => ['text', 'bold', 'code', 'link'].includes(k)));
    assert.ok(flat.includes('<script>'));
  });
});
