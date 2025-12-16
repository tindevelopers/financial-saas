#!/usr/bin/env node
/**
 * Apply SaaS base migrations to Supabase via SQL Editor
 * 
 * This script generates a single SQL file with all migrations
 * that you can paste into Supabase SQL Editor
 */

const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

// Get all SQL files sorted by name
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`📦 Found ${files.length} migration files\n`);

// Read and combine all migrations
let combinedSQL = `-- Combined migrations from @tindeveloper/tinadmin-saas-base
-- Generated: ${new Date().toISOString()}
-- 
-- ⚠️  WARNING: Review this file before applying!
-- Some migrations may conflict with your existing schema.
-- 
-- Your existing tables use TEXT IDs (cuid), but some migrations expect UUID.
-- You may need to adapt these migrations or skip conflicting ones.
-- 
-- Migration files included:
${files.map((f, i) => `-- ${i + 1}. ${f}`).join('\n')}
-- 
-- ============================================================
-- START OF MIGRATIONS
-- ============================================================

`;

files.forEach((file, index) => {
  const filePath = path.join(migrationsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  combinedSQL += `\n-- ============================================================
-- Migration ${index + 1}/${files.length}: ${file}
-- ============================================================

${content}

`;
});

// Write combined file
const outputPath = path.join(__dirname, '..', 'supabase', 'all-migrations-combined.sql');
fs.writeFileSync(outputPath, combinedSQL);

console.log('✅ Combined migrations file created:');
console.log(`   ${outputPath}\n`);
console.log('📋 Next steps:');
console.log('   1. Review the combined SQL file');
console.log('   2. Go to Supabase Dashboard → SQL Editor');
console.log('   3. Copy and paste the contents');
console.log('   4. Run the SQL\n');
console.log('⚠️  Important:');
console.log('   - The first migration creates users/tenants tables');
console.log('   - Your existing schema uses TEXT IDs, migrations use UUID');
console.log('   - You may need to adapt or skip conflicting migrations\n');

