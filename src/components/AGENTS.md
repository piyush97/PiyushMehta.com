# Component Guidance

## OVERVIEW
Shared rendered UI and interactive article demos; score 12 (36 files, 378 declaration names, 16 export declarations, 25 incoming imports).

## WHERE TO LOOK
- `BlogFilter.astro`: search, category, sort, and reset controls for the writing list.
- `ArticleTableOfContents.astro`: desktop/mobile TOC markup and link lifecycle.
- `PostReactions.astro`: high-churn reaction UI and its `data-*` interface.
- `blog/`: eleven React explainer components; imports are all from React.
- `OptimizedImage.astro`: shared image rendering entry.

## CONVENTIONS
- Astro components receive typed inputs through local `Props` interfaces and `Astro.props`.
- Interactive article examples are isolated in `blog/`; `BloomFilterDemo` is a named React export.
- `data-*` attributes connect Astro-rendered markup to browser scripts. Treat selector names as an interface shared by both sides.
- The component tree has no barrel file; import the owning component directly.
- Some browser scripts mark initialized elements in `dataset` to avoid duplicate listeners after client navigation; preserve that guard when extending the same lifecycle.
- `BlogFilter.astro` uses IDs for labels and `data-filter-*` hooks for its DOM controller.
- The article TOC accepts Astro `MarkdownHeading` values and limits its caller-provided list to depth 2 and 3.
- Keep control labels and accessible names paired with their inputs/buttons when adding a filter or reaction.
- `PostReactions.astro` is a 756-line hotspot; inspect its existing markup and script before expanding its API.
- `PostReactions.astro` reads and writes through `/api/reactions`.
- Use the existing component props rather than reading route-specific globals inside shared UI.

## ANTI-PATTERNS
- Do not change a `data-*` selector in markup without updating every script that queries it.
- Do not turn a one-off article demonstration into a shared component without another consumer.
- Do not assume a component's visual markup is its only contract; inspect its `Props`, accessibility attributes, and browser selectors together.
- Do not add a barrel solely to shorten imports; current consumers import component files directly.
