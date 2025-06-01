import fs from 'fs';
import path from 'path';

const contentDir = './src/content/blog';
const assetsDir = './src/assets';

// Get all MDX files
const mdxFiles = fs
  .readdirSync(contentDir)
  .filter((file) => file.endsWith('.mdx'));

console.log('Fixing image paths in MDX files...');

mdxFiles.forEach((file) => {
  const filePath = path.join(contentDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Extract the blog post slug from filename
  const slug = file.replace('.mdx', '');

  console.log(`\n📝 Processing: ${file}`);

  // Replace relative image paths with proper asset imports
  // Pattern: ![alt](./images/filename.ext) or ![alt](images/filename.ext)
  content = content.replace(
    /!\[([^\]]*)\]\(\.?\/?images\/([^)]+)\)/g,
    (match, alt, filename) => {
      console.log(`  📸 Found image: ${filename}`);

      // Check if the image exists in the assets folder for this blog post
      const assetPath = path.join(assetsDir, slug, filename);
      if (fs.existsSync(assetPath)) {
        return `![${alt}](../../assets/${slug}/${filename})`;
      } else {
        console.log(`  ⚠️  Image not found: ${assetPath}`);
        return match; // Keep original if not found
      }
    }
  );

  // Also handle cases where the path is already correct but might need adjustment
  // Pattern: ![alt](../../assets/folder/filename)
  content = content.replace(
    /!\[([^\]]*)\]\(\.\.\/\.\.\/assets\/([^/]+)\/([^)]+)\)/g,
    (match, alt, folder, filename) => {
      const expectedFolder = slug;
      if (folder !== expectedFolder) {
        console.log(
          `  🔄 Correcting asset path: ${folder} -> ${expectedFolder}`
        );
        const assetPath = path.join(assetsDir, expectedFolder, filename);
        if (fs.existsSync(assetPath)) {
          return `![${alt}](../../assets/${expectedFolder}/${filename})`;
        }
      }
      return match;
    }
  );

  // Write the updated content back
  fs.writeFileSync(filePath, content);
  console.log(`  ✅ Updated: ${file}`);
});

console.log('\n🎉 All image paths have been fixed!');
