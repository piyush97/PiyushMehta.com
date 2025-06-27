#!/usr/bin/env node
/**
 * This script verifies that the RSS feed is being served correctly with the proper content type
 * It helps debug issues with RSS feeds being served as HTML instead of XML
 */

import fs from 'fs';
import http from 'http';
import https from 'https';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change this to your website URL
const SITE_URL = 'https://piyushmehta.com';
const RSS_PATH = '/rss.xml';
const LOCAL_RSS_PATH = resolve(__dirname, '../public/rss.xml');

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
 * Fetch the RSS feed from a URL and check its content type and contents
 */
async function checkRemoteRss() {
  console.log(`${colors.bold}Checking remote RSS feed at ${SITE_URL}${RSS_PATH}${colors.reset}`);
  console.log('-'.repeat(80));
  
  return new Promise((resolve, reject) => {
    const isHttps = SITE_URL.startsWith('https://');
    const client = isHttps ? https : http;
    const url = SITE_URL + RSS_PATH;
    
    console.log(`${colors.blue}Fetching: ${url}${colors.reset}`);
    
    const req = client.get(url, (res) => {
      const { statusCode, headers } = res;
      
      // Check status code
      console.log(`${colors.cyan}Status: ${statusCode}${colors.reset}`);
      
      // Check content type
      const contentType = headers['content-type'] || '';
      console.log(`${colors.cyan}Content-Type: ${contentType}${colors.reset}`);
      
      if (contentType.includes('text/html')) {
        console.log(`${colors.red}WARNING: Content-Type indicates HTML not XML!${colors.reset}`);
      } else if (contentType.includes('application/xml') || contentType.includes('application/rss+xml')) {
        console.log(`${colors.green}Content-Type looks good (XML)${colors.reset}`);
      }
      
      // Check other relevant headers
      console.log(`${colors.cyan}Cache-Control: ${headers['cache-control'] || 'not set'}${colors.reset}`);
      
      // Collect the data
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      
      res.on('end', () => {
        // Check if content starts with XML declaration
        if (rawData.trim().startsWith('<?xml')) {
          console.log(`${colors.green}Content starts with XML declaration ✓${colors.reset}`);
        } else {
          console.log(`${colors.red}WARNING: Content does not start with XML declaration!${colors.reset}`);
          
          // Show the beginning of the content
          console.log(`${colors.yellow}Content starts with:${colors.reset}`);
          console.log(rawData.substring(0, 200) + '...');
        }
        
        // Check for RSS elements
        if (rawData.includes('<rss') && rawData.includes('<channel>')) {
          console.log(`${colors.green}Content contains RSS elements ✓${colors.reset}`);
          
          // Count items
          const itemMatches = rawData.match(/<item>/g);
          const itemCount = itemMatches ? itemMatches.length : 0;
          console.log(`${colors.green}Feed contains ${itemCount} items${colors.reset}`);
        } else {
          console.log(`${colors.red}WARNING: Content does not appear to be valid RSS!${colors.reset}`);
        }
        
        resolve({
          statusCode,
          contentType,
          isXml: rawData.trim().startsWith('<?xml'),
          hasRssElements: rawData.includes('<rss') && rawData.includes('<channel>'),
          itemCount: (rawData.match(/<item>/g) || []).length
        });
      });
    });
    
    req.on('error', (error) => {
      console.error(`${colors.red}Error fetching RSS feed: ${error.message}${colors.reset}`);
      reject(error);
    });
    
    req.end();
  });
}

/**
 * Check the local static RSS file
 */
function checkLocalRss() {
  console.log(`\n${colors.bold}Checking local static RSS file at ${LOCAL_RSS_PATH}${colors.reset}`);
  console.log('-'.repeat(80));
  
  try {
    // Check if file exists
    if (!fs.existsSync(LOCAL_RSS_PATH)) {
      console.log(`${colors.red}Local RSS file does not exist!${colors.reset}`);
      return { exists: false };
    }
    
    console.log(`${colors.green}Local RSS file exists ✓${colors.reset}`);
    
    // Read file
    const content = fs.readFileSync(LOCAL_RSS_PATH, 'utf8');
    
    // Check if content starts with XML declaration
    if (content.trim().startsWith('<?xml')) {
      console.log(`${colors.green}Content starts with XML declaration ✓${colors.reset}`);
    } else {
      console.log(`${colors.red}WARNING: Content does not start with XML declaration!${colors.reset}`);
    }
    
    // Check for RSS elements
    if (content.includes('<rss') && content.includes('<channel>')) {
      console.log(`${colors.green}Content contains RSS elements ✓${colors.reset}`);
      
      // Count items
      const itemMatches = content.match(/<item>/g);
      const itemCount = itemMatches ? itemMatches.length : 0;
      console.log(`${colors.green}Feed contains ${itemCount} items${colors.reset}`);
    } else {
      console.log(`${colors.red}WARNING: Content does not appear to be valid RSS!${colors.reset}`);
    }
    
    return {
      exists: true,
      isXml: content.trim().startsWith('<?xml'),
      hasRssElements: content.includes('<rss') && content.includes('<channel>'),
      itemCount: (content.match(/<item>/g) || []).length
    };
  } catch (error) {
    console.error(`${colors.red}Error checking local RSS file: ${error.message}${colors.reset}`);
    return { exists: false, error: error.message };
  }
}

/**
 * Main function to run the checks
 */
async function main() {
  console.log(`${colors.bold}${colors.magenta}RSS Feed Verification Tool${colors.reset}`);
  console.log('='.repeat(80));
  
  try {
    // Check local RSS file
    const localResult = checkLocalRss();
    
    // Check remote RSS feed if a URL is provided
    if (SITE_URL !== 'https://piyushmehta.com') {
      const remoteResult = await checkRemoteRss();
      
      console.log('\n' + '='.repeat(80));
      
      // Print summary
      console.log(`${colors.bold}${colors.magenta}Summary:${colors.reset}`);
      console.log(`${colors.cyan}Local RSS file: ${localResult.exists ? colors.green + '✓ Valid' : colors.red + '✗ Invalid or missing'}${colors.reset}`);
      if (localResult.exists) {
        console.log(`${colors.cyan}Local RSS items: ${localResult.itemCount}${colors.reset}`);
      }
      
      console.log(`${colors.cyan}Remote RSS feed: ${remoteResult.isXml && remoteResult.hasRssElements ? colors.green + '✓ Valid' : colors.red + '✗ Invalid'}${colors.reset}`);
      console.log(`${colors.cyan}Remote content type: ${remoteResult.contentType.includes('html') ? colors.red + '✗ HTML (wrong)' : colors.green + '✓ XML (correct)'}${colors.reset}`);
      console.log(`${colors.cyan}Remote RSS items: ${remoteResult.itemCount}${colors.reset}`);
      
      // Provide recommendations
      console.log('\n' + colors.bold + colors.yellow + 'Recommendations:' + colors.reset);
      
      if (remoteResult.contentType.includes('html')) {
        console.log(`${colors.yellow}- Your RSS feed is being served as HTML, not XML. Check your Content-Type headers in server config.${colors.reset}`);
        console.log(`${colors.yellow}- Ensure your Astro config and Vercel settings are correctly configured for /rss.xml${colors.reset}`);
      }
      
      if (!remoteResult.isXml || !remoteResult.hasRssElements) {
        console.log(`${colors.yellow}- Your remote RSS feed doesn't appear to be valid XML or RSS.${colors.reset}`);
      }
      
      if (localResult.exists && localResult.itemCount === 0) {
        console.log(`${colors.yellow}- Your local RSS file exists but doesn't contain any items.${colors.reset}`);
      }
    } else {
      console.log('\n' + colors.yellow + 'To check your live RSS feed, edit the SITE_URL constant in this script.' + colors.reset);
    }
  } catch (error) {
    console.error(`${colors.red}Error during verification: ${error.message}${colors.reset}`);
  }
}

main().catch(console.error);
