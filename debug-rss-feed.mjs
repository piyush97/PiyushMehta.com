import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
// debug-rss-feed.mjs
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Debug tool to fetch and analyze your RSS feed for potential issues
 */
async function debugRssFeed() {
  // URLs to test - add your production URL when available
  const urls = [
    'http://localhost:4321/rss.xml',           // Local dev
    'http://localhost:3000/rss.xml',           // Preview
    'https://piyushmehta.com/rss.xml'          // Production
  ];
  
  console.log('🔍 RSS Feed Debugging Tool');
  console.log('=========================');
  
  for (const url of urls) {
    try {
      console.log(`\nTesting RSS feed at: ${url}`);
      console.log('--------------------------');
      
      // Try to fetch the RSS feed
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/xml, application/rss+xml, text/xml'
        }
      }).catch(e => {
        console.log(`  ❌ Could not connect to ${url}: ${e.message}`);
        return null;
      });
      
      if (!response) continue;
      
      // Check status
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      // Check content type
      const contentType = response.headers.get('content-type');
      console.log(`  Content-Type: ${contentType}`);
      
      if (!contentType.includes('xml')) {
        console.log(`  ⚠️ Warning: Content-Type is not XML. This could cause RSS readers to reject the feed.`);
      }
      
      // Get other headers
      console.log('  Headers:');
      response.headers.forEach((value, name) => {
        console.log(`    ${name}: ${value}`);
      });
      
      // Get the response body
      const body = await response.text();
      
      // Save the response to a file for inspection
      const outputFile = path.join(__dirname, `rss-debug-${new URL(url).hostname}-${Date.now()}.txt`);
      fs.writeFileSync(outputFile, body);
      console.log(`  📝 Response saved to: ${outputFile}`);
      
      // Basic checks
      console.log('  Checks:');
      console.log(`    Content starts with XML declaration: ${body.trim().startsWith('<?xml') ? '✅' : '❌'}`);
      console.log(`    Contains <rss> tag: ${body.includes('<rss') ? '✅' : '❌'}`);
      console.log(`    Contains <html> tag (should be NO): ${body.includes('<html') ? '❌' : '✅'}`);
      console.log(`    Contains <body> tag (should be NO): ${body.includes('<body') ? '❌' : '✅'}`);
      console.log(`    Response size: ${(body.length / 1024).toFixed(2)} KB`);
      
      if (body.includes('<html') || body.includes('<body')) {
        console.log(`  ❗ ERROR: RSS feed contains HTML tags, which means it's being rendered as a webpage instead of XML`);
      }
      
      if (body.includes('<?xml-stylesheet')) {
        console.log(`  ⚠️ Warning: RSS feed contains XML stylesheet, which can cause issues with some RSS readers`);
      }
    } catch (error) {
      console.error(`  ❌ Error testing ${url}:`, error.message);
    }
  }
  
  console.log('\n📋 Debugging Summary:');
  console.log('-------------------');
  console.log('1. Your RSS feed should be served with Content-Type: application/xml or application/rss+xml');
  console.log('2. It should start with <?xml version="1.0" encoding="UTF-8"?>');
  console.log('3. It should not contain any HTML tags like <html>, <body>, <head>, etc.');
  console.log('4. Remove any <?xml-stylesheet> directives that might cause rendering as HTML');
  console.log('5. Check your vercel.json to ensure proper Content-Type headers');
  console.log('\nFor more help, see: https://validator.w3.org/feed/');
}

// Run the function when this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  debugRssFeed().catch(console.error);
}

export default debugRssFeed;
