/** Input normalization for untrusted chat text. */

export const MAX_MESSAGE_CHARS = 500;

// Zero-width, bidi controls, tag characters (ASCII smuggling), C0/C1 controls except \n \t.
const INVISIBLE = new RegExp(
  [
    '[\\u0000-\\u0008\\u000B-\\u001F\\u007F-\\u009F]', // C0/C1 controls (keeps \\n, \\t)
    '[\\u00AD\\u034F\\u061C\\u115F\\u1160\\u17B4\\u17B5\\u180B-\\u180F]', // soft hyphen, fillers, mongolian
    '[\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u206F]', // zero-width, bidi, invisible operators
    '[\\u3164\\uFE00-\\uFE0F\\uFEFF\\uFFA0\\uFFF9-\\uFFFB]', // hangul filler, variation selectors, BOM, interlinear
    '\\uDB40[\\uDC00-\\uDFFF]', // tag characters (ASCII smuggling)
  ].join('|'),
  'g',
);

export function sanitizeUserText(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(INVISIBLE, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
