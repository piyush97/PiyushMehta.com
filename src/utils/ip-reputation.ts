// IP Reputation scoring system for threat detection
import { Redis } from '@upstash/redis';
import { SECURITY_CONFIG } from './security-utils';

// Redis client for IP reputation caching
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

interface IPReputationScore {
  score: number; // 0.0 (malicious) to 1.0 (trusted)
  confidence: number; // 0.0 to 1.0
  sources: string[];
  lastUpdated: number;
  categories: string[];
}

interface ThreatIndicators {
  isBot: boolean;
  isTor: boolean;
  isVPN: boolean;
  isProxy: boolean;
  isDataCenter: boolean;
  isMalicious: boolean;
  geolocation: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export class IPReputationService {
  private cache = new Map<string, IPReputationScore>();
  private readonly CACHE_TTL = SECURITY_CONFIG.IP_REPUTATION_CACHE_TTL;

  /**
   * Get comprehensive IP reputation score
   */
  async getReputationScore(ip: string): Promise<IPReputationScore> {
    // Whitelist localhost and development IPs
    if (this.isLocalhost(ip)) {
      return this.getTrustedScore('localhost');
    }

    if (!this.isValidIP(ip)) {
      return this.getDefaultScore('invalid-ip');
    }

    // Check cache first
    const cached = await this.getCachedScore(ip);
    if (cached && this.isRecentScore(cached)) {
      return cached;
    }

    try {
      const score = await this.calculateReputationScore(ip);
      await this.cacheScore(ip, score);
      return score;
    } catch (error) {
      console.warn(`IP reputation check failed for ${ip}:`, error);
      return this.getDefaultScore('error');
    }
  }

  /**
   * Check if IP should be blocked based on reputation
   */
  async shouldBlockIP(ip: string): Promise<boolean> {
    // Never block localhost in development
    if (this.isLocalhost(ip)) {
      return false;
    }

    const reputation = await this.getReputationScore(ip);
    return reputation.score < SECURITY_CONFIG.IP_REPUTATION_THRESHOLD;
  }

  /**
   * Analyze threat indicators for an IP
   */
  async analyzeThreatIndicators(ip: string, userAgent: string): Promise<ThreatIndicators> {
    const indicators: ThreatIndicators = {
      isBot: this.detectBot(userAgent),
      isTor: await this.checkTorNetwork(ip),
      isVPN: await this.checkVPNProvider(ip),
      isProxy: await this.checkProxyService(ip),
      isDataCenter: await this.checkDataCenter(ip),
      isMalicious: await this.checkMaliciousIP(ip),
      geolocation: await this.getGeolocation(ip),
    };

    return indicators;
  }

  private async calculateReputationScore(ip: string): Promise<IPReputationScore> {
    const indicators = await this.analyzeThreatIndicators(ip, '');
    let score = 1.0; // Start with neutral/good reputation
    const sources: string[] = [];
    const categories: string[] = [];
    let confidence = 0.8; // Base confidence

    // Apply penalties based on threat indicators
    if (indicators.isMalicious) {
      score -= 0.8;
      categories.push('malicious');
      sources.push('threat-intel');
      confidence = 0.95;
    }

    if (indicators.isTor) {
      score -= 0.3;
      categories.push('tor');
      sources.push('tor-detection');
    }

    if (indicators.isVPN) {
      score -= 0.2;
      categories.push('vpn');
      sources.push('vpn-detection');
    }

    if (indicators.isProxy) {
      score -= 0.2;
      categories.push('proxy');
      sources.push('proxy-detection');
    }

    if (indicators.isDataCenter) {
      score -= 0.1;
      categories.push('datacenter');
      sources.push('datacenter-detection');
    }

    // Geolocation risk assessment
    if (indicators.geolocation.country) {
      const geoRisk = this.assessGeolocationRisk(indicators.geolocation.country);
      score -= geoRisk;
      if (geoRisk > 0) {
        categories.push('geo-risk');
        sources.push('geolocation');
      }
    }

    // Ensure score stays within bounds
    score = Math.max(0.0, Math.min(1.0, score));

    return {
      score,
      confidence,
      sources,
      lastUpdated: Date.now(),
      categories,
    };
  }

  private detectBot(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /postman/i,
    ];

    // Exclude legitimate bots
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i,
    ];

    const isBot = botPatterns.some((pattern) => pattern.test(userAgent));
    const isLegitimate = legitimateBots.some((pattern) => pattern.test(userAgent));

    return isBot && !isLegitimate;
  }

  private async checkTorNetwork(ip: string): Promise<boolean> {
    // In production, integrate with Tor exit node lists
    // For now, basic pattern detection
    const torPatterns = [
      /^127\.0\.0\.1$/, // Local Tor proxy
      /^::1$/, // IPv6 localhost
    ];

    return torPatterns.some((pattern) => pattern.test(ip));
  }

  private async checkVPNProvider(ip: string): Promise<boolean> {
    // In production, integrate with VPN provider databases
    // Basic implementation for known VPN ranges
    const vpnRanges = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

    return this.ipInRanges(ip, vpnRanges);
  }

  private async checkProxyService(ip: string): Promise<boolean> {
    // Check against known proxy service patterns
    // In production, integrate with proxy detection services
    return false; // Placeholder
  }

  private async checkDataCenter(ip: string): Promise<boolean> {
    // Check if IP belongs to data center ranges
    // In production, integrate with ASN databases
    return false; // Placeholder
  }

  private async checkMaliciousIP(ip: string): Promise<boolean> {
    // Check against threat intelligence feeds
    // In production, integrate with threat intel APIs
    return false; // Placeholder
  }

  private async getGeolocation(ip: string): Promise<ThreatIndicators['geolocation']> {
    // In production, integrate with geolocation service
    return {}; // Placeholder
  }

  private assessGeolocationRisk(country: string): number {
    // Risk scores based on country (0.0 = no risk, 1.0 = highest risk)
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
    const mediumRiskCountries = ['TR', 'PK', 'BD'];

    if (highRiskCountries.includes(country)) {
      return 0.3;
    }
    if (mediumRiskCountries.includes(country)) {
      return 0.1;
    }
    return 0.0;
  }

  private ipInRanges(ip: string, ranges: string[]): boolean {
    // Simplified CIDR matching - in production use proper CIDR library
    return ranges.some((range) => {
      if (range.includes('/')) {
        const [network] = range.split('/');
        // Implement proper CIDR matching
        return ip.startsWith(network.split('.').slice(0, 2).join('.'));
      }
      return ip === range;
    });
  }

  private async getCachedScore(ip: string): Promise<IPReputationScore | null> {
    if (redis) {
      try {
        const cached = await redis.get(`ip_reputation:${ip}`);
        return cached ? JSON.parse(cached as string) : null;
      } catch (error) {
        console.warn('Redis cache read failed:', error);
      }
    }

    return this.cache.get(ip) || null;
  }

  private async cacheScore(ip: string, score: IPReputationScore): Promise<void> {
    if (redis) {
      try {
        await redis.setex(`ip_reputation:${ip}`, this.CACHE_TTL, JSON.stringify(score));
      } catch (error) {
        console.warn('Redis cache write failed:', error);
      }
    }

    this.cache.set(ip, score);
  }

  private isRecentScore(score: IPReputationScore): boolean {
    return Date.now() - score.lastUpdated < this.CACHE_TTL * 1000;
  }

  private isValidIP(ip: string): boolean {
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Check if IP is localhost or development IP
   */
  private isLocalhost(ip: string): boolean {
    const localhostPatterns = [
      /^127\.\d+\.\d+\.\d+$/, // IPv4 localhost (127.0.0.0/8)
      /^::1$/, // IPv6 localhost
      /^::ffff:127\.\d+\.\d+\.\d+$/, // IPv4-mapped IPv6 localhost
      /^10\.\d+\.\d+\.\d+$/, // Private network 10.0.0.0/8
      /^192\.168\.\d+\.\d+$/, // Private network 192.168.0.0/16
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, // Private network 172.16.0.0/12
    ];

    return (
      localhostPatterns.some((pattern) => pattern.test(ip)) ||
      ip === 'unknown' ||
      ip === 'prerendered'
    );
  }

  private getTrustedScore(reason: string): IPReputationScore {
    return {
      score: 1.0, // Fully trusted
      confidence: 1.0,
      sources: ['localhost-whitelist'],
      lastUpdated: Date.now(),
      categories: [reason],
    };
  }

  private getDefaultScore(reason: string): IPReputationScore {
    return {
      score: 0.5, // Neutral score for unknown/error cases
      confidence: 0.1,
      sources: ['default'],
      lastUpdated: Date.now(),
      categories: [reason],
    };
  }
}

// Singleton instance
export const ipReputationService = new IPReputationService();
