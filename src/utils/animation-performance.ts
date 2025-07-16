// Animation Performance Optimization Utilities

/**
 * Performance monitoring and optimization for animations
 */
export class AnimationPerformanceMonitor {
  private performanceObserver: PerformanceObserver | null = null;
  private animationFrameId: number | null = null;
  private metrics: {
    fps: number[];
    longTasks: number;
    layoutShifts: number;
    renderTime: number[];
  } = {
    fps: [],
    longTasks: 0,
    layoutShifts: 0,
    renderTime: []
  };

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    this.setupPerformanceObserver();
    this.startFPSMonitoring();
  }

  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'longtask') {
            this.metrics.longTasks++;
            console.warn('Long task detected:', entry.duration);
          }
          
          if (entry.entryType === 'layout-shift') {
            this.metrics.layoutShifts++;
            if ((entry as any).value > 0.1) {
              console.warn('Significant layout shift:', (entry as any).value);
            }
          }
          
          if (entry.entryType === 'measure' && entry.name.includes('animation')) {
            this.metrics.renderTime.push(entry.duration);
          }
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['longtask', 'layout-shift', 'measure'] });
      } catch (_e) {
        console.warn('Performance observer not supported for all entry types');
      }
    }
  }

  private startFPSMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      const delta = currentTime - lastTime;

      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        this.metrics.fps.push(fps);
        
        if (fps < 30) {
          console.warn('Low FPS detected:', fps);
          this.optimizeAnimations();
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      this.animationFrameId = requestAnimationFrame(measureFPS);
    };

    this.animationFrameId = requestAnimationFrame(measureFPS);
  }

  private optimizeAnimations() {
    // Reduce animation quality for better performance
    const animatedElements = document.querySelectorAll('.will-animate, [class*="animate"]');
    animatedElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.willChange = 'auto';
      htmlElement.style.backfaceVisibility = 'hidden';
      htmlElement.style.perspective = '1000px';
    });

    // Disable non-essential animations
    const nonEssentialAnimations = document.querySelectorAll('.parallax-slow, .parallax-fast');
    nonEssentialAnimations.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.transform = 'none';
      htmlElement.style.willChange = 'auto';
    });
  }

  getMetrics() {
    const avgFPS = this.metrics.fps.length > 0 
      ? this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length 
      : 0;

    const avgRenderTime = this.metrics.renderTime.length > 0
      ? this.metrics.renderTime.reduce((a, b) => a + b, 0) / this.metrics.renderTime.length
      : 0;

    return {
      averageFPS: Math.round(avgFPS),
      longTasks: this.metrics.longTasks,
      layoutShifts: this.metrics.layoutShifts,
      averageRenderTime: Math.round(avgRenderTime)
    };
  }

  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

/**
 * Adaptive animation quality based on device capabilities
 */
export class AdaptiveAnimationQuality {
  private quality: 'high' | 'medium' | 'low' = 'high';
  private deviceCapabilities: {
    isHighEnd: boolean;
    isMobile: boolean;
    prefersReducedMotion: boolean;
    connectionSpeed: 'fast' | 'slow' | 'unknown';
  };

  constructor() {
    this.deviceCapabilities = this.assessDeviceCapabilities();
    this.quality = this.determineQuality();
    this.applyQualitySettings();
  }

  private assessDeviceCapabilities() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isHighEnd = this.isHighEndDevice();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connectionSpeed = this.getConnectionSpeed();

    return {
      isHighEnd,
      isMobile,
      prefersReducedMotion,
      connectionSpeed
    };
  }

  private isHighEndDevice(): boolean {
    // Check for high-end device indicators
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return false;

    const renderer = gl.getParameter(gl.RENDERER);
    const _vendor = gl.getParameter(gl.VENDOR);
    
    // Basic heuristics for high-end devices
    const hasHighEndGPU = renderer.includes('GeForce') || renderer.includes('Radeon') || renderer.includes('Apple');
    const hasGoodMemory = (navigator as any).deviceMemory ? (navigator as any).deviceMemory >= 4 : true;
    const hasGoodCPU = navigator.hardwareConcurrency >= 4;

    return hasHighEndGPU && hasGoodMemory && hasGoodCPU;
  }

  private getConnectionSpeed(): 'fast' | 'slow' | 'unknown' {
    const connection = (navigator as any).connection;
    if (!connection) return 'unknown';

    const effectiveType = connection.effectiveType;
    if (effectiveType === '4g' || effectiveType === '5g') {
      return 'fast';
    } else if (effectiveType === '3g' || effectiveType === '2g') {
      return 'slow';
    }

    return 'unknown';
  }

  private determineQuality(): 'high' | 'medium' | 'low' {
    if (this.deviceCapabilities.prefersReducedMotion) {
      return 'low';
    }

    if (this.deviceCapabilities.isHighEnd && this.deviceCapabilities.connectionSpeed === 'fast') {
      return 'high';
    }

    if (this.deviceCapabilities.isMobile || this.deviceCapabilities.connectionSpeed === 'slow') {
      return 'low';
    }

    return 'medium';
  }

  private applyQualitySettings() {
    const root = document.documentElement;
    root.setAttribute('data-animation-quality', this.quality);

    switch (this.quality) {
      case 'high':
        this.enableHighQualityAnimations();
        break;
      case 'medium':
        this.enableMediumQualityAnimations();
        break;
      case 'low':
        this.enableLowQualityAnimations();
        break;
    }
  }

  private enableHighQualityAnimations() {
    // Enable all animations with full quality
    const style = document.createElement('style');
    style.textContent = `
      :root[data-animation-quality="high"] .parallax-slow,
      :root[data-animation-quality="high"] .parallax-fast {
        will-change: transform;
      }
      
      :root[data-animation-quality="high"] .hover-glow:hover {
        box-shadow: 0 0 20px rgba(var(--color-accent-rgb), 0.3);
      }
    `;
    document.head.appendChild(style);
  }

  private enableMediumQualityAnimations() {
    // Reduce some effects for better performance
    const style = document.createElement('style');
    style.textContent = `
      :root[data-animation-quality="medium"] .parallax-slow,
      :root[data-animation-quality="medium"] .parallax-fast {
        will-change: auto;
        transform: none !important;
      }
      
      :root[data-animation-quality="medium"] .hover-glow:hover {
        box-shadow: 0 0 10px rgba(var(--color-accent-rgb), 0.2);
      }
    `;
    document.head.appendChild(style);
  }

  private enableLowQualityAnimations() {
    // Minimal animations for best performance
    const style = document.createElement('style');
    style.textContent = `
      :root[data-animation-quality="low"] * {
        animation-duration: 0.2s !important;
        transition-duration: 0.2s !important;
      }
      
      :root[data-animation-quality="low"] .parallax-slow,
      :root[data-animation-quality="low"] .parallax-fast {
        will-change: auto;
        transform: none !important;
      }
      
      :root[data-animation-quality="low"] .hover-glow:hover,
      :root[data-animation-quality="low"] .hover-lift:hover {
        box-shadow: none !important;
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  getQuality() {
    return this.quality;
  }

  getDeviceCapabilities() {
    return this.deviceCapabilities;
  }
}

/**
 * Animation batching for better performance
 */
export class AnimationBatcher {
  private pendingAnimations: (() => void)[] = [];
  private isProcessing = false;

  batch(animationFunction: () => void) {
    this.pendingAnimations.push(animationFunction);
    
    if (!this.isProcessing) {
      this.processBatch();
    }
  }

  private processBatch() {
    this.isProcessing = true;
    
    requestAnimationFrame(() => {
      const batch = this.pendingAnimations.splice(0, 10); // Process max 10 animations per frame
      
      batch.forEach(animation => {
        try {
          animation();
        } catch (error) {
          console.error('Animation error:', error);
        }
      });

      if (this.pendingAnimations.length > 0) {
        this.processBatch();
      } else {
        this.isProcessing = false;
      }
    });
  }
}

// Initialize performance monitoring
let performanceMonitor: AnimationPerformanceMonitor | null = null;
let adaptiveQuality: AdaptiveAnimationQuality | null = null;
let animationBatcher: AnimationBatcher | null = null;

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    performanceMonitor = new AnimationPerformanceMonitor();
    adaptiveQuality = new AdaptiveAnimationQuality();
    animationBatcher = new AnimationBatcher();

    // Make available globally for debugging
    (window as any).animationPerformance = {
      getMetrics: () => performanceMonitor?.getMetrics(),
      getQuality: () => adaptiveQuality?.getQuality(),
      getDeviceCapabilities: () => adaptiveQuality?.getDeviceCapabilities()
    };
  });
}

export { performanceMonitor, adaptiveQuality, animationBatcher };