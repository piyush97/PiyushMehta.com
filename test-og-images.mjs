#!/usr/bin/env node

/**
 * Test script to verify OG image generation and social media compatibility
 */

const testUrls = [
  {
    name: 'Bloom Filters Blog Post',
    url: 'http://localhost:4321/blog/bloom-filters',
    expectedImage: '/blog/bloom-filters/bloom-filter-hero.svg',
  },
  {
    name: 'OG Image API Direct',
    url: 'http://localhost:4321/api/og-enhanced?title=Test&description=Testing OG images',
    expectedImage: null, // This should return a generated image
  },
];

async function testUrl(url, name) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`URL: ${url}`);

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Extract OG image meta tag
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogImageMatch) {
      const ogImageUrl = ogImageMatch[1];
      console.log(`✅ OG Image found: ${ogImageUrl}`);

      // Test if the OG image URL is accessible
      try {
        const imageResponse = await fetch(
          ogImageUrl.startsWith('http') ? ogImageUrl : `http://localhost:4321${ogImageUrl}`
        );
        if (imageResponse.ok) {
          const contentType = imageResponse.headers.get('content-type');
          const contentLength = imageResponse.headers.get('content-length');
          console.log(`✅ Image accessible: ${contentType}, ${contentLength} bytes`);

          // Check if it's a reasonable size for social media
          const size = parseInt(contentLength);
          if (size < 5000) {
            console.log(`⚠️  Image might be too small (${size} bytes)`);
          } else if (size > 5000000) {
            console.log(`⚠️  Image might be too large (${size} bytes)`);
          } else {
            console.log(`✅ Image size looks good (${size} bytes)`);
          }
        } else {
          console.log(`❌ Image not accessible: ${imageResponse.status}`);
        }
      } catch (imageError) {
        console.log(`❌ Error fetching image: ${imageError.message}`);
      }
    } else {
      console.log(`❌ No OG image meta tag found`);
    }

    // Check for other important meta tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    console.log(`Title: ${titleMatch ? titleMatch[1] : 'Not found'}`);
    console.log(`Description: ${descriptionMatch ? descriptionMatch[1] : 'Not found'}`);
  } catch (error) {
    console.log(`❌ Error testing URL: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting OG Image Tests...\n');

  for (const test of testUrls) {
    await testUrl(test.url, test.name);
  }

  console.log('\n✨ Test complete!');
  console.log('\n💡 Tips for social media:');
  console.log('1. Use static images when possible (more reliable than generated ones)');
  console.log('2. Ensure images are at least 1200x630 pixels');
  console.log('3. Keep file size under 5MB');
  console.log('4. Use JPG or PNG format');
  console.log('5. Test with Facebook Sharing Debugger and Twitter Card Validator');
}

runTests().catch(console.error);
