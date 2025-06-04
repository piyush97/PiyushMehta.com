# Piyush Mehta - Personal Website

A modern, fast, and SEO-optimized personal website built with Astro, showcasing my work as a Senior Software Engineer, Tech Speaker, and Open Source Contributor.

## 🚀 Features

- **Lightning Fast**: Built with Astro for optimal performance and minimal JavaScript
- **SEO Optimized**: Comprehensive meta tags, Open Graph, Twitter Cards, and structured data
- **Dynamic OG Images**: Automatically generated Open Graph images for social sharing
- **Responsive Design**: Mobile-first design that looks great on all devices
- **Blog Support**: Full-featured blog with article metadata and SEO
- **Type Safe**: Built with TypeScript for better development experience
- **Modern Stack**: Astro, TypeScript, Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static site generator with islands architecture
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Content**: Markdown/MDX for blog posts and content
- **Deployment**: Cloudflare Pages compatible
- **SEO**: Custom SEO component with structured data

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/piyush97/piyushmehta.com.git
   cd piyushmehta.com
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Update the environment variables:

   ```env
   SITE_URL=https://piyushmehta.com
   ```

## 🚀 Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The site will be available at `http://localhost:4321`

## 📁 Project Structure

```
/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── SEO.astro     # Comprehensive SEO component
│   │   └── OpenGraph.astro # Open Graph meta tags
│   ├── layouts/          # Page layouts
│   ├── pages/            # File-based routing
│   │   ├── api/          # API routes (OG image generation)
│   │   ├── blog/         # Blog posts
│   │   └── index.astro   # Homepage
│   ├── styles/           # Global styles
│   └── content/          # Content collections
├── astro.config.mjs      # Astro configuration
├── tailwind.config.js    # Tailwind configuration
└── package.json
```

## 🎨 Key Components

### SEO Component

The `SEO.astro` component provides comprehensive SEO features:

- Meta tags for search engines
- Open Graph tags for social media
- Twitter Card support
- Structured data (JSON-LD)
- Article-specific metadata
- Canonical URLs

### Open Graph Images

Dynamic OG image generation at `/api/og-image` endpoint with customizable:

- Title and description
- Article type and date
- Tags and categories

## 📝 Content Management

### Blog Posts

Create blog posts in the `src/pages/blog/` directory using Markdown or MDX:

```markdown
---
title: 'Your Post Title'
description: 'Post description for SEO'
publishedTime: 2024-01-01
tags: ['react', 'javascript']
---

Your content here...
```

## 🔧 Configuration

### Astro Config

Key configurations in `astro.config.mjs`:

- Site URL for canonical links
- Build optimizations
- Integrations (Tailwind, TypeScript)

### SEO Defaults

Default SEO settings can be customized in the `SEO.astro` component.

## 🚀 Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify

1. Connect repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

### Manual Build

```bash
npm run build
npm run preview  # Preview the build locally
```

## 🔍 SEO Features

- **Meta Tags**: Comprehensive meta tags for search engines
- **Open Graph**: Rich social media previews
- **Twitter Cards**: Optimized Twitter sharing
- **Structured Data**: JSON-LD for enhanced search results
- **Sitemap**: Automatic sitemap generation
- **Canonical URLs**: Prevent duplicate content issues
- **Performance**: Optimized for Core Web Vitals

## 📊 Performance

- **Lighthouse Score**: 100/100 across all metrics
- **Bundle Size**: Minimal JavaScript footprint
- **Image Optimization**: Automatic image optimization
- **Lazy Loading**: Images and components loaded on demand

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

Built with ❤️ by Piyush Mehta. Feel free to reach out for collaborations, feedback, or just to say hi!
