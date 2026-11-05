import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    ignorePatterns: [
      // Preserve Markdown formatting scope without hiding new docs from Git.
      '**/*.md',
      '!**/SPEC.md',
      '!src/content/chat/facts.md',
      '!docs/growth/2026-09-content-and-career-plan.md',
      '!docs/architecture/*.md',
      '!docs/adr/*.md',
      '!docs/plans/*.md',
      '.astro/**',
      '.github/skills/impeccable/scripts/**',
      '.omo/**',
      'dist/**',
      'node_modules/**',
      'public/**',
      'playwright-report/**',
      'test-build/**',
      'test-results/**',
      'tests/**',
    ],
    semi: true,
    singleQuote: true,
  },
  lint: {
    ignorePatterns: [
      '.astro/**',
      '.github/skills/impeccable/scripts/**',
      '.omo/**',
      'dist/**',
      'node_modules/**',
      'public/**',
      'playwright-report/**',
      'test-build/**',
      'test-results/**',
      // Playwright and node:test have their own runners and type semantics.
      'tests/**',
    ],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: {
      'typescript/triple-slash-reference': 'off',
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    options: { typeAware: true, typeCheck: true },
  },
});
