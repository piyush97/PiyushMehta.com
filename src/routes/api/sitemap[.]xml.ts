// src/routes/api/sitemap[.]xml.ts
import { createAPIFileRoute } from '@tanstack/start/api'
import { listPosts } from '../../features/blog/lib/service'
import { generateSitemap } from '../../features/feeds/lib/sitemap'

export const APIRoute = createAPIFileRoute('/sitemap.xml')({
  GET: async () => {
    const result = listPosts()
    if (!result.ok) {
      return new Response('Internal Server Error', { status: 500 })
    }
    const xml = generateSitemap(result.data)
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  },
})
