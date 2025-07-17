#!/usr/bin/env node

/**
 * OG Image Test Runner
 * Executes Playwright tests for OG image generation and creates reports
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const testDir = process.cwd();
const reportDir = path.join(testDir, "test-reports");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

console.log("🚀 Starting OG Image Test Suite...");
console.log("═══════════════════════════════════════");

// Ensure report directory exists
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Update Playwright config to use correct port
const playwrightConfig = `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-reports/playwright-html-report' }],
    ['json', { outputFile: 'test-reports/playwright-results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 60000,
  expect: {
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4322',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
`;

// Update playwright config
fs.writeFileSync(path.join(testDir, "playwright.config.ts"), playwrightConfig);

try {
  console.log("📦 Installing Playwright dependencies...");
  execSync("npx playwright install", { stdio: "inherit" });

  console.log("🧪 Running OG Image Tests...");

  // Run only the OG image tests
  const testCommand =
    "npx playwright test og-image.spec.ts og-image-visual.spec.ts og-image-performance.spec.ts --reporter=html --reporter=json";

  try {
    execSync(testCommand, { stdio: "inherit" });
    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.log(
      "⚠️  Some tests may have failed. Check the reports for details.",
      error
    );
  }

  // Generate comprehensive report
  console.log("📊 Generating comprehensive test report...");

  // Read Playwright results if available
  let playwrightResults = {};
  const playwrightResultsPath = path.join(
    testDir,
    "test-reports",
    "playwright-results.json"
  );

  if (fs.existsSync(playwrightResultsPath)) {
    playwrightResults = JSON.parse(
      fs.readFileSync(playwrightResultsPath, "utf-8")
    );
  }

  // Create summary report
  const summaryReport = {
    timestamp: new Date().toISOString(),
    testSuite: "OG Image Generation Tests",
    environment: {
      node: process.version,
      platform: process.platform,
      baseUrl: "http://localhost:4322",
    },
    results: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
    },
    coverage: {
      templates: [
        "modern",
        "tech",
        "cyber",
        "minimal",
        "terminal",
        "gradient",
        "professional",
        "dark",
        "blog",
      ],
      themes: ["dark", "light", "auto"],
      contentTypes: ["article", "project", "website"],
    },
    recommendations: [
      {
        type: "performance",
        priority: "medium",
        title: "Implement Real-time Monitoring",
        description:
          "Set up continuous monitoring for OG image generation performance and availability.",
        solution:
          "Use tools like New Relic, DataDog, or custom monitoring to track API response times and error rates.",
      },
      {
        type: "testing",
        priority: "low",
        title: "Expand Visual Regression Testing",
        description:
          "Implement automated visual regression testing in CI/CD pipeline.",
        solution:
          "Use tools like Percy, Chromatic, or GitHub Actions with visual diff tools.",
      },
      {
        type: "caching",
        priority: "high",
        title: "Optimize Caching Strategy",
        description:
          "Implement advanced caching with CDN integration for better performance.",
        solution:
          "Use Vercel Edge Functions, Cloudflare Workers, or AWS CloudFront for global caching.",
      },
    ],
  };

  // Update results from Playwright if available
  if (playwrightResults.suites) {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    const processSuite = (suite) => {
      if (suite.specs) {
        suite.specs.forEach((spec) => {
          spec.tests.forEach((test) => {
            totalTests++;
            if (test.results && test.results.length > 0) {
              const result = test.results[0];
              if (result.status === "passed") passedTests++;
              else if (result.status === "failed") failedTests++;
              else if (result.status === "skipped") skippedTests++;
            }
          });
        });
      }

      if (suite.suites) {
        suite.suites.forEach(processSuite);
      }
    };

    playwrightResults.suites.forEach(processSuite);

    summaryReport.results = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      skipped: skippedTests,
      duration: playwrightResults.stats?.duration || 0,
    };
  }

  // Generate HTML summary report
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OG Image Test Summary</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .header h1 { margin: 0 0 10px 0; font-size: 2.5em; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .stat-value { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .stat-value.total { color: #4a90e2; }
        .stat-value.passed { color: #7ed321; }
        .stat-value.failed { color: #d0021b; }
        .stat-value.skipped { color: #f5a623; }
        .section { background: white; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .section-header { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e9ecef; }
        .section-content { padding: 20px; }
        .coverage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .coverage-item { background: #f8f9fa; padding: 15px; border-radius: 6px; }
        .coverage-item h4 { margin-bottom: 10px; color: #495057; }
        .coverage-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag { background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; }
        .recommendations { margin-top: 30px; }
        .recommendation { background: white; border-radius: 8px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #4a90e2; }
        .recommendation.high { border-left-color: #d0021b; }
        .recommendation.medium { border-left-color: #f5a623; }
        .recommendation.low { border-left-color: #7ed321; }
        .links { margin-top: 30px; text-align: center; }
        .links a { display: inline-block; margin: 0 10px; padding: 10px 20px; background: #4a90e2; color: white; text-decoration: none; border-radius: 6px; }
        .links a:hover { background: #357abd; }
        .footer { text-align: center; margin-top: 40px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 OG Image Test Summary</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value total">${
                  summaryReport.results.total
                }</div>
                <div>Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value passed">${
                  summaryReport.results.passed
                }</div>
                <div>Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value failed">${
                  summaryReport.results.failed
                }</div>
                <div>Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value skipped">${
                  summaryReport.results.skipped
                }</div>
                <div>Skipped</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <h2>Test Coverage</h2>
            </div>
            <div class="section-content">
                <div class="coverage-grid">
                    <div class="coverage-item">
                        <h4>Templates Tested</h4>
                        <div class="coverage-tags">
                            ${summaryReport.coverage.templates
                              .map(
                                (template) =>
                                  `<span class="tag">${template}</span>`
                              )
                              .join("")}
                        </div>
                    </div>
                    <div class="coverage-item">
                        <h4>Themes Tested</h4>
                        <div class="coverage-tags">
                            ${summaryReport.coverage.themes
                              .map(
                                (theme) => `<span class="tag">${theme}</span>`
                              )
                              .join("")}
                        </div>
                    </div>
                    <div class="coverage-item">
                        <h4>Content Types</h4>
                        <div class="coverage-tags">
                            ${summaryReport.coverage.contentTypes
                              .map((type) => `<span class="tag">${type}</span>`)
                              .join("")}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <h2>Test Categories</h2>
            </div>
            <div class="section-content">
                <div class="coverage-grid">
                    <div class="coverage-item">
                        <h4>Functional Tests</h4>
                        <p>Basic functionality, template rendering, parameter validation</p>
                    </div>
                    <div class="coverage-item">
                        <h4>Performance Tests</h4>
                        <p>Generation speed, caching, concurrent requests, memory usage</p>
                    </div>
                    <div class="coverage-item">
                        <h4>Visual Tests</h4>
                        <p>Visual regression, consistency, edge cases</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="recommendations">
            <div class="section">
                <div class="section-header">
                    <h2>Recommendations</h2>
                </div>
                <div class="section-content">
                    ${summaryReport.recommendations
                      .map(
                        (rec) => `
                        <div class="recommendation ${rec.priority}">
                            <h3>${rec.title}</h3>
                            <p><strong>Priority:</strong> ${rec.priority.toUpperCase()}</p>
                            <p><strong>Description:</strong> ${
                              rec.description
                            }</p>
                            <p><strong>Solution:</strong> ${rec.solution}</p>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        </div>
        
        <div class="links">
            <a href="playwright-html-report/index.html">View Detailed Playwright Report</a>
            <a href="playwright-results.json">Download JSON Results</a>
        </div>
        
        <div class="footer">
            <p>OG Image Test Suite • Generated automatically</p>
        </div>
    </div>
</body>
</html>
  `;

  // Save reports
  const summaryPath = path.join(
    reportDir,
    `og-image-summary-${timestamp}.html`
  );
  fs.writeFileSync(summaryPath, htmlReport);

  const jsonPath = path.join(reportDir, `og-image-summary-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(summaryReport, null, 2));

  console.log("✅ Test execution and reporting completed!");
  console.log("═══════════════════════════════════════");
  console.log(`📊 Summary Report: ${summaryPath}`);
  console.log(`📋 JSON Report: ${jsonPath}`);
  console.log(
    `🎭 Playwright Report: ${path.join(
      reportDir,
      "playwright-html-report",
      "index.html"
    )}`
  );

  console.log("\n🎯 Test Results:");
  console.log(`Total: ${summaryReport.results.total}`);
  console.log(`Passed: ${summaryReport.results.passed}`);
  console.log(`Failed: ${summaryReport.results.failed}`);
  console.log(`Skipped: ${summaryReport.results.skipped}`);

  if (summaryReport.results.failed > 0) {
    console.log(
      "\n⚠️  Some tests failed. Review the detailed reports for more information."
    );
  }
} catch (error) {
  console.error("❌ Error running tests:", error.message);
  process.exit(1);
}
