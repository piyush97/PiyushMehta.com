import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const siteDir = 'dist/client';

async function hasHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (await hasHtmlFiles(fullPath)) {
        return true;
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.html')) {
      return true;
    }
  }

  return false;
}

try {
  const shouldRunPagefind = await hasHtmlFiles(siteDir);

  if (!shouldRunPagefind) {
    console.warn(`[pagefind] Skipping index generation: no HTML files found in "${siteDir}".`);
    process.exit(0);
  }

  const child = spawn('npx', ['pagefind', '--site', siteDir], { stdio: 'inherit' });
  await new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`pagefind exited with code ${code}`));
    });
    child.on('error', reject);
  });
} catch (error) {
  console.error('[pagefind] Failed to run:', error);
  process.exit(1);
}
