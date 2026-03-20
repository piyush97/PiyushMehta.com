// src/features/feeds/lib/rss.ts
import type { Post } from '../../blog/types'

const SITE_URL = 'https://piyushmehta.com'

export function generateRss(posts: Post[]): string {
  const sorted = [...posts].sort(
    (a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime()
  )

  const items = sorted
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`
      const pubDate = post.frontmatter.date.toUTCString()
      return `    <item>
      <title><![CDATA[${post.frontmatter.title}]]></title>
      <link>${url}</link>
      <description><![CDATA[${post.frontmatter.description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${url}</guid>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Piyush Mehta</title>
    <link>${SITE_URL}</link>
    <description>Senior Software Engineer — articles on distributed systems, TypeScript, and cloud architecture</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`
}
