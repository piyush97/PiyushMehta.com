# Piyush Mehta - Personal Website

![Screenshot of the application](/.github/hero.jpg)

A modern, fast, and SEO-optimized personal website built with Astro, showcasing my work as a Senior Software Engineer, Tech Speaker, and Open Source Contributor.

## 🚀 Features

- **Lightning Fast**: Built with Astro 5.x for optimal performance with server-side rendering
- **PWA Ready**: Full-featured Progressive Web App with offline support and app-like features
- **Interactive Components**: Glass morphism UI with hover effects and smooth animations
- **Command Palette**: Global search and navigation with ⌘+K keyboard shortcuts
- **Full-Text Search**: Fast, client-side search powered by Pagefind
- **Smart Prefetching**: Near-instant navigation with intelligent prefetching
- **Enhanced Code Blocks**: Syntax highlighting with copy-to-clipboard functionality
- **Reading Progress**: Visual progress indicators and reading time estimates
- **Post Reactions**: Interactive engagement with glass morphism design
- **Related Posts**: Intelligent post recommendations based on content similarity
- **GitHub Comments**: Integrated Giscus comment system powered by GitHub Discussions
- **Optimized Images**: Responsive, modern image formats (WebP, AVIF) with lazy loading
- **SEO Optimized**: Comprehensive meta tags, Open Graph, Twitter Cards, and structured data
- **Dynamic OG Images**: Automatically generated Open Graph images using @vercel/og
- **Responsive Design**: Mobile-first design that looks great on all devices
- **Blog Support**: Full-featured blog with MDX support and article metadata
- **Type Safe**: Built with TypeScript for better development experience
- **Modern Stack**: Astro 5.x, TypeScript, Tailwind CSS, React, MDX
- **ISR Support**: Incremental Static Regeneration for optimal performance
- **Database Integration**: PostgreSQL integration for dynamic content
- **Newsletter Security**: Enterprise-grade newsletter subscription with Redis-based rate limiting
- **Web Analytics**: Built-in Vercel Web Analytics support
- **Comprehensive Testing**: E2E tests with Playwright for all interactive components

## 🛠️ Tech Stack

- **Framework**: [Astro 5.x](https://astro.build/) - Full-stack web framework with SSR support
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **UI Components**: [React](https://react.dev/) - For interactive components
- **Content**: [MDX](https://mdxjs.com/) for enhanced blog posts and content
- **Search**: [Pagefind](https://pagefind.app/) - Fully static search library
- **Database**: [PostgreSQL](https://www.postgresql.org/) - For dynamic content and data
- **Linting & Formatting**: [Biome](https://biomejs.dev/) - Fast formatter and linter for JavaScript, TypeScript, and more
- **OG Images**: [@vercel/og](https://vercel.com/docs/functions/og-image-generation) - Dynamic Open Graph image generation
- **Redis**: [Upstash Redis](https://upstash.com/) - Serverless Redis for rate limiting and caching
- **Deployment**: [Vercel](https://vercel.com/) - Optimized for Astro with ISR support
- **SEO**: Custom SEO components with structured data and sitemap generation

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/piyush97/piyushmehta.com.git
   cd piyushmehta.com
   ```

2. **Install dependencies**

   ```bash
   # Using Bun (recommended)
   bun install
   
   # Or using npm
   npm install
   
   # Or using yarn
   yarn install
   
   # Or using pnpm
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Update the environment variables:

   ```env
   SITE_URL=https://piyushmehta.com
   DATABASE_URL=your_postgresql_connection_string
   
   # Newsletter Security (optional)
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   ```

## 🚀 Development

Start the development server:

```bash
# Using Bun (recommended)
bun run dev

# Or using npm
npm run dev

# Or using yarn
yarn dev

# Or using pnpm
pnpm dev
```

The site will be available at `http://localhost:4321`

### Available Scripts

- `bun run dev` / `npm run dev` - Start development server
- `bun run build` / `npm run build` - Build for production, including search indexing
- `bun run preview` / `npm run preview` - Preview production build locally
- `bun run astro` / `npm run astro` - Run Astro CLI commands

#### Code Quality Scripts

- `bun run lint` - Lint source files with Biome
- `bun run lint:fix` - Lint and auto-fix source files
- `bun run format` - Format all files with Biome
- `bun run check` - Run comprehensive check (lint + format)
- `bun run check:write` - Check and auto-fix all issues
- `bun run ci` - CI-friendly check (no auto-fix)
- `bun run test` - Run Playwright E2E tests for all components

## 📁 Project Structure

```
/
├── public/                 # Static assets, service worker, manifest.json
├── src/
│   ├── app/               # Application logic and utilities
│   ├── assets/            # Static assets (images, fonts, etc.)
│   ├── components/        # Reusable UI components (Astro & React)
│   ├── content/           # Content collections (blog posts, etc.)
│   ├── layouts/           # Page layouts
│   ├── pages/             # File-based routing
│   │   ├── api/           # API routes
│   │   ├── blog/          # Blog pages
│   │   └── offline.astro  # Offline fallback page
│   ├── styles/            # Global styles
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── astro.config.mjs       # Astro configuration
├── tailwind.config.mjs    # Tailwind configuration
├── bun.lock               # Bun lockfile
└── package.json           # Dependencies and scripts
```

## 🎨 Key Features & Components

### Interactive UI Components

#### Command Palette
Global search and navigation interface accessible via ⌘+K:
- **Universal Search**: Search through all content, pages, and actions
- **Keyboard Navigation**: Full keyboard support with arrow keys and shortcuts
- **Action Commands**: Quick access to theme switching, navigation, and utilities
- **Fuzzy Search**: Intelligent search with typo tolerance
- **Accessibility**: WCAG 2.1 AA compliant with screen reader support

#### Post Reactions
Interactive engagement system with glass morphism design:
- **Glass Morphism**: Modern UI with backdrop blur and transparency effects
- **Hover Animations**: Smooth glow effects and elevation changes
- **Local Storage**: Persistent reactions across sessions
- **Reaction Types**: Like, Helpful, Insightful, Bookmark, and Share
- **Analytics Tracking**: Event tracking for user engagement metrics

#### Enhanced Code Blocks
Professional code presentation with interactive features:
- **Syntax Highlighting**: Accurate language detection and highlighting
- **Copy to Clipboard**: One-click code copying with visual feedback
- **Language Labels**: Clear language identification for each block
- **Accessibility**: Keyboard navigation and screen reader support
- **Theme Aware**: Adapts to site theme preferences

#### Reading Progress
Visual progress tracking for blog posts:
- **Progress Bar**: Smooth progress indication as users scroll
- **Reading Time**: Accurate time estimates based on content length
- **Smooth Animations**: Fluid progress updates with optimized performance
- **Mobile Optimized**: Responsive design for all screen sizes

#### Related Posts
Intelligent content discovery based on similarity:
- **Tag-Based Matching**: Content recommendations using shared tags
- **Visual Cards**: Rich previews with images and metadata
- **Navigation**: Seamless transitions between related content
- **Accessibility**: Full keyboard navigation and ARIA labels

#### GitHub Comments (Giscus)
Integrated comment system powered by GitHub Discussions:
- **GitHub Authentication**: Secure login via GitHub accounts
- **Rich Formatting**: Full markdown support in comments
- **Moderation**: Built-in moderation through GitHub's systems
- **Reactions**: GitHub-style emoji reactions on comments
- **Email Notifications**: Automatic notifications for new comments

### Progressive Web App (PWA)

The website is a fully-featured PWA with:
- **Service Worker**: For offline caching, background sync, and push notifications.
- **Web App Manifest**: Allows users to install the site on their devices.
- **Offline Support**: A dedicated offline page ensures a good user experience without a connection.
- **App-like Experience**: Includes app shortcuts, standalone display mode, and seamless updates.

### Full-Text Search

Client-side search powered by **Pagefind**:
- **Instant Results**: Real-time search with debouncing for a smooth experience.
- **Keyboard Navigation**: Fully accessible with arrow keys, enter, and escape.
- **Result Highlighting**: Search terms are highlighted in the results.
- **Global Shortcut**: Access search from anywhere with `Ctrl+K` or `Cmd+K`.

### Smart Prefetching

Near-instant navigation using an intelligent prefetching strategy:
- **Connection-Aware**: Respects user's data saver settings.
- **Multiple Strategies**: Prefetches on viewport entry, hover, or tap.
- **Critical Pages**: Prioritizes prefetching of key pages like blog, projects, and about.

### Image Optimization

Advanced image optimization with the `OptimizedImage.astro` component:
- **Modern Formats**: Serves WebP and AVIF with fallbacks for older browsers.
- **Responsive `srcset`**: Delivers the right image size for every screen.
- **Lazy Loading**: Images are loaded progressively as they enter the viewport.

### SEO Component

The SEO components provide comprehensive SEO features:
- Meta tags for search engines
- Open Graph tags for social media
- Twitter Card support
- Structured data (JSON-LD)
- Article-specific metadata
- Canonical URLs

### Open Graph Images

Dynamic OG image generation using Vercel's OG image service with customizable:
- Title and description
- Article type and date
- Tags and categories
- Custom branding and styling

### Newsletter Subscription Security

Enterprise-grade newsletter subscription with comprehensive security:
- **Redis Rate Limiting**: Persistent rate limiting with Upstash Redis support
- **Bot Protection**: Honeypot fields, User-Agent validation, and browser signature verification
- **Email Security**: Disposable email domain blocking and email sanitization
- **CAPTCHA Integration**: Optional Google reCAPTCHA v3 support
- **IP Allowlisting**: CIDR range support for trusted sources
- **Security Monitoring**: Real-time alerting and comprehensive analytics
- **Failed Attempt Blocking**: Progressive blocking with exponential backoff

See `NEWSLETTER_SECURITY.md` for detailed setup and configuration.

### Server-Side Rendering

The site uses Astro's SSR capabilities with:
- Dynamic content rendering
- Database integration
- API routes for dynamic functionality
- Incremental Static Regeneration (ISR) for optimal performance

## 📝 Content Management

### Blog Posts

Create blog posts in the `src/content/` directory using MDX:

```markdown
---
title: 'Your Post Title'
description: 'Post description for SEO'
publishedTime: 2024-01-01
tags: ['react', 'javascript']
image: '/path/to/image.jpg'
---

Your content here with MDX support for React components...
```

### Content Collections

The site uses Astro's content collections for type-safe content management:
- Blog posts with frontmatter validation
- Automatic type generation
- Built-in content querying and filtering

## 🔧 Configuration

### Astro Config

Key configurations in `astro.config.mjs`:
- **Server Output**: Configured for server-side rendering
- **Site URL**: Set for canonical links and sitemap generation
- **Integrations**: MDX, React, Sitemap, Tailwind CSS
- **Vercel Adapter**: With Web Analytics, Image Service, and ISR enabled
- **Image Optimization**: Domains and formats configured for `astro:assets`.
- **Prefetching**: Global prefetch configuration enabled.

### SEO Defaults

Default SEO settings can be customized in the SEO components located in `src/components/`.

### Database Configuration

PostgreSQL integration for dynamic content and data storage. Configure your database connection in the environment variables.

## 🚀 Deployment

### Vercel (Recommended)

This site is optimized for Vercel deployment with:
1. **Automatic Deployment**: Connect your GitHub repository to Vercel
2. **Environment Variables**: Set required environment variables in Vercel dashboard
3. **ISR Support**: Incremental Static Regeneration for optimal performance
4. **Web Analytics**: Built-in analytics support
5. **Image Optimization**: Automatic image optimization and serving

### Manual Build

The build process is now a multi-step process that includes search indexing and sitemap generation.

```bash
# Using Bun (recommended)
bun run build
bun run preview  # Preview the build locally

# Or using npm
npm run build
npm run preview  # Preview the build locally
```

The `build` script now runs the following commands:
`node migrate-images-to-public.mjs && astro build && npx pagefind --site dist && node generate-enhanced-sitemap.mjs && node generate-static-rss.mjs`

### Environment Variables for Production

```env
SITE_URL=https://your-domain.com
DATABASE_URL=your_postgresql_connection_string

# Newsletter Security (optional)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
NEWSLETTER_ADMIN_TOKEN=your_secure_admin_token
```

## 🔍 SEO Features

- **Meta Tags**: Comprehensive meta tags for search engines
- **Open Graph**: Rich social media previews with dynamic image generation
- **Twitter Cards**: Optimized Twitter sharing with custom cards
- **Structured Data**: JSON-LD for enhanced search results
- **Sitemap**: Automatic sitemap generation with custom pages
- **Canonical URLs**: Prevent duplicate content issues
- **Performance**: Optimized for Core Web Vitals and search rankings
- **RSS Feed**: Automatic RSS feed generation for blog posts

## 📊 Performance & Features

- **Lighthouse Score**: 100/100 across all metrics
- **PWA-Ready**: Installable, offline-capable, and app-like.
- **Interactive Components**: Glass morphism UI with smooth animations
- **Command Palette**: Universal search and navigation with ⌘+K
- **Enhanced Code Blocks**: Syntax highlighting with copy functionality
- **Reading Progress**: Visual progress tracking and time estimates
- **Post Reactions**: Engaging interaction system with analytics
- **GitHub Comments**: Integrated Giscus comment system
- **Related Posts**: Intelligent content recommendations
- **Full-Text Search**: Fast, client-side search.
- **Smart Prefetching**: Near-instant page loads.
- **Server-Side Rendering**: Fast initial page loads with SSR
- **Incremental Static Regeneration**: Optimal performance with fresh content
- **Image Optimization**: Automatic image optimization with Vercel's Image Service
- **Bundle Optimization**: Minimal JavaScript footprint with Astro's islands architecture
- **Database Integration**: PostgreSQL for dynamic content and analytics
- **Web Analytics**: Built-in Vercel Web Analytics support
- **E2E Testing**: Comprehensive Playwright test coverage for all components

## 🛠️ Development Tools & Scripts

The project includes several utility scripts for content migration and maintenance:

- `migrate-blog-posts.mjs` - Script for migrating blog posts from other platforms
- `migrate-content.mjs` - General content migration utility
- `migrate-images-to-public.mjs` - Image migration and optimization script
- `fix-image-paths.mjs` - Fix image path references in content
- `fix-images.mjs` - Batch image processing and optimization

### Additional Setup Guides

- `GITHUB_SETUP.md` - GitHub integration and CI/CD setup guide
- `NEWSLETTER_SECURITY.md` - Comprehensive newsletter security setup and configuration
- `.env.newsletter.example` - Newsletter security environment configuration template

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📧 Contact

- **Website**: [piyushmehta.com](https://piyushmehta.com)
- **GitHub**: [@piyush97](https://github.com/piyush97)
- **LinkedIn**: [/in/piyush24](https://linkedin.com/in/piyush24)
- **Twitter**: [@piyushmehtas](https://twitter.com/piyushmehtas)

---

**Built with ❤️ by Piyush Mehta in Toronto, CA 🇨🇦**

This website showcases modern web development practices with Astro 5.x, server-side rendering, and optimal performance. Feel free to reach out for collaborations, feedback, or just to say hi!

*Last updated: June 2025*
