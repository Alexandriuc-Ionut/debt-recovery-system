/**
 * Seed Railway database with demo data.
 *
 * Usage:
 *   1. Get DATABASE_URL from Railway dashboard → your Postgres service → Variables
 *   2. Run: DATABASE_URL="postgresql://..." node scripts/seed-railway.js
 *
 * Or on Windows PowerShell:
 *   $env:DATABASE_URL="postgresql://..."; node scripts/seed-railway.js
 */

const { execSync } = require('child_process');
const path = require('path');

if (!process.env.DATABASE_URL) {
  console.error('\n❌  DATABASE_URL is not set.\n');
  console.error('  Get it from Railway → your Postgres service → Variables tab.\n');
  console.error('  Then run:');
  console.error('    Windows PowerShell:');
  console.error('      $env:DATABASE_URL="postgresql://..."; node scripts/seed-railway.js\n');
  console.error('    Mac/Linux:');
  console.error('      DATABASE_URL="postgresql://..." node scripts/seed-railway.js\n');
  process.exit(1);
}

console.log('🚀 Seeding Railway database...');
console.log('   Host:', new URL(process.env.DATABASE_URL).hostname);

try {
  execSync('npx tsx prisma/seed.ts', {
    cwd: path.join(__dirname, '../backend'),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
} catch (e) {
  console.error('\n❌ Seed failed. Make sure you are in the project root and dependencies are installed.');
  process.exit(1);
}
