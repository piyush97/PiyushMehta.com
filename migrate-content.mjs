import fs from 'fs';
import path from 'path';

const contentDir = './content/blog';
const outputDir = './src/content/blog';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function convertFrontmatter(frontmatter) {
  const lines = frontmatter.split('\n');
  const result = [];

  for (const line of lines) {
    if (line.includes('slug:')) {
      // Skip slug as Astro uses filename
      continue;
    } else if (line.includes('date:')) {
      // Convert date format
      const match = line.match(/date:\s*['"]([^'"]+)['"]/);
      if (match) {
        result.push(`date: ${match[1]}`);
      }
    } else if (line.includes('published:')) {
      // Convert to draft (inverse)
      const isPublished = line.includes('true');
      result.push(`draft: ${!isPublished}`);
    } else if (line.includes('categories:')) {
      // Convert categories to tags
      result.push(line.replace('categories:', 'tags:'));
    } else if (line.includes('banner:')) {
      // Keep banner as optional
      result.push(line);
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

function migrateBlogPost(dirName) {
  const inputPath = path.join(contentDir, dirName, 'index.mdx');
  const outputPath = path.join(outputDir, `${dirName}.mdx`);

  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping ${dirName} - index.mdx not found`);
    return;
  }

  const content = fs.readFileSync(inputPath, 'utf8');

  // Extract frontmatter and content
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    console.log(`Skipping ${dirName} - no frontmatter found`);
    return;
  }

  const [, frontmatter, body] = frontmatterMatch;
  const convertedFrontmatter = convertFrontmatter(frontmatter);

  const convertedContent = `---\n${convertedFrontmatter}\n---\n${body}`;

  fs.writeFileSync(outputPath, convertedContent);
  console.log(`Migrated: ${dirName}`);

  // Copy images if they exist
  const imagesDir = path.join(contentDir, dirName, 'images');
  if (fs.existsSync(imagesDir)) {
    const outputImagesDir = path.join('./src/assets', dirName);
    if (!fs.existsSync(outputImagesDir)) {
      fs.mkdirSync(outputImagesDir, { recursive: true });
    }

    const images = fs.readdirSync(imagesDir);
    for (const image of images) {
      fs.copyFileSync(
        path.join(imagesDir, image),
        path.join(outputImagesDir, image)
      );
    }
    console.log(`Copied images for: ${dirName}`);
  }

  // Copy banner image if exists
  const bannerFiles = ['banner.png', 'chat.png'];
  for (const bannerFile of bannerFiles) {
    const bannerPath = path.join(contentDir, dirName, bannerFile);
    if (fs.existsSync(bannerPath)) {
      const outputAssetsDir = './src/assets';
      if (!fs.existsSync(outputAssetsDir)) {
        fs.mkdirSync(outputAssetsDir, { recursive: true });
      }
      fs.copyFileSync(
        bannerPath,
        path.join(outputAssetsDir, `${dirName}-${bannerFile}`)
      );
      console.log(`Copied banner for: ${dirName}`);
    }
  }
}

// Get all blog directories
const blogDirs = fs.readdirSync(contentDir).filter((dir) => {
  return fs.statSync(path.join(contentDir, dir)).isDirectory();
});

console.log('Starting blog migration...');
blogDirs.forEach(migrateBlogPost);
console.log('Migration complete!');
