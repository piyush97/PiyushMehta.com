import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Construct the full build command
const buildCommand = `astro build`;

try {
  console.log('Starting Astro build...');
  execSync(buildCommand, { stdio: 'inherit' });
  console.log('Astro build completed successfully.');
} catch (error) {
  console.error('Astro build failed:', error.message);
  process.exit(1);
}
