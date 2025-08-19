# Scripts Documentation

This directory contains all build, test, and migration utilities organized for better maintainability and developer experience.

## Directory Structure

```
scripts/
├── build/           # Build and generation utilities
├── test/            # Validation and testing scripts
├── migration/       # One-time migration tools
└── README.md        # This documentation
```

## Build Scripts (`/scripts/build/`)

These scripts are responsible for generating content and assets during the build process.

### `extract-critical-css.mjs`
**Purpose**: Extracts critical CSS for above-the-fold content optimization  
**Usage**: `npm run build:prepare` (part of build process)  
**Dependencies**: Requires existing CSS files and HTML structure  
**Output**: Critical CSS files in `src/styles/critical/`

### `generate-enhanced-sitemap.mjs`
**Purpose**: Creates SEO-optimized sitemap with priorities and change frequencies  
**Usage**: `npm run enhance-sitemap`  
**Dependencies**: Built site structure, blog content  
**Output**: Enhanced `sitemap.xml` in `dist/` or `public/`

### `generate-static-rss.mjs`
**Purpose**: Generates RSS feed for blog content  
**Usage**: `npm run generate-rss`  
**Dependencies**: Blog content in `src/content/blog/`  
**Output**: Static `rss.xml` file in `public/`

### `build.mjs`
**Purpose**: Custom build utilities and optimizations  
**Usage**: Used in build pipeline  
**Dependencies**: Project structure  
**Output**: Build artifacts and optimizations

## Test Scripts (`/scripts/test/`)

These scripts validate the functionality and output of various systems.

### `test-rss-output.mjs`
**Purpose**: Validates RSS feed XML syntax and content  
**Usage**: `npm run test:rss`  
**Dependencies**: Generated RSS file  
**Validates**: XML syntax, HTML contamination, required elements

### `test-seo-files.mjs`
**Purpose**: Comprehensive SEO file validation  
**Usage**: `npm run test-seo`  
**Dependencies**: Built site files  
**Validates**: Sitemap, RSS feed, robots.txt presence and validity

### `validate-og-images.mjs`
**Purpose**: Tests OG image generation for all blog articles  
**Usage**: `npm run validate-og`  
**Dependencies**: Running development server (localhost:4321)  
**Validates**: OG image generation, templates, themes

### `verify-rss.mjs`
**Purpose**: RSS feed verification and validation  
**Usage**: `npm run verify-rss`  
**Dependencies**: Generated RSS feed  
**Validates**: Feed structure and content accuracy

### `test-og-image.mjs`
**Purpose**: Basic OG image generation testing  
**Usage**: `npm run test:og`  
**Dependencies**: Font files, Satori library  
**Output**: Test OG image file

## Migration Scripts (`/scripts/migration/`)

These are one-time utility scripts for data migration and restructuring.

### `migrate-images-to-public.mjs`
**Purpose**: Migrates blog images from content to public directory  
**Usage**: `npm run migrate:images`  
**Dependencies**: Blog content with images  
**Output**: Images copied to `public/blog/`, updated MDX files  
**Note**: Run this when restructuring image organization

## NPM Script Commands

### Build Commands
```bash
npm run build                # Full production build
npm run build:prepare        # Pre-build preparation (CSS + images)
npm run build:astro          # Core Astro build
npm run build:postprocess    # Post-build optimization
npm run build:scripts        # Generate sitemap + RSS
```

### Individual Build Scripts
```bash
npm run enhance-sitemap      # Generate enhanced sitemap
npm run generate-rss         # Generate RSS feed
npm run migrate:images       # Migrate blog images
```

### Test Commands
```bash
npm run test:all-scripts     # Run all script validations
npm run test-seo            # Validate SEO files
npm run verify-rss          # Verify RSS feed
npm run validate-og         # Validate OG images
npm run test:rss            # Test RSS output
npm run test:og             # Test OG image generation
```

### Playwright Tests
```bash
npm run test                # Run E2E tests
npm run test:headed         # Run tests with browser UI
npm run test:ui             # Run tests with Playwright UI
npm run test:report         # Show test report
```

## Development Workflow

### For New Features
1. **Add new scripts** to appropriate category directory
2. **Update package.json** with new script commands
3. **Document the script** in this README
4. **Test thoroughly** before committing

### For Build Process
```bash
# Development build with validation
npm run build:prepare
npm run build:astro
npm run build:postprocess
npm run test:all-scripts
```

### For Content Changes
```bash
# After adding new blog posts
npm run enhance-sitemap
npm run generate-rss
npm run validate-og
```

## Script Dependencies

### Required Environment
- **Node.js**: v18+ with ES modules support
- **Development Server**: Required for OG image validation (`npm run dev`)
- **Build Output**: Required for sitemap and RSS generation

### External Dependencies
- **xmllint**: Optional for RSS XML validation (Unix systems)
- **Sharp**: Required for image processing
- **Satori**: Required for OG image generation

## Troubleshooting

### Common Issues

**Script not found errors:**
- Verify script paths in package.json match moved files
- Check file permissions on script files

**Build failures:**
- Ensure all dependencies are installed (`bun install`)
- Check if development server is running for OG tests
- Verify content directory structure exists

**RSS validation failures:**
- Check blog content frontmatter format
- Verify RSS file is not contaminated with HTML
- Ensure XML structure is valid

**OG image generation failures:**
- Verify development server is running on localhost:4321
- Check font files are present
- Validate blog post frontmatter has required fields

### Performance Notes

- **Build scripts** are optimized for production builds
- **Test scripts** should be run in development
- **Migration scripts** are one-time operations

## Contributing

When adding new scripts:

1. **Place in appropriate category** (build/test/migration)
2. **Follow naming convention**: `verb-noun.mjs`
3. **Add npm script command** with clear naming
4. **Include error handling** and logging
5. **Update this documentation**
6. **Test thoroughly** across environments

## Security Considerations

- **All scripts** run with Node.js permissions
- **Build scripts** have access to file system
- **Test scripts** may make network requests
- **Review dependencies** before adding new packages
- **Validate inputs** in scripts that process external data

---

**Last Updated**: August 2025  
**Total Scripts**: 8 scripts across 3 categories  
**Organization**: Build (4) | Test (5) | Migration (1)