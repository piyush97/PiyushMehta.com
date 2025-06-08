# Piyush Mehta - Personal Website

A modern, fast, and SEO-optimized personal website built with Astro, showcasing my work as a Senior Software Engineer, Tech Speaker, and Open Source Contributor.

## 🚀 Features

- **Lightning Fast**: Built with Astro 5.x for optimal performance with server-side rendering
- **SEO Optimized**: Comprehensive meta tags, Open Graph, Twitter Cards, and structured data
- **Dynamic OG Images**: Automatically generated Open Graph images using @vercel/og
- **Responsive Design**: Mobile-first design that looks great on all devices
- **Blog Support**: Full-featured blog with MDX support and article metadata
- **Type Safe**: Built with TypeScript for better development experience
- **Modern Stack**: Astro 5.x, TypeScript, Tailwind CSS, React, MDX
- **ISR Support**: Incremental Static Regeneration for optimal performance
- **Database Integration**: PostgreSQL integration for dynamic content
- **Web Analytics**: Built-in Vercel Web Analytics support

## 🛠️ Tech Stack

- **Framework**: [Astro 5.x](https://astro.build/) - Full-stack web framework with SSR support
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **UI Components**: [React](https://react.dev/) - For interactive components
- **Content**: [MDX](https://mdxjs.com/) for enhanced blog posts and content
- **Database**: [PostgreSQL](https://www.postgresql.org/) - For dynamic content and data
- **Linting & Formatting**: [Biome](https://biomejs.dev/) - Fast formatter and linter for JavaScript, TypeScript, and more
- **OG Images**: [@vercel/og](https://vercel.com/docs/functions/og-image-generation) - Dynamic Open Graph image generation
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
- `bun run build` / `npm run build` - Build for production
- `bun run preview` / `npm run preview` - Preview production build locally
- `bun run astro` / `npm run astro` - Run Astro CLI commands

#### Code Quality Scripts

- `bun run lint` - Lint source files with Biome
- `bun run lint:fix` - Lint and auto-fix source files
- `bun run format` - Format all files with Biome
- `bun run check` - Run comprehensive check (lint + format)
- `bun run check:write` - Check and auto-fix all issues
- `bun run ci` - CI-friendly check (no auto-fix)

## 📁 Project Structure

```
/
├── public/                 # Static assets and generated files
├── src/
│   ├── app/               # Application logic and utilities
│   ├── assets/            # Static assets (images, fonts, etc.)
│   ├── components/        # Reusable UI components
│   ├── config/            # Configuration files
│   ├── content/           # Content collections (blog posts, etc.)
│   ├── i18n/              # Internationalization files
│   ├── images/            # Image assets
│   ├── layouts/           # Page layouts
│   ├── lib/               # Utility libraries and helpers
│   ├── pages/             # File-based routing
│   │   ├── api/           # API routes (OG image generation, etc.)
│   │   ├── blog/          # Blog posts and blog-related pages
│   │   └── index.astro    # Homepage
│   ├── styles/            # Global styles and CSS
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── astro.config.mjs       # Astro configuration
├── tailwind.config.mjs    # Tailwind configuration
├── bun.lock               # Bun lockfile
├── package-lock.json      # npm lockfile
└── package.json           # Dependencies and scripts
```

## 🎨 Key Components

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
- **Markdown**: Configured with GitHub Dark Dimmed theme for syntax highlighting

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

```bash
# Using Bun (recommended)
bun run build
bun run preview  # Preview the build locally

# Or using npm
npm run build
npm run preview  # Preview the build locally
```

### Environment Variables for Production

```env
SITE_URL=https://your-domain.com
DATABASE_URL=your_postgresql_connection_string
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
- **Server-Side Rendering**: Fast initial page loads with SSR
- **Incremental Static Regeneration**: Optimal performance with fresh content
- **Image Optimization**: Automatic image optimization with Vercel's Image Service
- **Bundle Optimization**: Minimal JavaScript footprint with Astro's islands architecture
- **Database Integration**: PostgreSQL for dynamic content and analytics
- **Web Analytics**: Built-in Vercel Web Analytics support

## 🛠️ Development Tools & Scripts

The project includes several utility scripts for content migration and maintenance:

- `migrate-blog-posts.mjs` - Script for migrating blog posts from other platforms
- `migrate-content.mjs` - General content migration utility
- `migrate-images-to-public.mjs` - Image migration and optimization script
- `fix-image-paths.mjs` - Fix image path references in content
- `fix-images.mjs` - Batch image processing and optimization

### Additional Setup Guides

- `GITHUB_SETUP.md` - GitHub integration and CI/CD setup guide
- `NEWSLETTER_SETUP.md` - Newsletter integration setup instructions

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
