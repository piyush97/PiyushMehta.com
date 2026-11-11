/** Post scope: resolves a published slug to the note's own structured sections and fallback chunks. Pure. */
import postSections from '../../data/post-sections.json';
import { isPublishedPostSlug, toPublishedPostSlug } from '../published-posts';
import { getIndex, type Bm25, type Chunk } from './retrieve';

export interface PostSection {
  /** 2 or 3 for a heading, 0 for lead prose or a heading-less note. */
  level: number;
  heading: string | null;
  text: string;
  code: string[];
}

export interface PostNote {
  slug: string;
  title: string;
  description: string;
  /** First 16 hex of a build-time SHA-256 over the note's structured content. */
  digest: string;
  sections: PostSection[];
}

/** Safety bound for one prompt; every published note today is far below it. */
export const MAX_NOTE_CHARS = 40_000;
export const MAX_FALLBACK_CHUNKS = 2;

const posts = (postSections as unknown as { posts: Record<string, Omit<PostNote, 'slug'>> }).posts;

/** Slug selects from the server's own artifact; drafts and unknown slugs resolve to nothing. */
export function getPostNote(rawSlug: string): PostNote | null {
  if (!isPublishedPostSlug(rawSlug)) return null;
  const slug = toPublishedPostSlug(rawSlug);
  const note = Object.hasOwn(posts, slug) ? posts[slug] : undefined;
  if (!note || note.sections.length === 0) return null;
  return { slug, ...note };
}

export const postUrl = (note: Pick<PostNote, 'slug'>) => `/blog/${note.slug}`;

/** The note as a source chip target; its text is carried by the structured context, not this chunk. */
export const noteSource = (note: PostNote): Chunk => ({
  id: `post:${note.slug}`,
  title: note.title,
  url: postUrl(note),
  text: '',
});

export const noteHeadings = (note: PostNote): string[] =>
  note.sections.flatMap((s) => (s.heading ? [s.heading] : []));

/** Every section in order with its code, bounded by MAX_NOTE_CHARS. */
export function noteText(note: PostNote): string {
  const parts: string[] = [];
  let size = 0;
  for (const s of note.sections) {
    const block = [
      s.heading ? `${'#'.repeat(Math.max(2, s.level))} ${s.heading}` : '',
      s.text,
      ...s.code.map((c) => `\`\`\`\n${c}\n\`\`\``),
    ]
      .filter(Boolean)
      .join('\n');
    if (size + block.length > MAX_NOTE_CHARS) {
      parts.push('[The rest of the note is omitted for length.]');
      break;
    }
    parts.push(block);
    size += block.length;
  }
  return parts.join('\n\n');
}

/**
 * Question mode only: top BM25 hits from the index excluding the note's own chunks, plus the
 * canonical facts chunk. Summary mode never calls this (the note is its whole context).
 */
export function fallbackChunks(
  note: PostNote,
  question: string,
  idx: Bm25 = getIndex(),
): { related: Chunk[]; facts: Chunk[] } {
  const own = postUrl(note);
  const facts = idx.docs.filter((d) => d.id.startsWith('facts:'));
  const related = idx
    .search(question, 12)
    .map((h) => h.chunk)
    .filter((c) => !c.id.startsWith('facts:') && c.url !== own)
    .slice(0, MAX_FALLBACK_CHUNKS);
  return { related, facts };
}
