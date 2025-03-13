import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { rimraf } from 'rimraf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dirsToClean = [
  '.cache',
  '.vite',
  'build',
  'dist',
  'node_modules/.cache',
  'node_modules/.vite',
  '.turbo',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local'
];

async function clean() {
  console.log('🧹 Cleaning project...');

  for (const dir of dirsToClean) {
    const fullPath = join(process.cwd(), dir);
    try {
      await rimraf(fullPath);
      console.log(`✨ Cleaned ${dir}`);
    } catch (error) {
      // Ignore errors if directory doesn't exist
      if (error.code !== 'ENOENT') {
        console.error(`❌ Error cleaning ${dir}:`, error.message);
      }
    }
  }

  console.log('✅ Clean complete!');
}

clean().catch(error => {
  console.error('Failed to clean:', error);
  process.exit(1);
}); 