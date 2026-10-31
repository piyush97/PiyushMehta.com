#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.dirname(__dirname);
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src', 'content', 'blog');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const BLOG_IMAGES_DIR = path.join(PUBLIC_DIR, 'blog');

// --verify reports source/public drift and exits non-zero without writing anything.
// The release build uses this so a build can never rewrite committed MDX sources.
const VERIFY_ONLY = process.argv.includes('--verify');

const rel = (target) => path.relative(PROJECT_ROOT, target);

// Ensure the blog images directory exists in public
if (!VERIFY_ONLY && !fs.existsSync(BLOG_IMAGES_DIR)) {
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

// Compare public copies against their source images without touching the filesystem.
function collectImageDrift(srcDir, destDir) {
  const drift = [];

  for (const entry of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry);
    const destPath = path.join(destDir, entry);

    if (fs.statSync(srcPath).isDirectory()) {
      drift.push(...collectImageDrift(srcPath, destPath));
      continue;
    }

    if (!fs.existsSync(destPath)) {
      drift.push(`missing public copy: ${rel(destPath)}`);
      continue;
    }

    if (!fs.readFileSync(srcPath).equals(fs.readFileSync(destPath))) {
      drift.push(`stale public copy: ${rel(destPath)}`);
    }
  }

  return drift;
}

// Rewrite relative image references to the served /blog/<slug>/images/ form.
function migratedImagePaths(content, blogSlug) {
  let updatedContent = content.replace(
    /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g,
    `![$1](/blog/${blogSlug}/images/$2)`,
  );

  // Update frontmatter image paths
  updatedContent = updatedContent.replace(
    /url:\s*["']\.\/images\/([^"']+)["']/g,
    `url: "/blog/${blogSlug}/images/$1"`,
  );

  // Handle the case where there's an extra "images" in the path (like in the HTTPS post)
  updatedContent = updatedContent.replace(
    /url:\s*["']\.\/images\/images\/([^"']+)["']/g,
    `url: "/blog/${blogSlug}/images/$1"`,
  );

  return updatedContent;
}

// Function to update image paths in MDX files
function updateImagePaths(filePath, blogSlug) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updatedContent = migratedImagePaths(content, blogSlug);

  if (content === updatedContent) {
    return false;
  }

  if (VERIFY_ONLY) {
    return false;
  }

  fs.writeFileSync(filePath, updatedContent);
  console.log(`✅ Updated image paths in ${filePath}`);
  return true;
}

async function migrateImages() {
  if (VERIFY_ONLY) {
    console.log('🔍 Verifying image migration (read-only)...\n');
  } else {
    console.log('🚀 Starting image migration...\n');
  }

  const drift = [];
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

      if (VERIFY_ONLY) {
        drift.push(...collectImageDrift(imagesDir, targetImageDir));

        const source = fs.readFileSync(mdxFile, 'utf8');

        if (migratedImagePaths(source, blogDir) !== source) {
          drift.push(`un-migrated image paths: ${rel(mdxFile)}`);
        }

        console.log('');
        continue;
      }

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

  if (VERIFY_ONLY) {
    if (drift.length > 0) {
      console.error(`❌ Image migration drift (${drift.length}):`);
      for (const item of drift) {
        console.error(`   - ${item}`);
      }
      console.error('\n💡 Run `bun run migrate:images` and commit the result.');
      process.exitCode = 1;
      return;
    }

    console.log('✅ Image migration is up to date (sources and public copies match).');
    return;
  }

  console.log('🎉 Migration complete!');
  console.log('📊 Stats:');
  console.log(`   - ${totalMoved} blog(s) with images processed`);
  console.log(`   - ${totalUpdated} MDX file(s) updated`);
  console.log('\n💡 Images are now served from the public directory and should load correctly!');
}

// Run the migration. A migration failure must fail the release build.
migrateImages().catch((error) => {
  console.error('Image migration failed:', error);
  process.exitCode = 1;
});
