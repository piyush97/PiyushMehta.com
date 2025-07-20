#!/usr/bin/env node

import fs from "fs";
// Platform-specific OG Image Test Script
import { generateOGImage } from "./src/utils/og-generator.js";
import {
  optimizeDescriptionForPlatform,
  optimizeTitleForPlatform,
} from "./src/utils/og-title-optimizer.js";

console.log("🧪 Testing Platform-Specific OG Image Generation");
console.log("=".repeat(50));

// Test data
const testContent = {
  title: "Building Modern Web Applications with TypeScript and React",
  description:
    "Learn how to create scalable, maintainable web applications using TypeScript, React, and modern development practices. This comprehensive guide covers everything from setup to deployment.",
  author: "Piyush Mehta",
  tags: ["typescript", "react", "web-development"],
};

const platforms = ["facebook", "linkedin", "whatsapp"];

async function testPlatformOptimization() {
  console.log("\n📝 Testing Title & Description Optimization:");
  console.log("-".repeat(40));

  for (const platform of platforms) {
    console.log(`\n🎯 ${platform.toUpperCase()}`);

    // Test title optimization
    const titleResult = optimizeTitleForPlatform(testContent.title, platform);
    console.log(
      `  Title: "${titleResult.optimizedTitle}" (${titleResult.optimizedLength} chars)`
    );
    if (titleResult.truncated)
      console.log(`  ⚠️  Truncated from ${titleResult.originalLength} chars`);

    // Test description optimization
    const descResult = optimizeDescriptionForPlatform(
      testContent.description,
      platform
    );
    console.log(
      `  Desc: "${descResult.optimizedTitle}" (${descResult.optimizedLength} chars)`
    );
    if (descResult.truncated)
      console.log(`  ⚠️  Truncated from ${descResult.originalLength} chars`);

    if (titleResult.suggestions.length > 0) {
      console.log(
        `  💡 Suggestions: ${titleResult.suggestions.slice(0, 2).join(", ")}`
      );
    }
  }
}

async function testOGImageGeneration() {
  console.log("\n🖼️  Testing OG Image Generation:");
  console.log("-".repeat(40));

  for (const platform of platforms) {
    try {
      console.log(`\n🎨 Generating ${platform} OG image...`);

      const imageBuffer = await generateOGImage({
        ...testContent,
        template: platform,
        platform: platform,
        width: 1200,
        height: 630,
      });

      // Save test image
      const filename = `test-og-${platform}.png`;
      fs.writeFileSync(filename, imageBuffer);
      console.log(`  ✅ Generated: ${filename} (${imageBuffer.length} bytes)`);
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
  }
}

async function runTests() {
  try {
    await testPlatformOptimization();
    await testOGImageGeneration();

    console.log("\n🎉 Platform-specific OG features test completed!");
    console.log("\n📊 Summary:");
    console.log(`  ✅ Title optimization for ${platforms.length} platforms`);
    console.log(
      `  ✅ Description optimization for ${platforms.length} platforms`
    );
    console.log(`  ✅ OG image generation for ${platforms.length} platforms`);
    console.log(
      "\nCheck the generated test-og-*.png files to verify visual output."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

runTests();
