#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, 'src', 'content', 'blog');
const BASE_URL = 'http://localhost:4321';

// Test templates and themes
const templates = ['default', 'minimal', 'tech', 'blog'];
const themes = ['dark', 'light', 'retro'];

// Function to test OG image generation
async function testOGImage(title, description, template, theme, type = 'article') {
  const params = new URLSearchParams({
    title,
    description,
    type,
    template,
    theme,
    date: '2025-07-18',
    tags: 'TypeScript,JavaScript,Performance'
  });

  const url = `${BASE_URL}/api/og-image?${params}`;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      success: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      template,
      theme
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      template,
      theme
    };
  }
}

// Function to validate all blog articles
async function validateBlogArticles() {
  console.log('🚀 Starting OG Image validation for all blog articles...\n');

  const blogDirs = fs.readdirSync(CONTENT_DIR);
  let totalArticles = 0;
  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (const blogDir of blogDirs) {
    const blogPath = path.join(CONTENT_DIR, blogDir);

    if (!fs.statSync(blogPath).isDirectory()) continue;

    const mdxFile = path.join(blogPath, 'index.mdx');
    if (!fs.existsSync(mdxFile)) continue;

    totalArticles++;

    try {
      const content = fs.readFileSync(mdxFile, 'utf8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      if (!frontmatterMatch) {
        console.log(`❌ ${blogDir}: No frontmatter found`);
        failureCount++;
        continue;
      }

      const frontmatter = frontmatterMatch[1];
      const titleMatch = frontmatter.match(/title:\s*['"](.*?)['"]/);
      const descriptionMatch = frontmatter.match(/description:\s*['"](.*?)['"]/);
      const templateMatch = frontmatter.match(/ogTemplate:\s*['"](.*?)['"]/);
      const themeMatch = frontmatter.match(/ogTheme:\s*['"](.*?)['"]/);

      const title = titleMatch ? titleMatch[1] : blogDir;
      const description = descriptionMatch ? descriptionMatch[1] : 'Test description';
      const template = templateMatch ? templateMatch[1] : 'default';
      const theme = themeMatch ? themeMatch[1] : 'dark';

      console.log(`📄 Testing ${blogDir}...`);
      console.log(`   Template: ${template}, Theme: ${theme}`);

      const result = await testOGImage(title, description, template, theme);
      
      if (result.success) {
        console.log(`   ✅ SUCCESS - ${result.status} - ${result.contentType} - ${result.contentLength} bytes`);
        successCount++;
      } else {
        console.log(`   ❌ FAILED - ${result.status} - ${result.error || 'Unknown error'}`);
        failureCount++;
      }

      results.push({
        article: blogDir,
        title,
        template,
        theme,
        ...result
      });

      console.log('');
    } catch (error) {
      console.log(`❌ ${blogDir}: Error reading file - ${error.message}`);
      failureCount++;
    }
  }

  return { totalArticles, successCount, failureCount, results };
}

// Function to test all template/theme combinations
async function testAllCombinations() {
  console.log('🧪 Testing all template/theme combinations...\n');

  const testTitle = 'Test OG Image Generation';
  const testDescription = 'Testing all template and theme combinations for OG image generation';
  
  for (const template of templates) {
    for (const theme of themes) {
      console.log(`Testing ${template}/${theme}...`);
      
      const result = await testOGImage(testTitle, testDescription, template, theme);
      
      if (result.success) {
        console.log(`   ✅ SUCCESS - ${result.contentLength} bytes`);
      } else {
        console.log(`   ❌ FAILED - ${result.status} - ${result.error || 'Unknown error'}`);
      }
    }
  }
}

// Main execution
async function main() {
  console.log('🎨 OG Image Validation Tool\n');
  console.log('='.repeat(50));
  
  // Test all template/theme combinations first
  await testAllCombinations();
  
  console.log('\n' + '='.repeat(50));
  
  // Test all blog articles
  const { totalArticles, successCount, failureCount, results } = await validateBlogArticles();
  
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(50));
  console.log(`Total Articles: ${totalArticles}`);
  console.log(`Successful: ${successCount} (${Math.round((successCount / totalArticles) * 100)}%)`);
  console.log(`Failed: ${failureCount} (${Math.round((failureCount / totalArticles) * 100)}%)`);
  
  if (failureCount > 0) {
    console.log('\n❌ Failed Articles:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.article} (${r.template}/${r.theme}): ${r.error || r.status}`);
      });
  }
  
  console.log('\n🎉 Validation complete!');
  
  if (failureCount === 0) {
    console.log('🎊 All OG images are working perfectly!');
  } else {
    console.log(`⚠️  ${failureCount} articles need attention.`);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/og-image?title=test&description=test`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Run the validation
(async () => {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Development server is not running!');
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running, proceeding with validation...\n');
  await main();
})().catch(console.error);