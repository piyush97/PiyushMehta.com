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
    
    const currentDate = new Date().toUTCString();
    const year = new Date().getFullYear();
    
    // Get blog directories to create items
    const blogItems = await getBlogPostItems();
    
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
    
    ${blogItems}
  </channel>
</rss>`;

    // Ensure the public directory exists
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write the RSS file
    fs.writeFileSync(path.join(publicDir, 'rss.xml'), rssContent);
    
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
    const contentDir = path.join(__dirname, 'src', 'content', 'blog');
    
    // Check if directory exists
    if (!fs.existsSync(contentDir)) {
      console.warn('Blog content directory not found:', contentDir);
      return getFallbackItem();
    }
    
    // Get all blog post directories
    const blogDirs = fs.readdirSync(contentDir).filter(dir => 
      fs.statSync(path.join(contentDir, dir)).isDirectory()
    );
    
    if (blogDirs.length === 0) {
      console.warn('No blog posts found in:', contentDir);
      return getFallbackItem();
    }
    
    // Process each blog post
    const items = [];
    
    for (const blogDir of blogDirs) {
      const blogPath = path.join(contentDir, blogDir);
      const indexFile = path.join(blogPath, 'index.mdx');
      
      if (!fs.existsSync(indexFile)) {
        continue;
      }
      
      try {
        // Read the file content
        const content = fs.readFileSync(indexFile, 'utf-8');
        
        // Extract frontmatter
        const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch && frontmatterMatch[1]) {
          const frontmatter = frontmatterMatch[1];
          
          // Extract title
          const titleMatch = frontmatter.match(/title:\s*['"](.+)['"]/);
          const title = titleMatch && titleMatch[1] ? titleMatch[1] : blogDir.replace(/-/g, ' ');
          
          // Extract description
          const descMatch = frontmatter.match(/description:\s*['"](.+)['"]/);
          const description = descMatch && descMatch[1] ? descMatch[1] : '';
          
          // Extract date
          const dateMatch = frontmatter.match(/date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/);
          const date = dateMatch && dateMatch[1] ? new Date(dateMatch[1]).toUTCString() : new Date().toUTCString();
          
          // Extract tags
          const tagsSection = frontmatter.match(/tags:\s*\n([\s\S]*?)(\n\w|\n---)/);
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
          
          // Create item XML
          const item = `    <item>
      <title>${escapeXml(title)}</title>
      <link>https://piyushmehta.com/blog/${blogDir}/</link>
      <pubDate>${date}</pubDate>
      <description>${escapeXml(description)}</description>
      <author>hello@piyushmehta.com (Piyush Mehta)</author>
      ${tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
          
          items.push(item);
        }
      } catch (err) {
        console.warn(`Error processing blog post ${blogDir}:`, err.message);
      }
    }
    
    return items.join('\n    ');
  } catch (error) {
    console.error('Error scanning blog posts:', error);
    return getFallbackItem();
  }
}

/**
 * Provides a fallback item if blog scanning fails
 */
function getFallbackItem() {
  const currentDate = new Date().toUTCString();
  
  return `    <item>
      <title>Visit my blog for the latest articles</title>
      <link>https://piyushmehta.com/blog</link>
      <pubDate>${currentDate}</pubDate>
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
