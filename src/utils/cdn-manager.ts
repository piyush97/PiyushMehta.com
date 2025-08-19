// Multi-CDN management with automatic failover
interface CDNProvider {
  id: string;
  name: string;
  baseUrl: string;
  priority: number;
  isActive: boolean;
  healthCheckUrl?: string;
  regions: string[];
  features: string[];
}

interface CDNMetrics {
  responseTime: number;
  successRate: number;
  errorCount: number;
  lastCheck: number;
  bandwidth: number;
}

interface FailoverConfig {
  healthCheckInterval: number;
  failureThreshold: number;
  recoveryThreshold: number;
  retryAttempts: number;
  timeout: number;
}

export class CDNManager {
  private providers: Map<string, CDNProvider> = new Map();
  private metrics: Map<string, CDNMetrics> = new Map();
  private config: FailoverConfig;
  private currentProvider: string | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<FailoverConfig> = {}) {
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      failureThreshold: 3,
      recoveryThreshold: 5,
      retryAttempts: 3,
      timeout: 5000,
      ...config,
    };

    this.initializeProviders();
    this.startHealthChecks();
  }

  /**
   * Initialize CDN providers with configuration
   */
  private initializeProviders(): void {
    const providers: CDNProvider[] = [
      {
        id: 'cloudflare',
        name: 'Cloudflare',
        baseUrl: 'https://cdn.piyushmehta.com',
        priority: 1,
        isActive: true,
        healthCheckUrl: 'https://cdn.piyushmehta.com/health',
        regions: ['global'],
        features: ['edge-caching', 'ddos-protection', 'ssl-termination'],
      },
      {
        id: 'fastly',
        name: 'Fastly',
        baseUrl: 'https://fastly-cdn.piyushmehta.com',
        priority: 2,
        isActive: true,
        healthCheckUrl: 'https://fastly-cdn.piyushmehta.com/health',
        regions: ['us-east', 'us-west', 'eu-west', 'ap-southeast'],
        features: ['instant-purging', 'real-time-analytics', 'edge-computing'],
      },

      {
        id: 'vercel',
        name: 'Vercel Edge Network',
        baseUrl: 'https://vercel-cdn.piyushmehta.com',
        priority: 4,
        isActive: true,
        healthCheckUrl: 'https://vercel-cdn.piyushmehta.com/health',
        regions: ['global'],
        features: ['edge-functions', 'zero-config', 'automatic-optimization'],
      },
    ];

    providers.forEach((provider) => {
      this.providers.set(provider.id, provider);
      this.metrics.set(provider.id, {
        responseTime: 0,
        successRate: 100,
        errorCount: 0,
        lastCheck: Date.now(),
        bandwidth: 0,
      });
    });

    // Set initial current provider to highest priority active provider
    this.selectBestProvider();
  }

  /**
   * Get the optimal CDN URL for a resource
   */
  getOptimalUrl(
    resourcePath: string,
    options: {
      fileType?: 'image' | 'css' | 'js' | 'font' | 'document';
      region?: string;
      quality?: 'high' | 'medium' | 'low';
      fallbackToLocal?: boolean;
    } = {}
  ): string {
    const { fileType = 'document', region, quality = 'high', fallbackToLocal = true } = options;

    // Get best provider for this request
    const providerId = this.selectBestProvider(fileType, region);

    if (!providerId) {
      if (fallbackToLocal) {
        console.warn('No CDN provider available, falling back to local serving');
        return resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;
      }
      throw new Error('No CDN provider available');
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Build optimized URL with query parameters
    const baseUrl = provider.baseUrl.replace(/\/$/, '');
    const cleanPath = resourcePath.replace(/^\//, '');

    const params = new URLSearchParams();

    // Add optimization parameters based on file type
    if (fileType === 'image') {
      params.set('auto', 'format,compress');
      if (quality === 'high') params.set('q', '95');
      else if (quality === 'medium') params.set('q', '80');
      else params.set('q', '65');
    }

    if (fileType === 'css' || fileType === 'js') {
      params.set('minify', 'true');
    }

    // Add cache optimization
    params.set('cache', '31536000'); // 1 year

    const queryString = params.toString();
    const fullUrl = `${baseUrl}/${cleanPath}${queryString ? `?${queryString}` : ''}`;

    // Track usage for metrics
    this.recordUsage(providerId, resourcePath);

    return fullUrl;
  }

  /**
   * Select the best provider based on criteria
   */
  private selectBestProvider(fileType?: string, region?: string): string | null {
    const activeProviders = Array.from(this.providers.values())
      .filter((p) => p.isActive)
      .sort((a, b) => {
        const metricsA = this.metrics.get(a.id)!;
        const metricsB = this.metrics.get(b.id)!;

        // Calculate score based on multiple factors
        const scoreA = this.calculateProviderScore(a, metricsA, fileType, region);
        const scoreB = this.calculateProviderScore(b, metricsB, fileType, region);

        return scoreB - scoreA; // Higher score first
      });

    if (activeProviders.length === 0) {
      return null;
    }

    const selectedProvider = activeProviders[0];
    this.currentProvider = selectedProvider.id;

    return selectedProvider.id;
  }

  /**
   * Calculate provider score based on various factors
   */
  private calculateProviderScore(
    provider: CDNProvider,
    metrics: CDNMetrics,
    fileType?: string,
    region?: string
  ): number {
    let score = 100;

    // Priority weight (higher priority = higher score)
    score += (5 - provider.priority) * 20;

    // Performance metrics
    score += Math.max(0, 100 - metrics.responseTime / 10); // Response time (lower is better)
    score += metrics.successRate; // Success rate (higher is better)
    score -= metrics.errorCount; // Error count (lower is better)

    // Regional optimization
    if (region && provider.regions.includes(region)) {
      score += 30;
    } else if (provider.regions.includes('global')) {
      score += 10;
    }

    // Feature-based scoring
    if (fileType === 'image' && provider.features.includes('image-optimization')) {
      score += 20;
    }

    if (provider.features.includes('edge-caching')) {
      score += 15;
    }

    // Recency of metrics (prefer recently checked providers)
    const age = Date.now() - metrics.lastCheck;
    if (age < 60000)
      score += 10; // Last minute
    else if (age < 300000) score += 5; // Last 5 minutes

    return Math.max(0, score);
  }

  /**
   * Perform health checks on all providers
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.providers.values())
      .filter((provider) => provider.healthCheckUrl)
      .map((provider) => this.checkProviderHealth(provider));

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check health of a specific provider
   */
  private async checkProviderHealth(provider: CDNProvider): Promise<void> {
    if (!provider.healthCheckUrl) return;

    const metrics = this.metrics.get(provider.id)!;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(provider.healthCheckUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'CDN-Health-Check/1.0',
        },
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        // Successful health check
        metrics.responseTime = (metrics.responseTime + responseTime) / 2; // Moving average
        metrics.successRate = Math.min(100, metrics.successRate + 1);
        metrics.errorCount = Math.max(0, metrics.errorCount - 1);

        // Reactivate provider if it was inactive
        if (!provider.isActive && this.shouldReactivateProvider(provider.id)) {
          provider.isActive = true;
          console.log(`CDN provider ${provider.name} reactivated`);
        }
      } else {
        throw new Error(`Health check failed with status ${response.status}`);
      }
    } catch (error) {
      // Failed health check
      metrics.errorCount++;
      metrics.successRate = Math.max(0, metrics.successRate - 5);

      console.warn(`CDN health check failed for ${provider.name}:`, error);

      // Deactivate provider if it has too many failures
      if (provider.isActive && this.shouldDeactivateProvider(provider.id)) {
        provider.isActive = false;
        console.error(`CDN provider ${provider.name} deactivated due to health check failures`);

        // If this was the current provider, select a new one
        if (this.currentProvider === provider.id) {
          this.selectBestProvider();
        }
      }
    } finally {
      metrics.lastCheck = Date.now();
    }
  }

  /**
   * Check if provider should be deactivated
   */
  private shouldDeactivateProvider(providerId: string): boolean {
    const metrics = this.metrics.get(providerId);
    return metrics ? metrics.errorCount >= this.config.failureThreshold : false;
  }

  /**
   * Check if provider should be reactivated
   */
  private shouldReactivateProvider(providerId: string): boolean {
    const metrics = this.metrics.get(providerId);
    return metrics
      ? metrics.errorCount === 0 && metrics.successRate >= this.config.recoveryThreshold
      : false;
  }

  /**
   * Record usage for metrics tracking
   */
  private recordUsage(providerId: string, resourcePath: string): void {
    const metrics = this.metrics.get(providerId);
    if (metrics) {
      metrics.bandwidth += this.estimateResourceSize(resourcePath);
    }
  }

  /**
   * Estimate resource size for bandwidth tracking
   */
  private estimateResourceSize(resourcePath: string): number {
    const ext = resourcePath.split('.').pop()?.toLowerCase();

    // Rough estimates in bytes
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return 150000; // 150KB average image
      case 'js':
        return 50000; // 50KB average JS file
      case 'css':
        return 20000; // 20KB average CSS file
      case 'woff':
      case 'woff2':
        return 30000; // 30KB average font
      default:
        return 10000; // 10KB default
    }
  }

  /**
   * Start automated health checks
   */
  private startHealthChecks(): void {
    // Perform initial health check
    this.performHealthChecks();

    // Schedule regular health checks
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Get CDN metrics and status
   */
  getMetrics(): {
    providers: Array<{
      id: string;
      name: string;
      isActive: boolean;
      priority: number;
      metrics: CDNMetrics;
    }>;
    currentProvider: string | null;
    totalBandwidth: number;
    averageResponseTime: number;
  } {
    const providers = Array.from(this.providers.values()).map((provider) => ({
      id: provider.id,
      name: provider.name,
      isActive: provider.isActive,
      priority: provider.priority,
      metrics: this.metrics.get(provider.id)!,
    }));

    const totalBandwidth = Array.from(this.metrics.values()).reduce(
      (sum, metrics) => sum + metrics.bandwidth,
      0
    );

    const activeMetrics = providers.filter((p) => p.isActive).map((p) => p.metrics);
    const averageResponseTime =
      activeMetrics.length > 0
        ? activeMetrics.reduce((sum, m) => sum + m.responseTime, 0) / activeMetrics.length
        : 0;

    return {
      providers,
      currentProvider: this.currentProvider,
      totalBandwidth,
      averageResponseTime,
    };
  }

  /**
   * Manually trigger failover to specific provider
   */
  async failoverTo(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Perform health check on target provider
    if (provider.healthCheckUrl) {
      await this.checkProviderHealth(provider);
    }

    if (provider.isActive) {
      this.currentProvider = providerId;
      console.log(`Manually failed over to CDN provider: ${provider.name}`);
      return true;
    } else {
      console.error(`Cannot failover to inactive provider: ${provider.name}`);
      return false;
    }
  }

  /**
   * Generate CDN optimization report
   */
  generateReport(): string {
    const metrics = this.getMetrics();

    return `
# CDN Performance Report

## Current Status
- **Active Provider**: ${metrics.currentProvider || 'None'}
- **Total Providers**: ${metrics.providers.length}
- **Active Providers**: ${metrics.providers.filter((p) => p.isActive).length}
- **Total Bandwidth**: ${this.formatBytes(metrics.totalBandwidth)}
- **Average Response Time**: ${Math.round(metrics.averageResponseTime)}ms

## Provider Status
${metrics.providers
  .map(
    (provider) => `
### ${provider.name} (${provider.id})
- **Status**: ${provider.isActive ? '✅ Active' : '❌ Inactive'}
- **Priority**: ${provider.priority}
- **Response Time**: ${Math.round(provider.metrics.responseTime)}ms
- **Success Rate**: ${provider.metrics.successRate.toFixed(1)}%
- **Error Count**: ${provider.metrics.errorCount}
- **Bandwidth**: ${this.formatBytes(provider.metrics.bandwidth)}
- **Last Check**: ${new Date(provider.metrics.lastCheck).toLocaleString()}
`
  )
  .join('\n')}

## Recommendations
${this.generateRecommendations(metrics)
  .map((rec) => `- ${rec}`)
  .join('\n')}
`;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    const activeProviders = metrics.providers.filter((p: any) => p.isActive);

    if (activeProviders.length < 2) {
      recommendations.push('Consider adding more CDN providers for better redundancy');
    }

    const slowProviders = activeProviders.filter((p: any) => p.metrics.responseTime > 1000);
    if (slowProviders.length > 0) {
      recommendations.push(
        `Review slow providers: ${slowProviders.map((p: any) => p.name).join(', ')}`
      );
    }

    const errorProviders = activeProviders.filter((p: any) => p.metrics.errorCount > 5);
    if (errorProviders.length > 0) {
      recommendations.push(
        `Investigate error-prone providers: ${errorProviders.map((p: any) => p.name).join(', ')}`
      );
    }

    if (metrics.averageResponseTime > 500) {
      recommendations.push('Overall CDN response time is high - consider regional optimization');
    }

    return recommendations;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// Create singleton instance
export const cdnManager = new CDNManager({
  healthCheckInterval: 30000, // 30 seconds
  failureThreshold: 3,
  recoveryThreshold: 5,
  retryAttempts: 3,
  timeout: 5000,
});

// Utility functions for easy access
export function getCDNUrl(
  resourcePath: string,
  options?: Parameters<CDNManager['getOptimalUrl']>[1]
): string {
  return cdnManager.getOptimalUrl(resourcePath, options);
}

export function getCDNMetrics(): ReturnType<CDNManager['getMetrics']> {
  return cdnManager.getMetrics();
}

export async function triggerCDNFailover(providerId: string): Promise<boolean> {
  return cdnManager.failoverTo(providerId);
}

export function generateCDNReport(): string {
  return cdnManager.generateReport();
}

// Cleanup function for server shutdown
export function shutdownCDNManager(): void {
  cdnManager.stopHealthChecks();
}
