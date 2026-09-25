export type BlogRecommendationEntry = {
  readonly id: string;
  readonly data: {
    readonly date: Date;
    readonly tags?: readonly string[];
    readonly draft?: boolean;
  };
};

export type BlogRecommendation<TEntry extends BlogRecommendationEntry> = {
  readonly entry: TEntry;
  readonly similarity: number;
  readonly matchingTags: readonly string[];
};

export type BlogRecommendationOptions = {
  readonly currentSlug: string;
  readonly currentTags: readonly string[];
  readonly excludeSlugs?: readonly string[];
  readonly limit: number;
};

export const toBlogPostSlug = (id: string): string =>
  id.replace(/\.(md|mdx)$/, '').replace(/\/index$/, '');

const uniqueTags = (tags: readonly string[]): ReadonlyMap<string, string> => {
  const tagsByNormalizedValue = new Map<string, string>();

  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase();
    if (!tagsByNormalizedValue.has(normalizedTag)) {
      tagsByNormalizedValue.set(normalizedTag, tag);
    }
  }

  return tagsByNormalizedValue;
};

export const selectBlogRecommendations = <TEntry extends BlogRecommendationEntry>(
  publishedEntries: readonly TEntry[],
  options: BlogRecommendationOptions,
): readonly BlogRecommendation<TEntry>[] => {
  const currentSlug = toBlogPostSlug(options.currentSlug);
  const excludedSlugs = new Set((options.excludeSlugs ?? []).map(toBlogPostSlug));
  const currentTags = uniqueTags(options.currentTags);
  const limit = Math.max(0, Math.floor(options.limit));

  return publishedEntries
    .filter((entry) => {
      const slug = toBlogPostSlug(entry.id);
      return !entry.data.draft && slug !== currentSlug && !excludedSlugs.has(slug);
    })
    .map((entry): BlogRecommendation<TEntry> => {
      const entryTags = uniqueTags(entry.data.tags ?? []);
      const matchingTags = [...entryTags]
        .filter(([normalizedTag]) => currentTags.has(normalizedTag))
        .map(([, tag]) => tag);
      const unionSize = new Set([...entryTags.keys(), ...currentTags.keys()]).size;

      return {
        entry,
        similarity: unionSize === 0 ? 0 : matchingTags.length / unionSize,
        matchingTags,
      };
    })
    .sort((left, right) => {
      if (left.similarity !== right.similarity) {
        return right.similarity - left.similarity;
      }

      const dateDifference = right.entry.data.date.getTime() - left.entry.data.date.getTime();
      if (dateDifference !== 0) {
        return dateDifference;
      }

      const leftSlug = toBlogPostSlug(left.entry.id);
      const rightSlug = toBlogPostSlug(right.entry.id);
      return leftSlug < rightSlug ? -1 : leftSlug > rightSlug ? 1 : 0;
    })
    .slice(0, limit);
};
