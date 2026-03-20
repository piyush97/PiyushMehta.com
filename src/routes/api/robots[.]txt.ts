// src/routes/api/robots[.]txt.ts
import { createAPIFileRoute } from '@tanstack/start/api'

const ROBOTS_CONTENT = `User-agent: *
Allow: /

Sitemap: https://piyushmehta.com/sitemap.xml
`

export const APIRoute = createAPIFileRoute('/robots.txt')({
  GET: async () => {
    return new Response(ROBOTS_CONTENT, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  },
})
