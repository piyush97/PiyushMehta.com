import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    ignorePatterns: [
      '.astro/**',
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
