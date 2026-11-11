import { getCollection } from 'astro:content';
import { generateCanonicalUrl } from '../utils/og-generator';
import { getSeriesPosts } from '../utils/series';
import { toPostSlug } from '../utils/social-card-manifest';

export const prerender = true;

const SITE_NAME = 'Piyush Mehta';
const SUMMARY =
  'Personal site and technical blog of Piyush Mehta, a software engineer. Posts cover software architecture, AI workflows, platforms, and developer tooling.';

const pages: Array<[path: string, title: string, description: string]> = [
  ['/about', 'About', 'Background and engineering focus.'],
  ['/projects', 'Projects', 'Selected projects and case studies.'],
  ['/services', 'Services', 'Software engineering consulting engagements.'],
  ['/resume', 'Resume', 'Roles, skills, and education.'],
  ['/uses', 'Uses', 'Tools used for software engineering and writing.'],
  ['/contact-me', 'Contact', 'Ways to get in touch.'],
  ['/blog', 'Blog', 'Index of all published posts.'],
];

const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim();
const escapeLinkText = (value: string) => oneLine(value).replace(/([[\]])/g, '\\$1');

export async function GET(context: { site?: URL }) {
  const site = context.site?.toString() || 'https://piyushmehta.com';
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
  const url = (path: string) => generateCanonicalUrl(path, site);
  const line = (href: string, title: string, description?: string) =>
    `- [${escapeLinkText(title)}](${href})${description ? `: ${oneLine(description)}` : ''}`;

  const postLine = (post: (typeof posts)[number]) =>
    line(url(`/blog/${toPostSlug(post.id)}`), post.data.title, post.data.description);

  const seriesNames = [
    ...new Set(posts.flatMap((post) => (post.data.series ? [post.data.series] : []))),
  ].sort((a, b) => a.localeCompare(b));
  const inSeries = new Set(
    seriesNames.flatMap((name) => getSeriesPosts(posts, name)).map((e) => e.slug),
  );

  const seriesSections = seriesNames.map((name) => {
    const bySlug = new Map(posts.map((post) => [toPostSlug(post.id), post]));
    const entries = getSeriesPosts(posts, name).flatMap((entry) => {
      const post = bySlug.get(entry.slug);
      return post ? [postLine(post)] : [];
    });
    return `## Series: ${oneLine(name)}\n\n${entries.join('\n')}`;
  });

  const otherPosts = posts.filter((post) => !inSeries.has(toPostSlug(post.id)));

  const body = [
    `# ${SITE_NAME}`,
    `> ${SUMMARY}`,
    `## Pages\n\n${pages.map(([path, title, description]) => line(url(path), title, description)).join('\n')}`,
    ...seriesSections,
    `## Posts\n\n${otherPosts.map(postLine).join('\n')}`,
    `## Feeds\n\n${line(url('/rss.xml'), 'RSS feed', 'All published posts.')}\n${line(url('/sitemap.xml'), 'Sitemap', 'Canonical page URLs.')}`,
  ].join('\n\n');

  return new Response(`${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
