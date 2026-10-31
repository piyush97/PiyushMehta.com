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

// Read a file, treating a missing file as "absent" rather than an error. One
// read instead of existsSync-then-readFileSync keeps this free of a check/use window.
function readTextOrNull(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

// Ensure the blog images directory exists in public. mkdirSync is idempotent, so
// there is no check-then-create window to race against.
if (!VERIFY_ONLY) {
  fs.mkdirSync(BLOG_IMAGES_DIR, { recursive: true });
}

// Function to copy directory recursively
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Compare public copies against their source images without touching the filesystem.
function collectImageDrift(srcDir, destDir) {
  const drift = [];

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      drift.push(...collectImageDrift(srcPath, destPath));
      continue;
    }

    // Read straight through instead of testing existence first: the read itself
    // reports ENOENT, so there is no window between the check and the use.
    let publicCopy;
    try {
      publicCopy = fs.readFileSync(destPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        drift.push(`missing public copy: ${rel(destPath)}`);
        continue;
      }

      throw error;
    }

    if (!fs.readFileSync(srcPath).equals(publicCopy)) {
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

async function migrateImages() {
  if (VERIFY_ONLY) {
    console.log('🔍 Verifying image migration (read-only)...\n');
  } else {
    console.log('🚀 Starting image migration...\n');
  }

  const drift = [];
  let totalMoved = 0;
  let totalUpdated = 0;

  for (const blogEntry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!blogEntry.isDirectory()) continue;

    const blogDir = blogEntry.name;
    const imagesDir = path.join(CONTENT_DIR, blogDir, 'images');
    const mdxFile = path.join(CONTENT_DIR, blogDir, 'index.mdx');

    // A blog is in scope only when it has both a source image directory and an
    // MDX file. Both are probed by the operation that needs them, not by a
    // separate existence check, so a concurrent change cannot slip in between.
    const source = readTextOrNull(mdxFile);
    if (source === null) continue;

    let hasImages = true;
    try {
      fs.readdirSync(imagesDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        hasImages = false;
      } else {
        throw error;
      }
    }

    if (!hasImages) continue;

    const targetImageDir = path.join(BLOG_IMAGES_DIR, blogDir, 'images');

    console.log(`📁 Processing ${blogDir}...`);

    if (VERIFY_ONLY) {
      drift.push(...collectImageDrift(imagesDir, targetImageDir));

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
    const updatedContent = migratedImagePaths(source, blogDir);
    if (updatedContent !== source) {
      fs.writeFileSync(mdxFile, updatedContent);
      console.log(`✅ Updated image paths in ${mdxFile}`);
      totalUpdated++;
    }

    console.log('');
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
