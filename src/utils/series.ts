export interface SeriesPostInput {
  id: string;
  data: {
    title: string;
    date: Date;
    draft?: boolean;
    series?: string;
    seriesOrder?: number;
  };
}

export interface SeriesEntry {
  slug: string;
  title: string;
  date: Date;
}

export interface SeriesContext {
  name: string;
  total: number;
  /** 1-based position in the ordered series. */
  index: number;
  posts: SeriesEntry[];
  prev: SeriesEntry | null;
  next: SeriesEntry | null;
}

export const toSeriesSlug = (id: string): string =>
  id.replace(/\/index$/, '').replace(/\.(md|mdx)$/, '');

const toEntry = (post: SeriesPostInput): SeriesEntry => ({
  slug: toSeriesSlug(post.id),
  title: post.data.title,
  date: post.data.date,
});

/** Published posts of one series: seriesOrder first (unordered last), then date, then slug. */
export function getSeriesPosts(posts: SeriesPostInput[], name: string): SeriesEntry[] {
  return posts
    .filter((post) => !post.data.draft && post.data.series === name)
    .sort(
      (a, b) =>
        (a.data.seriesOrder ?? Infinity) - (b.data.seriesOrder ?? Infinity) ||
        a.data.date.getTime() - b.data.date.getTime() ||
        toSeriesSlug(a.id).localeCompare(toSeriesSlug(b.id)),
    )
    .map(toEntry);
}

/** Series context for a slug, or null when the post is unknown, a draft, or not in a series. */
export function getSeriesContext(posts: SeriesPostInput[], slug: string): SeriesContext | null {
  const current = posts.find((post) => toSeriesSlug(post.id) === slug);
  const name = current?.data.series?.trim();
  if (!current || current.data.draft || !name) return null;
  const entries = getSeriesPosts(posts, current.data.series as string);
  const position = entries.findIndex((entry) => entry.slug === slug);
  if (position === -1) return null;
  return {
    name,
    total: entries.length,
    index: position + 1,
    posts: entries,
    prev: entries[position - 1] ?? null,
    next: entries[position + 1] ?? null,
  };
}
