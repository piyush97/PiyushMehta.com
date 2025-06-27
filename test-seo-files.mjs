// test-seo-files.mjs - Script to verify RSS and sitemap files exist and are valid

import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Main function to check sitemap and RSS files
 */
async function testSeoFiles() {
  console.log(`${colors.bold}${colors.magenta}SEO Files Verification Tool${colors.reset}`);
  console.log('='.repeat(80));
  
  // Check sitemap files
  const sitemapPaths = [
    path.join(__dirname, 'dist', 'sitemap.xml'),
    path.join(__dirname, '.vercel', 'output', 'static', 'sitemap.xml'),
    path.join(__dirname, 'public', 'sitemap.xml'),
  ];
  
  console.log(`\n${colors.bold}Checking sitemap.xml files:${colors.reset}`);
  console.log('-'.repeat(80));
  
  let sitemapFound = false;
  
  for (const sitemapPath of sitemapPaths) {
    if (fs.existsSync(sitemapPath)) {
      sitemapFound = true;
      const content = fs.readFileSync(sitemapPath, 'utf8');
      const urlCount = (content.match(/<url>/g) || []).length;
      const isValid = content.includes('<urlset') && content.includes('</urlset>');
      
      console.log(`${colors.cyan}Sitemap found: ${sitemapPath}${colors.reset}`);
      console.log(`${colors.cyan}Size: ${(content.length / 1024).toFixed(2)} KB${colors.reset}`);
      console.log(`${colors.cyan}URL count: ${urlCount}${colors.reset}`);
      console.log(`${colors.cyan}Valid format: ${isValid ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
      console.log('-'.repeat(80));
    }
  }
  
  if (!sitemapFound) {
    console.log(`${colors.red}No sitemap.xml file found in any of the expected locations!${colors.reset}`);
  }
  
  // Check RSS files
  const rssPaths = [
    path.join(__dirname, 'dist', 'rss.xml'),
    path.join(__dirname, '.vercel', 'output', 'static', 'rss.xml'),
    path.join(__dirname, 'public', 'rss.xml'),
  ];
  
  console.log(`\n${colors.bold}Checking RSS files:${colors.reset}`);
  console.log('-'.repeat(80));
  
  let rssFound = false;
  
  for (const rssPath of rssPaths) {
    if (fs.existsSync(rssPath)) {
      rssFound = true;
      const content = fs.readFileSync(rssPath, 'utf8');
      const itemCount = (content.match(/<item>/g) || []).length;
      const isValid = content.includes('<rss') && content.includes('</rss>');
      const hasHTML = content.includes('<html') || content.includes('<body');
      
      console.log(`${colors.cyan}RSS found: ${rssPath}${colors.reset}`);
      console.log(`${colors.cyan}Size: ${(content.length / 1024).toFixed(2)} KB${colors.reset}`);
      console.log(`${colors.cyan}Item count: ${itemCount}${colors.reset}`);
      console.log(`${colors.cyan}Valid format: ${isValid ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
      console.log(`${colors.cyan}Contains HTML (bad): ${hasHTML ? colors.red + '✓' : colors.green + '✗'}${colors.reset}`);
      console.log('-'.repeat(80));
    }
  }
  
  if (!rssFound) {
    console.log(`${colors.red}No rss.xml file found in any of the expected locations!${colors.reset}`);
  }
  
  // Check robots.txt
  const robotsPath = path.join(__dirname, 'public', 'robots.txt');
  
  console.log(`\n${colors.bold}Checking robots.txt:${colors.reset}`);
  console.log('-'.repeat(80));
  
  if (fs.existsSync(robotsPath)) {
    const content = fs.readFileSync(robotsPath, 'utf8');
    const hasSitemap = content.includes('Sitemap:');
    const hasUserAgent = content.includes('User-agent:');
    
    console.log(`${colors.cyan}robots.txt found: ${robotsPath}${colors.reset}`);
    console.log(`${colors.cyan}Size: ${(content.length / 1024).toFixed(2)} KB${colors.reset}`);
    console.log(`${colors.cyan}Contains Sitemap directive: ${hasSitemap ? colors.green + '✓' : colors.yellow + '✗'}${colors.reset}`);
    console.log(`${colors.cyan}Contains User-agent directive: ${hasUserAgent ? colors.green + '✓' : colors.yellow + '✗'}${colors.reset}`);
    console.log('-'.repeat(80));
  } else {
    console.log(`${colors.red}No robots.txt file found!${colors.reset}`);
  }
  
  console.log(`\n${colors.bold}${colors.magenta}Summary:${colors.reset}`);
  console.log('-'.repeat(80));
  console.log(`${colors.cyan}Sitemap found: ${sitemapFound ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`${colors.cyan}RSS feed found: ${rssFound ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`${colors.cyan}robots.txt found: ${fs.existsSync(robotsPath) ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  
  // Return success only if all files were found
  return sitemapFound && rssFound && fs.existsSync(robotsPath);
}

// Run the test if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  testSeoFiles()
    .then(success => {
      if (!success) {
        console.log(`\n${colors.yellow}Some SEO files are missing or invalid. Check the output above.${colors.reset}`);
        process.exit(1);
      } else {
        console.log(`\n${colors.green}All SEO files are present and valid!${colors.reset}`);
      }
    })
    .catch(error => {
      console.error(`\n${colors.red}Error testing SEO files: ${error.message}${colors.reset}`);
      process.exit(1);
    });
}

export default testSeoFiles;
