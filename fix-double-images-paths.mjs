#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, 'src', 'content', 'blog');

// Function to fix double images paths in frontmatter
function fixDoubleImagesPaths(filePath, _blogSlug) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Fix frontmatter paths with double "images"
  const updatedContent = content.replace(
    /url:\s*["']\/blog\/([^"']+)\/images\/images\/([^"']+)["']/g,
    `url: "/blog/$1/images/$2"`
  );

  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✅ Fixed double images path in ${filePath}`);
    return true;
  }

  return false;
}

async function fixImagePaths() {
  console.log('🔧 Fixing double images paths...\n');

  const blogDirs = fs.readdirSync(CONTENT_DIR);
  let totalFixed = 0;

  for (const blogDir of blogDirs) {
    const blogPath = path.join(CONTENT_DIR, blogDir);

    if (!fs.statSync(blogPath).isDirectory()) continue;

    const mdxFile = path.join(blogPath, 'index.mdx');

    if (fs.existsSync(mdxFile)) {
      const wasFixed = fixDoubleImagesPaths(mdxFile, blogDir);
      if (wasFixed) {
        totalFixed++;
      }
    }
  }

  console.log('🎉 Fix complete!');
  console.log(`📊 Fixed ${totalFixed} file(s) with double images paths`);
}

// Run the fix
fixImagePaths().catch(console.error);
