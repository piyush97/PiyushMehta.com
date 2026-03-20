// src/routes/api/rss[.]xml.ts
import { createAPIFileRoute } from '@tanstack/start/api'
import { listPosts } from '../../features/blog/lib/service'
import { generateRss } from '../../features/feeds/lib/rss'

export const APIRoute = createAPIFileRoute('/rss.xml')({
  GET: async () => {
    const result = listPosts()
    if (!result.ok) {
      return new Response('Internal Server Error', { status: 500 })
    }
    const xml = generateRss(result.data)
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  },
})
