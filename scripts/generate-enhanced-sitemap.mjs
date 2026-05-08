// generate-enhanced-sitemap.mjs
// This script enhances the default Astro sitemap with additional SEO optimizations or generates a new one if needed

import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Add Sentry error monitoring for build scripts
let Sentry = null;
try {
  const sentryModule = await import('@sentry/node');
  Sentry = sentryModule;
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1, // Lower sample rate for build scripts
    });
  }
} catch (e) {
  // Sentry not available, continue without monitoring
  console.warn('Sentry not initialized for build scripts. Continuing without monitoring.', e);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Possible locations of the sitemap.xml file based on different build outputs
const possibleSitemapPaths = [
  path.join(__dirname, '..', 'dist', 'sitemap.xml'), // Standard static output
  path.join(__dirname, '..', '.vercel', 'output', 'static', 'sitemap.xml'), // Vercel static output
  path.join(__dirname, '..', 'public', 'sitemap.xml'), // Fallback location to generate
];

// The base URL for the site
const SITE_URL = 'https://piyushmehta.com';

/**
 * Escape XML special characters to prevent malformed XML
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validates if XML content is well-formed
 */
function isValidXml(xmlContent) {
  try {
    // Basic XML validation checks
    const hasXmlDeclaration = xmlContent.includes('<?xml');
    const hasUrlsetOpen = xmlContent.includes('<urlset');
    const hasUrlsetClose = xmlContent.includes('</urlset>');
    const balancedUrls =
      (xmlContent.match(/<url>/g) || []).length === (xmlContent.match(/<\/url>/g) || []).length;

    return hasXmlDeclaration && hasUrlsetOpen && hasUrlsetClose && balancedUrls;
  } catch (_error) {
    return false;
  }
}

/**
 * Main function to enhance the sitemap
 */
async function enhanceSitemap() {
  console.log('Enhancing sitemap.xml for SEO optimization...');

  // Find the existing sitemap file
  let sitemapPath = null;
  let sitemapContent = null;
  let isCorrupted = false;

  for (const potentialPath of possibleSitemapPaths) {
    if (fs.existsSync(potentialPath)) {
      sitemapPath = potentialPath;
      console.log(`Found sitemap at: ${sitemapPath}`);
      sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

      // Validate the existing sitemap
      if (!isValidXml(sitemapContent)) {
        console.warn(
          `Existing sitemap at ${sitemapPath} is corrupted or malformed. Will regenerate.`
        );
        isCorrupted = true;
        sitemapContent = null;
      }
      break;
    }
  }

  // If no sitemap found or corrupted, generate a new one in public folder
  if (!sitemapPath || !sitemapContent || isCorrupted) {
    sitemapPath = possibleSitemapPaths[2]; // public/sitemap.xml
    console.log(
      `${!sitemapPath ? 'No existing sitemap found' : 'Corrupted sitemap detected'}, will generate a new one at: ${sitemapPath}`
    );
    sitemapContent = generateBaseSitemap();
  }

  try {
    // Add additional sitemap entries for key pages with high priority
    const highPriorityUrls = [
      { url: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
      { url: `${SITE_URL}/blog/`, priority: '0.9', changefreq: 'daily' },
      { url: `${SITE_URL}/services/`, priority: '0.9', changefreq: 'weekly' },
      { url: `${SITE_URL}/projects/`, priority: '0.8', changefreq: 'weekly' },
      { url: `${SITE_URL}/about/`, priority: '0.8', changefreq: 'monthly' },
      {
        url: `${SITE_URL}/contact-me/`,
        priority: '0.8',
        changefreq: 'monthly',
      },
      { url: `${SITE_URL}/resume/`, priority: '0.8', changefreq: 'monthly' },
      { url: `${SITE_URL}/uses/`, priority: '0.7', changefreq: 'monthly' },
      {
        url: `${SITE_URL}/react-developer/`,
        priority: '0.9',
        changefreq: 'weekly',
      },
    ];

    // Get blog posts to add to sitemap
    const blogPosts = await getBlogPosts();

    // Combine high priority URLs with blog posts
    const allUrls = [...highPriorityUrls, ...blogPosts];

    // Generate clean sitemap from scratch to avoid malformed XML issues
    const currentDate = new Date().toISOString();
    const urlEntries = allUrls
      .map(
        ({ url, priority, changefreq }) =>
          `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
      )
      .join('\n');

    // Generate complete sitemap
    sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;

    // Ensure the directory exists
    const dir = path.dirname(sitemapPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Validate the generated sitemap before writing
    if (isValidXml(sitemapContent)) {
      // Write the enhanced sitemap back to the file
      fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
      console.log(`Sitemap successfully generated at: ${sitemapPath}`);
      console.log(`Added ${allUrls.length} URLs to the sitemap`);
    } else {
      throw new Error('Generated sitemap failed XML validation');
    }
  } catch (error) {
    console.error('Error enhancing sitemap:', error);

    // Log to Sentry if available
    if (Sentry) {
      Sentry.captureException(error, {
        tags: {
          script: 'generate_enhanced_sitemap',
          operation: 'enhance_sitemap',
        },
        extra: {
          sitemapPath: sitemapPath,
        },
      });
    }
  }
}

/**
 * Generates a basic sitemap XML structure if none exists
 */
function generateBaseSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
</urlset>`;
}

/**
 * Get blog posts from content directory
 */
async function getBlogPosts() {
  const blogUrls = [];
  const projectRoot = path.join(__dirname, '..');
  const contentDir = path.join(projectRoot, 'src', 'content', 'blog');

  if (!fs.existsSync(contentDir)) {
    console.warn('Blog content directory not found:', contentDir);
    return blogUrls;
  }

  // Get all blog directories
  const blogDirs = fs
    .readdirSync(contentDir)
    .filter((dir) => fs.statSync(path.join(contentDir, dir)).isDirectory());

  for (const blogDir of blogDirs) {
    // Format the blog URL correctly
    const blogUrl = `${SITE_URL}/blog/${blogDir}/`;

    // Add to blog URLs with appropriate priority and change frequency
    blogUrls.push({
      url: blogUrl,
      priority: '0.7',
      changefreq: 'monthly',
    });
  }

  console.log(`Found ${blogUrls.length} blog posts to add to sitemap`);
  return blogUrls;
}

// Execute the function when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  enhanceSitemap().catch(console.error);
}

// Export the function for potential use in other scripts
export default enhanceSitemap;
