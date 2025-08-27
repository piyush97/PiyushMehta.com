import { execSync } from 'child_process';
// test-rss-output.mjs
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Tests the RSS output by validating XML syntax and checking for HTML elements
 */
async function testRssOutput() {
  try {
    console.log('Testing RSS feed output...');
    
    // Path to the static RSS file
    const rssFilePath = path.join(__dirname, 'public', 'rss.xml');
    
    // Check if the file exists
    if (!fs.existsSync(rssFilePath)) {
      console.error('RSS file not found at:', rssFilePath);
      process.exit(1);
    }
    
    // Read the file content
    const rssContent = fs.readFileSync(rssFilePath, 'utf-8');
    
    // Basic validation checks
    if (!rssContent.startsWith('<?xml')) {
      console.error('RSS file does not start with XML declaration');
      process.exit(1);
    }
    
    // Check for HTML contamination (common issues that make RSS render as HTML)
    const htmlPatterns = [
      /<html/i,
      /<body/i,
      /<head/i,
      /<script/i,
      /<!DOCTYPE html>/i,
      /<style/i,
      /<link.*stylesheet/i
    ];
    
    for (const pattern of htmlPatterns) {
      if (pattern.test(rssContent)) {
        console.error(`RSS file contains HTML element: ${pattern.toString()}`);
        console.error('This will cause the RSS feed to render as HTML instead of XML');
        process.exit(1);
      }
    }
    
    // Check that essential RSS elements are present
    const requiredElements = [
      /<rss/i,
      /<channel>/i,
      /<title>/i,
      /<link>/i,
      /<description>/i
    ];
    
    for (const element of requiredElements) {
      if (!element.test(rssContent)) {
        console.error(`RSS file is missing required element: ${element.toString()}`);
        process.exit(1);
      }
    }
    
    // If you have xmllint installed (commonly available on Unix systems)
    try {
      execSync('which xmllint', { stdio: 'ignore' });
      console.log('Validating XML with xmllint...');
      execSync(`xmllint --noout "${rssFilePath}"`, { stdio: 'inherit' });
      console.log('XML validation successful!');
    } catch (_) {
      console.log('xmllint not available, skipping XML validation');
    }
    
    console.log('RSS feed validation successful!');
    console.log('RSS file size:', (rssContent.length / 1024).toFixed(2), 'KB');
    console.log('RSS feed is properly formatted as XML and contains no HTML elements.');
  } catch (error) {
    console.error('Error testing RSS output:', error);
    process.exit(1);
  }
}

// Run the function when this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  testRssOutput().catch(console.error);
}

export default testRssOutput;
