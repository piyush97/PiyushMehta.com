// dynamic-sitemap.mjs - Script to enhance sitemap generation with dynamic entries and priority

import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to format date in ISO format
const formatDate = (date) => {
  return date.toISOString();
};

// Function to generate the XML for a sitemap URL entry
const generateUrlEntry = ({ url, lastmod, changefreq, priority }) => {
  return `
  <url>
    <loc>${url}</loc>
    ${lastmod ? `<lastmod>${formatDate(lastmod)}</lastmod>` : ''}
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}
    ${priority ? `<priority>${priority}</priority>` : ''}
  </url>`;
};

// Main function to generate the sitemap
export const generateSitemap = async (outputPath) => {
  try {
    console.log('Starting dynamic sitemap generation...');

    // Define high-priority static pages
    const staticPages = [
      {
        url: 'https://piyushmehta.com/',
        lastmod: new Date(),
        changefreq: 'daily',
        priority: '1.0',
      },
      {
        url: 'https://piyushmehta.com/blog/',
        lastmod: new Date(),
        changefreq: 'daily',
        priority: '0.9',
      },
      {
        url: 'https://piyushmehta.com/services/',
        lastmod: new Date(),
        changefreq: 'weekly',
        priority: '0.9',
      },
      {
        url: 'https://piyushmehta.com/react-developer/',
        lastmod: new Date(),
        changefreq: 'weekly',
        priority: '0.9',
      },
      {
        url: 'https://piyushmehta.com/about/',
        lastmod: new Date(),
        changefreq: 'monthly',
        priority: '0.8',
      },
      {
        url: 'https://piyushmehta.com/contact-me/',
        lastmod: new Date(),
        changefreq: 'monthly',
        priority: '0.8',
      },
      {
        url: 'https://piyushmehta.com/resume/',
        lastmod: new Date(),
        changefreq: 'monthly',
        priority: '0.8',
      },
      {
        url: 'https://piyushmehta.com/uses/',
        lastmod: new Date(),
        changefreq: 'monthly',
        priority: '0.7',
      },
    ];

    // Add blog posts (this would normally be dynamic, using a database or file system query)
    // In a real implementation, you'd want to fetch these dynamically from your content system
    const blogPosts = [
      // Example blog posts - in a real implementation, you would generate these from your content system
      {
        url: 'https://piyushmehta.com/blog/astro-v5-9-content-security-policy/',
        lastmod: new Date('2023-05-15'),
        changefreq: 'monthly',
        priority: '0.7',
      },
      {
        url: 'https://piyushmehta.com/blog/chat-bot/',
        lastmod: new Date('2023-04-20'),
        changefreq: 'monthly',
        priority: '0.7',
      },
      {
        url: 'https://piyushmehta.com/blog/hacktoberfest/',
        lastmod: new Date('2023-10-01'),
        changefreq: 'yearly',
        priority: '0.7',
      },
      {
        url: 'https://piyushmehta.com/blog/how-to-make-your-own-blog/',
        lastmod: new Date('2023-03-10'),
        changefreq: 'monthly',
        priority: '0.8',
      },
      {
        url: 'https://piyushmehta.com/blog/Kubenetes-Docker/',
        lastmod: new Date('2023-02-25'),
        changefreq: 'monthly',
        priority: '0.7',
      },
      {
        url: 'https://piyushmehta.com/blog/leveraging-ai-in-coding-workflow/',
        lastmod: new Date('2023-06-05'),
        changefreq: 'monthly',
        priority: '0.7',
      },
      {
        url: 'https://piyushmehta.com/blog/micro-frontends/',
        lastmod: new Date('2023-01-20'),
        changefreq: 'monthly',
        priority: '0.7',
      },
    ];

    // Combine all URLs
    const allUrls = [...staticPages, ...blogPosts];

    // Start generating the sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add all URLs to the sitemap
    for (const urlData of allUrls) {
      sitemap += generateUrlEntry(urlData);
    }

    // Close the sitemap
    sitemap += `
</urlset>`;

    // Write the sitemap to the output file
    fs.writeFileSync(outputPath, sitemap);

    console.log(`Sitemap successfully generated at ${outputPath}`);

    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
};

// When running this script directly, generate the sitemap to the public directory
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputPath = path.join(__dirname, 'public', 'sitemap.xml');
  generateSitemap(outputPath).catch(console.error);
}

export default generateSitemap;
