#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, 'src', 'content', 'blog');
const PUBLIC_DIR = path.join(__dirname, 'public');
const BLOG_IMAGES_DIR = path.join(PUBLIC_DIR, 'blog');

// Ensure the blog images directory exists in public
if (!fs.existsSync(BLOG_IMAGES_DIR)) {
  fs.mkdirSync(BLOG_IMAGES_DIR, { recursive: true });
  console.log('✅ Created public/blog directory');
}

// Function to copy directory recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src);

  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Function to update image paths in MDX files
function updateImagePaths(filePath, blogSlug) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Update relative image paths in markdown syntax
  let updatedContent = content.replace(
    /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g,
    `![$1](/blog/${blogSlug}/images/$2)`
  );

  // Update frontmatter image paths
  updatedContent = updatedContent.replace(
    /url:\s*["']\.\/images\/([^"']+)["']/g,
    `url: "/blog/${blogSlug}/images/$1"`
  );

  // Handle the case where there's an extra "images" in the path (like in the HTTPS post)
  updatedContent = updatedContent.replace(
    /url:\s*["']\.\/images\/images\/([^"']+)["']/g,
    `url: "/blog/${blogSlug}/images/$1"`
  );

  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✅ Updated image paths in ${filePath}`);
    return true;
  }

  return false;
}

async function migrateImages() {
  console.log('🚀 Starting image migration...\n');

  const blogDirs = fs.readdirSync(CONTENT_DIR);
  let totalMoved = 0;
  let totalUpdated = 0;

  for (const blogDir of blogDirs) {
    const blogPath = path.join(CONTENT_DIR, blogDir);

    if (!fs.statSync(blogPath).isDirectory()) continue;

    const imagesDir = path.join(blogPath, 'images');
    const mdxFile = path.join(blogPath, 'index.mdx');

    // Check if this blog has images and an MDX file
    if (fs.existsSync(imagesDir) && fs.existsSync(mdxFile)) {
      const targetImageDir = path.join(BLOG_IMAGES_DIR, blogDir, 'images');

      console.log(`📁 Processing ${blogDir}...`);

      // Copy images to public directory
      copyDirRecursive(imagesDir, targetImageDir);
      console.log(`  ✅ Copied images to public/blog/${blogDir}/images/`);
      totalMoved++;

      // Update MDX file paths
      const wasUpdated = updateImagePaths(mdxFile, blogDir);
      if (wasUpdated) {
        totalUpdated++;
      }

      console.log('');
    }
  }

  console.log(`🎉 Migration complete!`);
  console.log(`📊 Stats:`);
  console.log(`   - ${totalMoved} blog(s) with images processed`);
  console.log(`   - ${totalUpdated} MDX file(s) updated`);
  console.log(
    `\n💡 Images are now served from the public directory and should load correctly!`
  );
}

// Run the migration
migrateImages().catch(console.error);
