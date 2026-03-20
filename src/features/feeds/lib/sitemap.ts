// src/features/feeds/lib/sitemap.ts
import type { Post } from '../../blog/types'

const SITE_URL = 'https://piyushmehta.com'

const STATIC_PAGES = ['/', '/about', '/blog', '/projects', '/contact-me', '/uses']

export function generateSitemap(posts: Post[]): string {
  const today = new Date().toISOString().split('T')[0]

  const staticUrls = STATIC_PAGES.map(
    (path) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
  </url>`
  ).join('\n')

  const postUrls = posts
    .map((post) => {
      const lastmod = post.frontmatter.date.toISOString().split('T')[0]
      return `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${postUrls}
</urlset>`
}
