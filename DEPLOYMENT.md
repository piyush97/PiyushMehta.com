# Cloudflare Pages Deployment Guide

This project has been migrated from Vercel to Cloudflare Pages. Follow these steps to deploy your site.

## Prerequisites

- Node.js 18+ installed
- Cloudflare account
- Wrangler CLI installed (comes with the project)

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deployment Steps

### 1. Authentication

First, log in to Cloudflare:

```bash
npm run cf:login
```

Verify authentication:

```bash
npm run cf:whoami
```

### 2. Build the Project

```bash
npm run build
```

### 3. Deploy

Deploy to production:

```bash
npm run deploy
```

Or deploy as preview:

```bash
npm run deploy:preview
```

## Configuration

The project uses the following configuration files:

- **wrangler.toml**: Cloudflare Pages configuration
- **public/_headers**: Security headers and cache control
- **astro.config.mjs**: Astro configuration with Cloudflare adapter

## Environment Variables

Set these in your Cloudflare Pages dashboard:

- `UPSTASH_REDIS_REST_URL`: Redis connection URL
- `UPSTASH_REDIS_REST_TOKEN`: Redis authentication token
- `POSTGRES_URL`: Database connection string (if using PostgreSQL)

## Features Supported

- Server-side rendering (SSR)
- API routes
- Static asset serving
- OG image generation (SVG)
- Newsletter subscription
- Search functionality
- RSS feeds
- Sitemap generation

## Build Process

The build process includes:

1. TypeScript type generation
2. Astro build with Cloudflare adapter
3. Static assets compilation
4. Server-side route configuration
5. Worker function bundling

## Troubleshooting

### Common Issues

1. **Authentication Error**: Run `npm run cf:login` to authenticate
2. **Build Errors**: Check TypeScript errors with `npm run build:check`
3. **Missing Dependencies**: Ensure all dependencies are installed with `npm install`

### Logs

Check deployment logs in the Cloudflare Pages dashboard or use:

```bash
npx wrangler pages deployment list
```

## Scripts Reference

- `npm run build` - Build for production (no TypeScript checks)
- `npm run build:check` - Build with TypeScript checks
- `npm run deploy` - Deploy to production
- `npm run deploy:preview` - Deploy as preview
- `npm run cf:login` - Login to Cloudflare
- `npm run cf:whoami` - Check authentication status

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)