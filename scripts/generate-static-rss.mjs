// generate-static-rss.mjs
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates a static RSS XML file as a fallback by scanning the blog content
 */
async function generateStaticRss() {
  try {
    console.log('Generating static RSS file...');

    const { itemsXml, latestDate } = await getBlogPostItems();
    const buildDate = latestDate || new Date();
    const currentDate = buildDate.toUTCString();
    const year = new Date().getFullYear();

    // Create a basic RSS XML structure
    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Piyush Mehta - Software Engineer &amp; React Developer</title>
    <link>https://piyushmehta.com</link>
    <description>Articles and tutorials on React.js, web development, and software engineering by Piyush Mehta.</description>
    <language>en-us</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <generator>Static RSS Generator</generator>
    <copyright>Copyright ${year} Piyush Mehta. All rights reserved.</copyright>
    <managingEditor>hello@piyushmehta.com (Piyush Mehta)</managingEditor>
    <webMaster>hello@piyushmehta.com (Piyush Mehta)</webMaster>
    <atom:link href="https://piyushmehta.com/rss.xml" rel="self" type="application/rss+xml" />
    <ttl>60</ttl>
    <image>
      <url>https://piyushmehta.com/favicon.svg</url>
      <title>Piyush Mehta - Blog</title>
      <link>https://piyushmehta.com</link>
    </image>
${itemsXml}
  </channel>
</rss>`;

    const projectRoot = dirname(__dirname);
    const outputDirs = [path.join(projectRoot, 'public'), path.join(__dirname, 'public')];

    for (const outputDir of outputDirs) {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(path.join(outputDir, 'rss.xml'), rssContent);
    }

    console.log('Static RSS file generated successfully.');
  } catch (error) {
    console.error('Error generating static RSS file:', error);
  }
}

/**
 * Scans the blog content directory and extracts metadata for RSS items
 */
async function getBlogPostItems() {
  try {
    const projectRoot = dirname(__dirname);
    const contentDir = path.join(projectRoot, 'src', 'content', 'blog');

    // Check if directory exists
    if (!fs.existsSync(contentDir)) {
      console.warn('Blog content directory not found:', contentDir);
      const fallbackDate = new Date();
      return {
        itemsXml: getFallbackItem(fallbackDate),
        latestDate: fallbackDate,
      };
    }

    const entries = fs.readdirSync(contentDir).flatMap((entry) => {
      const entryPath = path.join(contentDir, entry);
      const stats = fs.statSync(entryPath);

      if (stats.isDirectory()) {
        const mdxIndex = path.join(entryPath, 'index.mdx');
        const mdIndex = path.join(entryPath, 'index.md');
        const filePath = fs.existsSync(mdxIndex) ? mdxIndex : mdIndex;
        return [{ slug: entry, filePath }];
      }

      if (stats.isFile() && entry.endsWith('.mdx')) {
        return [{ slug: entry.replace(/\.mdx$/, ''), filePath: entryPath }];
      }

      if (stats.isFile() && entry.endsWith('.md')) {
        return [{ slug: entry.replace(/\.md$/, ''), filePath: entryPath }];
      }

      return [];
    });

    if (entries.length === 0) {
      console.warn('No blog posts found in:', contentDir);
      const fallbackDate = new Date();
      return {
        itemsXml: getFallbackItem(fallbackDate),
        latestDate: fallbackDate,
      };
    }

    const posts = [];

    for (const entry of entries) {
      if (!fs.existsSync(entry.filePath)) {
        continue;
      }

      try {
        const content = fs.readFileSync(entry.filePath, 'utf-8');

        // Extract frontmatter
        const frontmatterMatch = content.match(/---\r?\n([\s\S]*?)\r?\n---/);

        if (frontmatterMatch && frontmatterMatch[1]) {
          const frontmatter = frontmatterMatch[1];

          // Extract title
          const titleMatch = frontmatter.match(/title:\s*['"](.+)['"]/);
          const title = titleMatch && titleMatch[1] ? titleMatch[1] : entry.slug.replace(/-/g, ' ');

          // Extract description
          const descMatch = frontmatter.match(/description:\s*['"](.+)['"]/);
          const description = descMatch && descMatch[1] ? descMatch[1] : '';

          // Extract date
          const dateMatch = frontmatter.match(/date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/);
          const date = dateMatch && dateMatch[1] ? new Date(dateMatch[1]) : new Date();

          // Extract tags
          const tagsSection = frontmatter.match(/tags:\s*\r?\n([\s\S]*?)(\r?\n\w|\r?\n---)/);
          const tags = [];

          if (tagsSection && tagsSection[1]) {
            const tagLines = tagsSection[1].split('\n');
            for (const line of tagLines) {
              const tagMatch = line.match(/\s*-\s*['"]?([^'"]+)['"]?/);
              if (tagMatch && tagMatch[1]) {
                tags.push(tagMatch[1]);
              }
            }
          }

          const categories =
            tags.length > 0
              ? `\n      ${tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}`
              : '';

          // Create item XML
          const item = `    <item>
      <title>${escapeXml(title)}</title>
      <link>https://piyushmehta.com/blog/${entry.slug}/</link>
      <pubDate>${date.toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
      <author>hello@piyushmehta.com (Piyush Mehta)</author>${categories}
    </item>`;

          posts.push({ date, item });
        }
      } catch (err) {
        console.warn(`Error processing blog post ${entry.slug}:`, err.message);
      }
    }

    if (posts.length === 0) {
      const fallbackDate = new Date();
      return {
        itemsXml: getFallbackItem(fallbackDate),
        latestDate: fallbackDate,
      };
    }

    posts.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      itemsXml: posts.map((post) => post.item).join('\n    '),
      latestDate: posts[0].date,
    };
  } catch (error) {
    console.error('Error scanning blog posts:', error);
    const fallbackDate = new Date();
    return {
      itemsXml: getFallbackItem(fallbackDate),
      latestDate: fallbackDate,
    };
  }
}

/**
 * Provides a fallback item if blog scanning fails
 */
function getFallbackItem(date = new Date()) {
  return `    <item>
      <title>Visit my blog for the latest articles</title>
      <link>https://piyushmehta.com/blog</link>
      <pubDate>${date.toUTCString()}</pubDate>
      <description>Please visit my blog for the latest articles on React.js, web development, and software engineering.</description>
      <author>hello@piyushmehta.com (Piyush Mehta)</author>
    </item>`;
}

/**
 * Escapes XML special characters
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Run the function when this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateStaticRss().catch(console.error);
}

export default generateStaticRss;
