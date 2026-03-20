// src/routes/api/sitemap[.]xml.ts
import { createAPIFileRoute } from '@tanstack/start/api'
import { listPosts } from '../../features/blog/lib/service'
import { generateSitemap } from '../../features/feeds/lib/sitemap'

export const APIRoute = createAPIFileRoute('/sitemap.xml')({
  GET: async () => {
    const result = listPosts()
    const posts = result.ok ? result.data : []
    const xml = generateSitemap(posts)
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  },
})
