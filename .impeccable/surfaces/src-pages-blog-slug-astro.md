---
version: 1
slug: "src-pages-blog-slug-astro"
primary_target: "src/pages/blog/[slug].astro"
related_targets: ["src/components/ArticleMeta.astro","src/components/ArticleTableOfContents.astro","src/components/NextBestRead.astro","src/components/RelatedPosts.astro","src/components/PostReactions.astro","src/components/blog/BloomFilterDemo.tsx","src/components/blog/SystemComparison.tsx","src/components/blog/TechComparison.tsx","src/components/blog/SetupShowcase.tsx","src/styles/global.css"]
---

# Rendered article surface brief

## Scope and mode

- Surface: `src/pages/blog/[slug].astro`, its article-only child components, and legacy interactive evidence islands that render inside MDX articles.
- Mode: Read.
- Audience: engineers and technical leads who need to understand the argument, orient themselves quickly, find implementation detail, and continue to related field notes.
- Preserve MDX content, factual metadata, SEO/Pagefind contracts, TOC/deep links, sharing, reactions, next-read, related posts, theme behavior, keyboard access, and no-JavaScript content availability.
- Existing Evidence Ledger identity is fixed: no new palette, type system, or decorative world.

## Direction contract

THESIS: Make a rendered article read like a margin-ruled evidence ledger: one clear thesis, an orientation rail that stays close to the prose, and evidence or implementation cues that help a reader choose where to spend attention. Refuse the default blog arrangement of repeated metadata blocks, floating card stacks, and a disconnected recommendation tail.

OWN-WORLD: Ink-night and warm-paper surfaces, Muli for voice, Source Code Pro for dates/measurements, 1px semantic hairlines, tonal layering before shadow, and rare amber/rust signal for active navigation, focus, and action. The article keeps the shared navigation, theme controls, rounded control geometry, and existing content components; it does not introduce a second visual language.

STORY: The reader lands on the argument, can see how the note is organized before scrolling, reads in a comfortable 68–74ch measure, finds practical evidence at the point it matters, and finishes with a credible next field note. The signature interaction is a quiet reading spine: the active contents item and current section are marked by a single accent rule while the prose remains visually dominant.

FIRST VIEWPORT: A compact breadcrumb/back row, then the title and description as the dominant claim. A narrow record rail carries author, date, reading time, tags, share, and orientation facts; the desktop contents rail sits beside the first prose column, while mobile turns it into a compact expandable record panel before the prose. The featured image, when present, breaks the measure as evidence, not as a hero card. The first action is reading; continuation is visible at the close.

FORM: Chosen composition: Margin-ruled ledger. Position 1 of the three dealt structures, surface concept seed `737047f7`, mode `read`. The form is a two-column reading field with a sticky orientation rail, 68–74ch prose, restrained margin annotations, and a closing continuation ledger. It extends the established world rather than replacing it.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
