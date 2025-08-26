import { chromium } from '@playwright/test';

async function auditSEO() {
  console.log('🔍 Starting SEO Optimization Audit...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to blog post
    console.log('📍 Navigating to blog post...');
    await page.goto('http://localhost:4322/blog/macos-to-arch-linux-omarchy-developer-productivity/');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Meta Tags Analysis
    console.log('🏷️ Analyzing Meta Tags...\n');
    
    const metaData = await page.evaluate(() => {
      return {
        title: document.title,
        metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
        ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        ogType: document.querySelector('meta[property="og:type"]')?.getAttribute('content'),
        twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
        twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
        twitterDescription: document.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
        twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
        themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
        appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
        favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
      };
    });
    
    // Check meta tags
    console.log('Meta Tags Analysis:');
    console.log(`  - Title: ${metaData.title} ${metaData.title ? '✅' : '❌'}`);
    console.log(`  - Description: ${metaData.metaDescription ? `${metaData.metaDescription.slice(0, 80)}...` : 'Missing'} ${metaData.metaDescription ? '✅' : '❌'}`);
    console.log(`  - Canonical URL: ${metaData.canonical ? '✅' : '❌'}`);
    console.log(`  - Viewport: ${metaData.viewport ? '✅' : '❌'}`);
    console.log(`  - Robots: ${metaData.robots || 'Default'} ${metaData.robots ? '✅' : '⚠️'}`);
    
    console.log('\\nOpen Graph Tags:');
    console.log(`  - OG Title: ${metaData.ogTitle ? '✅' : '❌'}`);
    console.log(`  - OG Description: ${metaData.ogDescription ? '✅' : '❌'}`);
    console.log(`  - OG Image: ${metaData.ogImage ? '✅' : '❌'}`);
    console.log(`  - OG Type: ${metaData.ogType || 'website'} ${metaData.ogType ? '✅' : '⚠️'}`);
    
    console.log('\\nTwitter Cards:');
    console.log(`  - Twitter Card: ${metaData.twitterCard || 'summary'} ${metaData.twitterCard ? '✅' : '⚠️'}`);
    console.log(`  - Twitter Title: ${metaData.twitterTitle ? '✅' : '❌'}`);
    console.log(`  - Twitter Description: ${metaData.twitterDescription ? '✅' : '❌'}`);
    console.log(`  - Twitter Image: ${metaData.twitterImage ? '✅' : '❌'}`);
    
    console.log('\\nFavicons & Icons:');
    console.log(`  - Theme Color: ${metaData.themeColor ? '✅' : '❌'}`);
    console.log(`  - Apple Touch Icon: ${metaData.appleTouchIcon ? '✅' : '❌'}`);
    console.log(`  - Favicon: ${metaData.favicon ? '✅' : '❌'}`);
    
    // Test 2: Content Structure
    console.log('\\n📄 Analyzing Content Structure...');
    
    const contentData = await page.evaluate(() => {
      const h1s = Array.from(document.querySelectorAll('h1'));
      const images = Array.from(document.querySelectorAll('img'));
      const links = Array.from(document.querySelectorAll('a'));
      const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      
      return {
        h1Count: h1s.length,
        h1Texts: h1s.map(h => h.textContent?.trim()),
        imagesWithoutAlt: images.filter(img => !img.alt).length,
        totalImages: images.length,
        externalLinks: links.filter(link => {
          const href = link.href;
          return href && (href.startsWith('http://') || href.startsWith('https://')) && !href.includes(window.location.hostname);
        }).length,
        internalLinks: links.filter(link => {
          const href = link.href;
          return href && href.includes(window.location.hostname);
        }).length,
        structuredDataCount: structuredData.length,
        structuredDataTypes: structuredData.map(script => {
          try {
            const data = JSON.parse(script.textContent || '{}');
            return data['@type'] || 'Unknown';
          } catch {
            return 'Invalid JSON';
          }
        })
      };
    });
    
    console.log('Content Structure:');
    console.log(`  - H1 Tags: ${contentData.h1Count} ${contentData.h1Count === 1 ? '✅' : contentData.h1Count === 0 ? '❌' : '⚠️ Multiple H1s'}`);
    if (contentData.h1Count > 0) {
      console.log(`    - H1 Text: "${contentData.h1Texts[0]?.slice(0, 60)}..."`);
    }
    console.log(`  - Images: ${contentData.totalImages} total, ${contentData.imagesWithoutAlt} without alt text ${contentData.imagesWithoutAlt === 0 ? '✅' : '⚠️'}`);
    console.log(`  - Links: ${contentData.internalLinks} internal, ${contentData.externalLinks} external`);
    console.log(`  - Structured Data: ${contentData.structuredDataCount} schemas ${contentData.structuredDataCount > 0 ? '✅' : '⚠️'}`);
    if (contentData.structuredDataCount > 0) {
      console.log(`    - Types: ${contentData.structuredDataTypes.join(', ')}`);
    }
    
    // Test 3: Performance Metrics
    console.log('\\n⚡ Checking Performance Indicators...');
    
    const performanceData = await page.evaluate(() => {
      return {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        resourceCount: performance.getEntriesByType('resource').length,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasWebManifest: document.querySelector('link[rel="manifest"]') !== null,
        hasPreconnects: document.querySelectorAll('link[rel="preconnect"]').length,
        hasPreloads: document.querySelectorAll('link[rel="preload"]').length,
        hasLazyImages: document.querySelectorAll('img[loading="lazy"]').length
      };
    });
    
    console.log('Performance Indicators:');
    console.log(`  - Page Load Time: ${performanceData.loadTime}ms ${performanceData.loadTime < 3000 ? '✅' : '⚠️'}`);
    console.log(`  - DOM Content Loaded: ${performanceData.domContentLoaded}ms ${performanceData.domContentLoaded < 1500 ? '✅' : '⚠️'}`);
    console.log(`  - Resource Count: ${performanceData.resourceCount}`);
    console.log(`  - Service Worker: ${performanceData.hasServiceWorker ? '✅' : '❌'}`);
    console.log(`  - Web Manifest: ${performanceData.hasWebManifest ? '✅' : '❌'}`);
    console.log(`  - Preconnects: ${performanceData.hasPreconnects} ${performanceData.hasPreconnects > 0 ? '✅' : '⚠️'}`);
    console.log(`  - Preloads: ${performanceData.hasPreloads} ${performanceData.hasPreloads > 0 ? '✅' : '⚠️'}`);
    console.log(`  - Lazy Images: ${performanceData.hasLazyImages} ${performanceData.hasLazyImages > 0 ? '✅' : '⚠️'}`);
    
    // Test 4: Mobile Optimization
    console.log('\\n📱 Checking Mobile Optimization...');
    
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.waitForTimeout(1000);
    
    const mobileData = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const smallButtons = buttons.filter(btn => {
        const rect = btn.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      });
      
      return {
        viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
        smallButtonsCount: smallButtons.length,
        totalButtons: buttons.filter(btn => {
          const rect = btn.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }).length
      };
    });
    
    console.log('Mobile Optimization:');
    console.log(`  - Viewport Meta: ${mobileData.viewport ? '✅' : '❌'}`);
    console.log(`  - Touch Target Size: ${mobileData.totalButtons - mobileData.smallButtonsCount}/${mobileData.totalButtons} buttons are touch-friendly ${mobileData.smallButtonsCount === 0 ? '✅' : '⚠️'}`);
    
    // Test 5: Security Headers (basic check)
    console.log('\\n🔒 Checking Security Indicators...');
    
    const securityData = await page.evaluate(() => {
      return {
        httpsProtocol: location.protocol === 'https:',
        hasCSP: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
        hasReferrerPolicy: document.querySelector('meta[name="referrer"]') !== null,
        mixedContent: Array.from(document.querySelectorAll('*')).some(el => {
          const src = el.src || el.href;
          return src && src.startsWith('http://') && location.protocol === 'https:';
        })
      };
    });
    
    console.log('Security Indicators:');
    console.log(`  - HTTPS Protocol: ${securityData.httpsProtocol ? '✅' : '❌'}`);
    console.log(`  - CSP Header: ${securityData.hasCSP ? '✅' : '⚠️'}`);
    console.log(`  - Referrer Policy: ${securityData.hasReferrerPolicy ? '✅' : '⚠️'}`);
    console.log(`  - Mixed Content: ${securityData.mixedContent ? '❌ Found' : '✅ None'}`);
    
    console.log('\\n✅ SEO audit complete!');
    
  } catch (error) {
    console.error('❌ SEO audit error:', error);
  } finally {
    await browser.close();
  }
}

auditSEO().catch(console.error);