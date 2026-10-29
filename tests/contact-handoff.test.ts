import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { HANDOFF_SUBJECT, buildHandoff, parseHandoff } from '../src/utils/contact-handoff';

describe('contact handoff', () => {
  it('builds subject and message with question and sources', () => {
    const h = buildHandoff('  What does Piyush do?  ', ['https://piyushmehta.com/resume/']);
    assert.equal(h.subject, HANDOFF_SUBJECT);
    assert.match(h.message, /"What does Piyush do\?"/);
    assert.match(h.message, /- https:\/\/piyushmehta\.com\/resume\//);
  });

  it('omits the sources block when there are none', () => {
    assert.doesNotMatch(buildHandoff('Hi there', []).message, /Pages I was reading/);
  });

  it('round-trips through parse', () => {
    const h = buildHandoff('Question', []);
    assert.deepEqual(parseHandoff(JSON.stringify(h)), h);
  });

  it('rejects malformed or empty storage', () => {
    for (const raw of [null, '', 'not json', '{}', '{"subject":1,"message":"x"}', '{"subject":"s","message":"  "}'])
      assert.equal(parseHandoff(raw), null);
  });

  it('clamps to contact API limits', () => {
    const h = parseHandoff(JSON.stringify({ subject: 's'.repeat(500), message: 'm'.repeat(9000) }));
    assert.equal(h?.subject.length, 150);
    assert.equal(h?.message.length, 5000);
  });
});
