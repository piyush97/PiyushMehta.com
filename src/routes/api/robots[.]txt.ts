// src/routes/api/robots[.]txt.ts
import { createAPIFileRoute } from '@tanstack/start/api'
import { SITE_URL } from '@/lib/config'

const ROBOTS_CONTENT = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`

export const APIRoute = createAPIFileRoute('/robots.txt')({
  GET: () => {
    return new Response(ROBOTS_CONTENT, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  },
})
