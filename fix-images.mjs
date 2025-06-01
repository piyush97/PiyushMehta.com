import fs from 'fs';
import path from 'path';

const blogDir = './src/content/blog';

function updateImagePaths() {
  const files = fs.readdirSync(blogDir).filter((file) => file.endsWith('.mdx'));

  for (const file of files) {
    const filePath = path.join(blogDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Get the base name for assets directory
    const baseName = file.replace('.mdx', '');

    // Replace relative image paths with assets paths
    content = content.replace(/\.\/(images\/[^)]+)/g, (match, imagePath) => {
      return `../../assets/${baseName}/${imagePath.replace('images/', '')}`;
    });

    // Update banner paths in frontmatter
    content = content.replace(
      /banner: '\.\/(images\/[^']+)'/g,
      (match, imagePath) => {
        const imageName = imagePath.split('/').pop();
        return `banner: '../../assets/${baseName}-${imageName}'`;
      }
    );

    fs.writeFileSync(filePath, content);
    console.log(`Updated image paths in: ${file}`);
  }
}

updateImagePaths();
console.log('Image path updates complete!');
