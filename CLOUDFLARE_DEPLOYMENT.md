# Cloudflare Deployment Guide

This project has been migrated from Vercel to Cloudflare Pages. Follow these steps to deploy:

## Prerequisites

1. Install Wrangler CLI globally:
   ```bash
   npm install -g wrangler
   # or
   bun install -g wrangler
   ```

2. Login to your Cloudflare account:
   ```bash
   wrangler login
   ```

## Deployment

### Option 1: Manual Deployment

1. Build the project:
   ```bash
   bun run build
   ```

2. Deploy to Cloudflare Pages:
   ```bash
   bun run deploy
   ```

### Option 2: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. Navigate to "Pages" → "Create a project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `bun run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)

## Environment Variables

If you have any environment variables, add them in the Cloudflare Pages dashboard under:
**Pages** → **Your Project** → **Settings** → **Environment variables**

## Custom Domain

To use a custom domain:

1. In Cloudflare Pages, go to your project
2. Navigate to **Custom domains**
3. Add your domain (e.g., `piyushmehta.com`)
4. Update your domain's DNS settings to point to Cloudflare

## Configuration Files

- `wrangler.toml` - Cloudflare Workers/Pages configuration
- `public/_headers` - HTTP headers configuration
- `public/_redirects` - URL redirects configuration

## Migration Changes

The following changes were made during migration from Vercel:

1. **Adapter**: Changed from `@astrojs/vercel` to `@astrojs/cloudflare`
2. **OG Images**: Simplified to use SVG instead of canvas-based generation
3. **Headers**: Moved from `vercel.json` to `public/_headers`
4. **Redirects**: Moved from `vercel.json` to `public/_redirects`
5. **Build**: Now uses Cloudflare Workers runtime

## Local Development

For local development that mimics Cloudflare environment:

```bash
bun run build
bun run cf:dev
```

## Troubleshooting

- **Build fails**: Check that all dependencies are compatible with Cloudflare Workers
- **Functions not working**: Ensure API routes are in `src/pages/api/` directory
- **Assets not loading**: Check that assets are in the `public/` directory
