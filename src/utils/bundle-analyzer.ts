// Bundle analysis and optimization utilities
import { promises as fs } from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';

interface BundleStats {
  file: string;
  size: number;
  gzipSize: number;
  type: 'js' | 'css' | 'asset';
  chunk: string;
  imports: string[];
  exports: string[];
}

interface BundleAnalysis {
  totalSize: number;
  totalGzipSize: number;
  jsSize: number;
  cssSize: number;
  assetSize: number;
  chunks: BundleStats[];
  recommendations: string[];
  performance: {
    score: number;
    metrics: {
      initialBundle: number;
      vendorBundle: number;
      criticalResources: number;
    };
  };
}

export class BundleAnalyzer {
  private distPath: string;
  private analysis: BundleAnalysis | null = null;

  constructor(distPath = 'dist') {
    this.distPath = distPath;
  }

  /**
   * Analyze the built bundle
   */
  async analyze(): Promise<BundleAnalysis> {
    try {
      const files = await this.findBundleFiles();
      const chunks = await Promise.all(files.map((file) => this.analyzeFile(file)));

      const analysis: BundleAnalysis = {
        totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
        totalGzipSize: chunks.reduce((sum, chunk) => sum + chunk.gzipSize, 0),
        jsSize: chunks.filter((c) => c.type === 'js').reduce((sum, chunk) => sum + chunk.size, 0),
        cssSize: chunks.filter((c) => c.type === 'css').reduce((sum, chunk) => sum + chunk.size, 0),
        assetSize: chunks
          .filter((c) => c.type === 'asset')
          .reduce((sum, chunk) => sum + chunk.size, 0),
        chunks,
        recommendations: this.generateRecommendations(chunks),
        performance: this.calculatePerformanceScore(chunks),
      };

      this.analysis = analysis;
      return analysis;
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      return this.getEmptyAnalysis();
    }
  }

  /**
   * Generate a detailed report
   */
  generateReport(): string {
    if (!this.analysis) {
      return 'No analysis available. Run analyze() first.';
    }

    const { analysis } = this;
    const report = `
# Bundle Analysis Report

## Summary
- **Total Size**: ${this.formatSize(analysis.totalSize)}
- **Total Gzipped**: ${this.formatSize(analysis.totalGzipSize)}
- **Performance Score**: ${analysis.performance.score}/100

## Breakdown
- **JavaScript**: ${this.formatSize(analysis.jsSize)} (${this.getPercentage(analysis.jsSize, analysis.totalSize)}%)
- **CSS**: ${this.formatSize(analysis.cssSize)} (${this.getPercentage(analysis.cssSize, analysis.totalSize)}%)
- **Assets**: ${this.formatSize(analysis.assetSize)} (${this.getPercentage(analysis.assetSize, analysis.totalSize)}%)

## Performance Metrics
- **Initial Bundle**: ${this.formatSize(analysis.performance.metrics.initialBundle)}
- **Vendor Bundle**: ${this.formatSize(analysis.performance.metrics.vendorBundle)}
- **Critical Resources**: ${analysis.performance.metrics.criticalResources}

## Largest Chunks
${analysis.chunks
  .sort((a, b) => b.size - a.size)
  .slice(0, 10)
  .map(
    (chunk) =>
      `- ${chunk.file}: ${this.formatSize(chunk.size)} (${this.formatSize(chunk.gzipSize)} gzipped)`
  )
  .join('\n')}

## Recommendations
${analysis.recommendations.map((rec) => `- ${rec}`).join('\n')}

## Detailed Chunk Analysis
${analysis.chunks
  .map(
    (chunk) => `
### ${chunk.file}
- **Size**: ${this.formatSize(chunk.size)}
- **Gzipped**: ${this.formatSize(chunk.gzipSize)}
- **Type**: ${chunk.type}
- **Chunk**: ${chunk.chunk}
- **Compression Ratio**: ${((1 - chunk.gzipSize / chunk.size) * 100).toFixed(1)}%
`
  )
  .join('\n')}
`;

    return report;
  }

  /**
   * Save analysis to file
   */
  async saveAnalysis(filename = 'bundle-analysis.json'): Promise<void> {
    if (!this.analysis) {
      throw new Error('No analysis available');
    }

    const outputPath = path.join(this.distPath, filename);
    await fs.writeFile(outputPath, JSON.stringify(this.analysis, null, 2));
    console.log(`Bundle analysis saved to ${outputPath}`);
  }

  /**
   * Check if bundles meet performance budgets
   */
  checkPerformanceBudgets(): {
    passed: boolean;
    violations: string[];
  } {
    if (!this.analysis) {
      return { passed: false, violations: ['No analysis available'] };
    }

    const budgets = {
      initialBundle: 300 * 1024, // 300KB
      totalBundle: 2 * 1024 * 1024, // 2MB
      individualChunk: 500 * 1024, // 500KB
      cssBundle: 100 * 1024, // 100KB
    };

    const violations: string[] = [];

    // Check initial bundle size
    if (this.analysis.performance.metrics.initialBundle > budgets.initialBundle) {
      violations.push(
        `Initial bundle exceeds budget: ${this.formatSize(this.analysis.performance.metrics.initialBundle)} > ${this.formatSize(budgets.initialBundle)}`
      );
    }

    // Check total bundle size
    if (this.analysis.totalSize > budgets.totalBundle) {
      violations.push(
        `Total bundle exceeds budget: ${this.formatSize(this.analysis.totalSize)} > ${this.formatSize(budgets.totalBundle)}`
      );
    }

    // Check individual chunk sizes
    const largeChunks = this.analysis.chunks.filter(
      (chunk) => chunk.size > budgets.individualChunk
    );
    if (largeChunks.length > 0) {
      violations.push(
        `Large chunks found: ${largeChunks.map((c) => `${c.file} (${this.formatSize(c.size)})`).join(', ')}`
      );
    }

    // Check CSS bundle size
    if (this.analysis.cssSize > budgets.cssBundle) {
      violations.push(
        `CSS bundle exceeds budget: ${this.formatSize(this.analysis.cssSize)} > ${this.formatSize(budgets.cssBundle)}`
      );
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  private async findBundleFiles(): Promise<string[]> {
    const files: string[] = [];

    async function scanDirectory(dir: string): Promise<void> {
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(dir, item.name);

          if (item.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (item.isFile() && this.isBundleFile(item.name)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Could not scan directory ${dir}:`, error);
      }
    }

    await scanDirectory.call(this, this.distPath);
    return files;
  }

  private isBundleFile(filename: string): boolean {
    const bundleExtensions = ['.js', '.css', '.woff', '.woff2', '.png', '.jpg', '.svg', '.webp'];
    const ext = path.extname(filename);
    return bundleExtensions.includes(ext) && !filename.includes('.map');
  }

  private async analyzeFile(filePath: string): Promise<BundleStats> {
    try {
      const content = await fs.readFile(filePath);
      const size = content.length;
      const gzipSize = gzipSync(content).length;
      const ext = path.extname(filePath);
      const filename = path.basename(filePath);

      let type: 'js' | 'css' | 'asset';
      if (ext === '.js') type = 'js';
      else if (ext === '.css') type = 'css';
      else type = 'asset';

      // Determine chunk name from filename
      const chunk = this.extractChunkName(filename);

      // For JS files, try to extract imports/exports (simplified)
      let imports: string[] = [];
      let exports: string[] = [];

      if (type === 'js') {
        const contentStr = content.toString();
        imports = this.extractImports(contentStr);
        exports = this.extractExports(contentStr);
      }

      return {
        file: filename,
        size,
        gzipSize,
        type,
        chunk,
        imports,
        exports,
      };
    } catch (error) {
      console.warn(`Could not analyze file ${filePath}:`, error);
      return {
        file: path.basename(filePath),
        size: 0,
        gzipSize: 0,
        type: 'asset',
        chunk: 'unknown',
        imports: [],
        exports: [],
      };
    }
  }

  private extractChunkName(filename: string): string {
    // Extract chunk name from filename patterns like "vendor-react-a1b2c3.js"
    const match = filename.match(/^([^-]+(?:-[^-]+)*)-[a-f0-9]+\./);
    return match ? match[1] : path.parse(filename).name;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];

    // Match import statements (simplified)
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return [...new Set(imports)]; // Remove duplicates
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];

    // Match export statements (simplified)
    const exportRegex = /export\s+(?:default\s+)?(?:const\s+|function\s+|class\s+)?(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return [...new Set(exports)]; // Remove duplicates
  }

  private generateRecommendations(chunks: BundleStats[]): string[] {
    const recommendations: string[] = [];

    // Large chunks
    const largeChunks = chunks.filter((chunk) => chunk.size > 500 * 1024);
    if (largeChunks.length > 0) {
      recommendations.push(
        `Consider splitting large chunks: ${largeChunks.map((c) => c.file).join(', ')}`
      );
    }

    // Poor compression ratio
    const poorlyCompressed = chunks.filter(
      (chunk) => chunk.size > 10 * 1024 && chunk.gzipSize / chunk.size > 0.7
    );
    if (poorlyCompressed.length > 0) {
      recommendations.push(
        `Some files have poor compression ratios: ${poorlyCompressed.map((c) => c.file).join(', ')}`
      );
    }

    // Too many small chunks
    const smallChunks = chunks.filter((chunk) => chunk.size < 5 * 1024);
    if (smallChunks.length > 10) {
      recommendations.push(`Consider combining small chunks (${smallChunks.length} chunks < 5KB)`);
    }

    // Missing vendor chunks
    const hasVendorChunk = chunks.some((chunk) => chunk.chunk.includes('vendor'));
    if (!hasVendorChunk) {
      recommendations.push('Consider creating vendor chunks for better caching');
    }

    return recommendations;
  }

  private calculatePerformanceScore(chunks: BundleStats[]): {
    score: number;
    metrics: { initialBundle: number; vendorBundle: number; criticalResources: number };
  } {
    const jsChunks = chunks.filter((c) => c.type === 'js');
    const initialBundle =
      jsChunks.find((c) => c.file.includes('index') || c.file.includes('main'))?.size || 0;
    const vendorBundle = jsChunks
      .filter((c) => c.chunk.includes('vendor'))
      .reduce((sum, c) => sum + c.size, 0);
    const criticalResources = chunks.filter((c) => c.size > 100 * 1024).length;

    // Calculate score based on various factors
    let score = 100;

    // Penalize large initial bundle
    if (initialBundle > 300 * 1024) score -= 20;
    else if (initialBundle > 200 * 1024) score -= 10;

    // Penalize large vendor bundle
    if (vendorBundle > 1024 * 1024) score -= 15;
    else if (vendorBundle > 500 * 1024) score -= 8;

    // Penalize too many critical resources
    if (criticalResources > 10) score -= 15;
    else if (criticalResources > 5) score -= 8;

    // Penalize poor overall compression
    const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
    const totalGzipSize = chunks.reduce((sum, c) => sum + c.gzipSize, 0);
    const compressionRatio = totalGzipSize / totalSize;
    if (compressionRatio > 0.8) score -= 10;

    return {
      score: Math.max(0, score),
      metrics: {
        initialBundle,
        vendorBundle,
        criticalResources,
      },
    };
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private getPercentage(part: number, total: number): string {
    return ((part / total) * 100).toFixed(1);
  }

  private getEmptyAnalysis(): BundleAnalysis {
    return {
      totalSize: 0,
      totalGzipSize: 0,
      jsSize: 0,
      cssSize: 0,
      assetSize: 0,
      chunks: [],
      recommendations: ['Bundle analysis failed'],
      performance: {
        score: 0,
        metrics: {
          initialBundle: 0,
          vendorBundle: 0,
          criticalResources: 0,
        },
      },
    };
  }
}

// Export utilities
export const bundleAnalyzer = new BundleAnalyzer();

export async function analyzeBundles(): Promise<BundleAnalysis> {
  return bundleAnalyzer.analyze();
}

export async function checkPerformanceBudgets(): Promise<{
  passed: boolean;
  violations: string[];
}> {
  await bundleAnalyzer.analyze();
  return bundleAnalyzer.checkPerformanceBudgets();
}
