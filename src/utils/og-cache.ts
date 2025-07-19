// 🚀 Advanced OG Image Caching & Performance System
// Intelligent caching, pre-generation, and optimization strategies

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { generateOGImage, type OGImageParams } from './og-generator';

// 🎯 Cache Configuration
const CACHE_CONFIG = {
  // Cache directory (gitignored)
  cacheDir: path.join(process.cwd(), '.og-cache'),

  // Cache TTL (7 days)
  ttl: 7 * 24 * 60 * 60 * 1000,

  // Maximum cache size (100MB)
  maxCacheSize: 100 * 1024 * 1024,

  // Maximum individual file size (2MB)
  maxFileSize: 2 * 1024 * 1024,

  // Pregeneration batch size
  batchSize: 5,

  // Cache statistics
  enableStats: true,
};

// 📊 Cache Statistics
interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  totalGenerated: number;
  cacheSize: number;
  lastCleanup: Date;
  avgGenerationTime: number;
  hitRate?: string;
}

let cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  totalGenerated: 0,
  cacheSize: 0,
  lastCleanup: new Date(),
  avgGenerationTime: 0,
};

// 🔑 Cache Key Generation
function generateCacheKey(params: OGImageParams): string {
  const keyData = {
    title: params.title,
    description: params.description || '',
    template: params.template || 'default',
    theme: params.theme || 'dark',
    pageType: params.pageType || 'website',
    tags: (params.tags || []).sort().join(','),
    publishedTime: params.publishedTime?.toISOString() || '',
    author: params.author || '',
    category: params.category || '',
  };

  const keyString = JSON.stringify(keyData);
  return crypto.createHash('sha256').update(keyString).digest('hex');
}

// 🗂️ Cache Directory Management
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.access(CACHE_CONFIG.cacheDir);
  } catch {
    await fs.mkdir(CACHE_CONFIG.cacheDir, { recursive: true });
    console.log('📁 Created OG cache directory');
  }
}

// 📄 Cache File Management
async function getCacheFilePath(cacheKey: string): Promise<string> {
  return path.join(CACHE_CONFIG.cacheDir, `${cacheKey}.png`);
}

async function getCacheMetaPath(cacheKey: string): Promise<string> {
  return path.join(CACHE_CONFIG.cacheDir, `${cacheKey}.meta.json`);
}

// 🔍 Cache Validation
async function isCacheValid(cacheKey: string): Promise<boolean> {
  try {
    const metaPath = await getCacheMetaPath(cacheKey);
    const metaData = JSON.parse(await fs.readFile(metaPath, 'utf-8'));

    const age = Date.now() - new Date(metaData.created).getTime();
    return age < CACHE_CONFIG.ttl;
  } catch {
    return false;
  }
}

// 💾 Cache Storage
async function storeInCache(
  cacheKey: string,
  imageBuffer: Buffer,
  params: OGImageParams,
  generationTime: number
): Promise<void> {
  try {
    await ensureCacheDir();

    // Check file size
    if (imageBuffer.length > CACHE_CONFIG.maxFileSize) {
      console.warn(`⚠️ OG image too large for cache: ${imageBuffer.length} bytes`);
      return;
    }

    const filePath = await getCacheFilePath(cacheKey);
    const metaPath = await getCacheMetaPath(cacheKey);

    // Store image
    await fs.writeFile(filePath, imageBuffer);

    // Store metadata
    const metadata = {
      cacheKey,
      params,
      created: new Date().toISOString(),
      generationTime,
      fileSize: imageBuffer.length,
      version: '1.0',
    };

    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));

    if (import.meta.env.DEV) {
      console.log(
        `💾 Cached OG image: ${cacheKey} (${imageBuffer.length} bytes, ${generationTime}ms)`
      );
    }
  } catch (error) {
    console.error('❌ Failed to store in cache:', error);
  }
}

// 📖 Cache Retrieval
async function getFromCache(cacheKey: string): Promise<Buffer | null> {
  try {
    if (!(await isCacheValid(cacheKey))) {
      return null;
    }

    const filePath = await getCacheFilePath(cacheKey);
    const imageBuffer = await fs.readFile(filePath);

    cacheStats.hits++;

    if (import.meta.env.DEV) {
      console.log(`🎯 Cache hit for: ${cacheKey}`);
    }

    return imageBuffer;
  } catch {
    return null;
  }
}

// 🧹 Cache Cleanup
async function cleanupCache(): Promise<void> {
  try {
    await ensureCacheDir();

    const files = await fs.readdir(CACHE_CONFIG.cacheDir);
    const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

    let totalSize = 0;
    const filesToDelete: string[] = [];

    for (const metaFile of metaFiles) {
      const metaPath = path.join(CACHE_CONFIG.cacheDir, metaFile);
      const cacheKey = metaFile.replace('.meta.json', '');

      try {
        const metadata = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
        const age = Date.now() - new Date(metadata.created).getTime();

        if (age > CACHE_CONFIG.ttl) {
          // Mark for deletion - expired
          filesToDelete.push(cacheKey);
        } else {
          totalSize += metadata.fileSize || 0;
        }
      } catch {
        // Mark for deletion - corrupted metadata
        filesToDelete.push(cacheKey);
      }
    }

    // Delete expired/corrupted files
    for (const cacheKey of filesToDelete) {
      try {
        await fs.unlink(await getCacheFilePath(cacheKey));
        await fs.unlink(await getCacheMetaPath(cacheKey));
      } catch {
        // Ignore errors during cleanup
      }
    }

    // If cache is still too large, delete oldest files
    if (totalSize > CACHE_CONFIG.maxCacheSize) {
      const remainingMetaFiles = files.filter(
        (f) => f.endsWith('.meta.json') && !filesToDelete.includes(f.replace('.meta.json', ''))
      );

      // Sort by creation time
      const fileAges = await Promise.all(
        remainingMetaFiles.map(async (file) => {
          try {
            const metaPath = path.join(CACHE_CONFIG.cacheDir, file);
            const metadata = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
            return {
              file: file.replace('.meta.json', ''),
              created: new Date(metadata.created).getTime(),
              size: metadata.fileSize || 0,
            };
          } catch {
            return null;
          }
        })
      );

      const validFiles = fileAges.filter(Boolean).sort((a, b) => a!.created - b!.created);

      // Delete oldest until under size limit
      let currentSize = totalSize;
      for (const fileInfo of validFiles) {
        if (currentSize <= CACHE_CONFIG.maxCacheSize) break;

        try {
          await fs.unlink(await getCacheFilePath(fileInfo!.file));
          await fs.unlink(await getCacheMetaPath(fileInfo!.file));
          currentSize -= fileInfo!.size;
        } catch {
          // Ignore errors
        }
      }
    }

    cacheStats.lastCleanup = new Date();
    cacheStats.cacheSize = totalSize;

    if (import.meta.env.DEV) {
      console.log(
        `🧹 Cache cleanup completed. Deleted ${filesToDelete.length} files. Current size: ${Math.round(totalSize / 1024 / 1024)}MB`
      );
    }
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error);
  }
}

// 🚀 High-Performance OG Image Generator with Caching
export async function generateCachedOGImage(params: OGImageParams): Promise<Buffer> {
  const startTime = Date.now();
  const cacheKey = generateCacheKey(params);

  try {
    // Try to get from cache first
    const cachedImage = await getFromCache(cacheKey);
    if (cachedImage) {
      return cachedImage;
    }

    // Cache miss - generate new image
    cacheStats.misses++;

    const imageBuffer = await generateOGImage(params);
    const generationTime = Date.now() - startTime;

    // Update statistics
    cacheStats.totalGenerated++;
    cacheStats.avgGenerationTime =
      (cacheStats.avgGenerationTime * (cacheStats.totalGenerated - 1) + generationTime) /
      cacheStats.totalGenerated;

    // Store in cache (async, don't wait)
    storeInCache(cacheKey, imageBuffer, params, generationTime).catch((error) => {
      console.error('Cache storage failed:', error);
      cacheStats.errors++;
    });

    // Periodic cleanup (every 100 generations)
    if (cacheStats.totalGenerated % 100 === 0) {
      cleanupCache().catch((error) => {
        console.error('Cache cleanup failed:', error);
      });
    }

    return imageBuffer;
  } catch (error) {
    cacheStats.errors++;
    console.error('❌ OG image generation failed:', error);
    throw error;
  }
}

// 📊 Cache Statistics
export function getCacheStats(): CacheStats {
  const hitRate =
    cacheStats.hits + cacheStats.misses > 0
      ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)
      : 0;

  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
  } as CacheStats & { hitRate: string };
}

// 🎯 Pregeneration for Popular Pages
export async function pregenerateCommonOGImages(): Promise<void> {
  if (!import.meta.env.DEV) return; // Only in development

  const commonConfigs: OGImageParams[] = [
    // Homepage variations
    {
      title: 'Piyush Mehta - Senior Software Engineer & Full Stack Developer',
      description: 'Expert React.js, Node.js developer in Canada with 5+ years of experience.',
      template: 'professional',
      theme: 'corporate',
      pageType: 'website',
    },

    // Blog template variations
    {
      title: 'Understanding React.js Performance Optimization',
      description:
        'Deep dive into React.js performance optimization techniques and best practices.',
      template: 'modern',
      theme: 'dark',
      pageType: 'article',
      tags: ['react', 'performance', 'optimization'],
    },

    // Tech template variations
    {
      title: 'Building Scalable Node.js Applications',
      description: 'Comprehensive guide to building scalable backend applications with Node.js.',
      template: 'tech',
      theme: 'neon',
      pageType: 'article',
      tags: ['nodejs', 'backend', 'scalability'],
    },
  ];

  console.log('🎯 Pregenerating common OG images...');

  for (const config of commonConfigs) {
    try {
      await generateCachedOGImage(config);
      console.log(`✅ Pregenerated: ${config.title.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Failed to pregenerate: ${config.title}`, error);
    }
  }

  console.log('🎉 Pregeneration completed');
}

// 🗑️ Clear Cache (Development)
export async function clearCache(): Promise<void> {
  if (!import.meta.env.DEV) return;

  try {
    await fs.rm(CACHE_CONFIG.cacheDir, { recursive: true, force: true });
    console.log('🗑️ Cache cleared');

    // Reset stats
    cacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalGenerated: 0,
      cacheSize: 0,
      lastCleanup: new Date(),
      avgGenerationTime: 0,
    };
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

// Initialize cache on import
if (import.meta.env.DEV) {
  ensureCacheDir().catch(console.error);
}

export default generateCachedOGImage;
