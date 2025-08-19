#!/usr/bin/env node

import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const PROJECT_ROOT = path.resolve('.');
const PUBLIC_BLOG_DIR = path.join(PROJECT_ROOT, 'public', 'blog');
const SRC_IMAGES_DIR = path.join(PROJECT_ROOT, 'src', 'images');

// Size thresholds for optimization
const OPTIMIZE_THRESHOLD = 100 * 1024; // 100KB
const PNG_QUALITY = 85;
const JPEG_QUALITY = 80;

async function checkImageOptimization() {
  console.log('🔍 Checking available image optimization tools...\n');
  
  const tools = {
    imagemagick: false,
    pngquant: false,
    jpegoptim: false
  };
  
  try {
    await execAsync('which convert');
    tools.imagemagick = true;
    console.log('✅ ImageMagick found');
  } catch {
    console.log('❌ ImageMagick not found');
  }
  
  try {
    await execAsync('which pngquant');
    tools.pngquant = true;
    console.log('✅ pngquant found');
  } catch {
    console.log('❌ pngquant not found');
  }
  
  try {
    await execAsync('which jpegoptim');
    tools.jpegoptim = true;
    console.log('✅ jpegoptim found');
  } catch {
    console.log('❌ jpegoptim not found');
  }
  
  return tools;
}

async function getImageInfo(filePath) {
  const stats = fs.statSync(filePath);
  return {
    path: filePath,
    size: stats.size,
    sizeKB: Math.round(stats.size / 1024),
    sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
  };
}

async function optimizeImage(imagePath, tools) {
  const ext = path.extname(imagePath).toLowerCase();
  const originalInfo = await getImageInfo(imagePath);
  
  if (originalInfo.size < OPTIMIZE_THRESHOLD) {
    console.log(`  ⏭️  Skipping ${path.basename(imagePath)} (${originalInfo.sizeKB}KB - below threshold)`);
    return null;
  }
  
  console.log(`  🔧 Optimizing ${path.basename(imagePath)} (${originalInfo.sizeKB}KB)...`);
  
  const backupPath = imagePath + '.backup';
  fs.copyFileSync(imagePath, backupPath);
  
  try {
    if (ext === '.png' && tools.pngquant) {
      await execAsync(`pngquant --quality=65-${PNG_QUALITY} --force --output "${imagePath}" "${backupPath}"`);
    } else if ((ext === '.jpg' || ext === '.jpeg') && tools.jpegoptim) {
      await execAsync(`jpegoptim --max=${JPEG_QUALITY} --strip-all "${imagePath}"`);
    } else if (tools.imagemagick) {
      // Fallback to ImageMagick
      if (ext === '.png') {
        await execAsync(`convert "${backupPath}" -quality ${PNG_QUALITY} -strip "${imagePath}"`);
      } else if (ext === '.jpg' || ext === '.jpeg') {
        await execAsync(`convert "${backupPath}" -quality ${JPEG_QUALITY} -strip "${imagePath}"`);
      }
    } else {
      console.log(`    ❌ No suitable tool found for ${ext} optimization`);
      fs.unlinkSync(backupPath);
      return null;
    }
    
    const optimizedInfo = await getImageInfo(imagePath);
    const savings = originalInfo.size - optimizedInfo.size;
    const savingsPercent = ((savings / originalInfo.size) * 100).toFixed(1);
    
    if (savings > 0) {
      console.log(`    ✅ Saved ${Math.round(savings / 1024)}KB (${savingsPercent}%) - ${originalInfo.sizeKB}KB → ${optimizedInfo.sizeKB}KB`);
      fs.unlinkSync(backupPath);
      return {
        path: imagePath,
        originalSize: originalInfo.size,
        optimizedSize: optimizedInfo.size,
        savings: savings,
        savingsPercent: parseFloat(savingsPercent)
      };
    } else {
      console.log(`    ℹ️  No improvement - restoring original`);
      fs.renameSync(backupPath, imagePath);
      return null;
    }
    
  } catch (error) {
    console.log(`    ❌ Error optimizing: ${error.message}`);
    if (fs.existsSync(backupPath)) {
      fs.renameSync(backupPath, imagePath);
    }
    return null;
  }
}

async function findLargeImages(directory) {
  const images = [];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (/\.(png|jpe?g)$/i.test(item)) {
        images.push({
          path: fullPath,
          size: stat.size,
          sizeKB: Math.round(stat.size / 1024)
        });
      }
    }
  }
  
  scanDirectory(directory);
  return images.sort((a, b) => b.size - a.size);
}

async function optimizeAssets() {
  console.log('🎨 Starting Asset Optimization\n');
  
  const tools = await checkImageOptimization();
  console.log('');
  
  if (!tools.imagemagick && !tools.pngquant && !tools.jpegoptim) {
    console.log('❌ No image optimization tools found. Please install:');
    console.log('   • ImageMagick: sudo apt install imagemagick (Ubuntu/Debian)');
    console.log('   • pngquant: sudo apt install pngquant');
    console.log('   • jpegoptim: sudo apt install jpegoptim');
    console.log('   • Or on Arch: sudo pacman -S imagemagick pngquant jpegoptim');
    return;
  }
  
  const directories = [
    { name: 'Public Blog Images', path: PUBLIC_BLOG_DIR },
    { name: 'Site Images', path: SRC_IMAGES_DIR }
  ];
  
  let totalSavings = 0;
  let totalFilesOptimized = 0;
  
  for (const dir of directories) {
    if (!fs.existsSync(dir.path)) {
      console.log(`⏭️  Skipping ${dir.name} - directory not found`);
      continue;
    }
    
    console.log(`📂 Processing ${dir.name}...`);
    const images = await findLargeImages(dir.path);
    console.log(`   Found ${images.length} images, ${images.filter(img => img.size > OPTIMIZE_THRESHOLD).length} over ${Math.round(OPTIMIZE_THRESHOLD / 1024)}KB threshold\n`);
    
    for (const image of images) {
      const result = await optimizeImage(image.path, tools);
      if (result) {
        totalSavings += result.savings;
        totalFilesOptimized++;
      }
    }
    
    console.log('');
  }
  
  console.log('🎉 Optimization Complete!');
  console.log('📊 Summary:');
  console.log(`   • Files optimized: ${totalFilesOptimized}`);
  console.log(`   • Total space saved: ${Math.round(totalSavings / 1024)}KB (${(totalSavings / (1024 * 1024)).toFixed(2)}MB)`);
  
  if (totalFilesOptimized > 0) {
    console.log('\n💡 Optimized images maintain visual quality while reducing file sizes');
    console.log('   This improves page load times and reduces bandwidth usage.');
  }
}

// Run optimization
optimizeAssets().catch(console.error);