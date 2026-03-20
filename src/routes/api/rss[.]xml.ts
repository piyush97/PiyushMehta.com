// src/routes/api/rss[.]xml.ts
import { createAPIFileRoute } from '@tanstack/start/api'
import { listPosts } from '../../features/blog/lib/service'
import { generateRss } from '../../features/feeds/lib/rss'

export const APIRoute = createAPIFileRoute('/rss.xml')({
  GET: async () => {
    const result = listPosts()
    const posts = result.ok ? result.data : []
    const xml = generateRss(posts)
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  },
})
