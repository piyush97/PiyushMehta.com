// Performance Monitoring Utility
// Provides lightweight performance tracking and Core Web Vitals monitoring

interface PerformanceMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    // Observe paint timing
    this.observePaintTiming();

    // Observe largest contentful paint
    this.observeLCP();

    // Observe first input delay
    this.observeFID();

    // Observe cumulative layout shift
    this.observeCLS();

    // Observe interaction to next paint
    this.observeINP();
  }

  private observePaintTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = Math.round(entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', observer);
    } catch (_e) {
      // Silently fail if not supported
    }
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.LCP = Math.round(lastEntry.startTime);
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    } catch (_e) {
      // Silently fail if not supported
    }
  }

  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const firstEntry = list.getEntries()[0];
        if (firstEntry) {
          this.metrics.FID = Math.round(firstEntry.processingStart - firstEntry.startTime);
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    } catch (_e) {
      // Silently fail if not supported
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      const clsEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only count layout shifts without recent input
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            clsEntries.push(entry);
          }
        }
        this.metrics.CLS = Math.round(clsValue * 1000) / 1000;
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    } catch (_e) {
      // Silently fail if not supported
    }
  }

  private observeINP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'event' && entry.duration > 0) {
            const currentINP = this.metrics.INP || 0;
            this.metrics.INP = Math.max(currentINP, Math.round(entry.duration));
          }
        }
      });
      observer.observe({ entryTypes: ['event'] });
      this.observers.set('inp', observer);
    } catch (_e) {
      // Silently fail if not supported
    }
  }

  public getMetrics(): PerformanceMetrics {
    // Add TTFB if available
    if (typeof window !== 'undefined' && window.performance?.timing) {
      const timing = window.performance.timing;
      this.metrics.TTFB = Math.round(timing.responseStart - timing.requestStart);
    }

    return { ...this.metrics };
  }

  public logMetrics(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Core Web Vitals:', this.getMetrics());
    }
  }

  public sendMetrics(endpoint?: string): void {
    const metrics = this.getMetrics();

    // Only send if we have meaningful metrics
    if (Object.keys(metrics).length === 0) return;

    // Send to analytics endpoint if provided
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail analytics
      });
    }
  }

  public cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceMonitor = typeof window !== 'undefined' ? new PerformanceMonitor() : null;

// Export types
export type { PerformanceMetrics };
