#!/usr/bin/env tsx
/**
 * Script to apply @tindeveloper/tinadmin-saas-base migrations to Supabase
 * 
 * Usage:
 *   tsx scripts/apply-saas-base-migrations.ts
 * 
 * This will apply all migrations from supabase/migrations/ to your Supabase database
 */

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigrations() {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
  
  try {
    const files = await readdir(migrationsDir)
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort() // Apply in chronological order
    
    console.log(`📦 Found ${sqlFiles.length} migration files`)
    console.log('')
    
    for (const file of sqlFiles) {
      console.log(`🔄 Applying: ${file}`)
      
      const sql = await readFile(join(migrationsDir, file), 'utf-8')
      
      // Execute SQL via Supabase REST API (using rpc)
      // Note: We'll use the SQL editor API instead
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        // If exec_sql doesn't exist, try direct SQL execution
        // For Supabase, we need to use the management API or SQL editor
        console.log(`   ⚠️  Note: Direct SQL execution via API may not work`)
        console.log(`   📝 Please apply this migration manually in Supabase SQL Editor:`)
        console.log(`      File: ${file}`)
        console.log('')
        continue
      }
      
      console.log(`   ✅ Applied successfully`)
    }
    
    console.log('')
    console.log('✅ Migration application complete!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log('   2. Copy and paste each migration file in order')
    console.log('   3. Run each migration')
    console.log('')
    console.log('   Or use Supabase CLI:')
    console.log('   supabase db push')
    
  } catch (error) {
    console.error('❌ Error applying migrations:', error)
    process.exit(1)
  }
}

applyMigrations()

