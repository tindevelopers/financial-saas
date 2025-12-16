/**
 * Apply Supabase migrations using Node.js and pg library
 * 
 * Usage:
 *   tsx scripts/apply-migrations.ts
 */

import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  process.exit(1)
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations')

async function applyMigrations() {
  console.log('🚀 Applying Supabase Migrations')
  console.log('==================================\n')

  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Get migration files in order
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()

    if (files.length === 0) {
      console.error('❌ Error: No migration files found')
      process.exit(1)
    }

    console.log(`📋 Found ${files.length} migration files\n`)

    let appliedCount = 0
    let skippedCount = 0
    let failedCount = 0

    // Create migrations tracking table if it doesn't exist
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS supabase_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW()
        )
      `)
    } catch (error: any) {
      // Table might already exist, ignore
      if (!error.message.includes('already exists')) {
        throw error
      }
    }

    // Apply each migration
    for (const filename of files) {
      const filePath = path.join(MIGRATIONS_DIR, filename)
      console.log(`📄 Applying: ${filename}`)

      try {
        // Check if already applied
        const checkResult = await client.query(
          'SELECT name FROM supabase_migrations WHERE name = $1',
          [filename]
        )

        if (checkResult.rows.length > 0) {
          console.log('   ⚠️  Skipped (already applied)')
          skippedCount++
          continue
        }

        // Read and apply migration
        const sql = fs.readFileSync(filePath, 'utf-8')

        // Wrap in transaction
        await client.query('BEGIN')
        try {
          await client.query(sql)
          
          // Record migration
          await client.query(
            'INSERT INTO supabase_migrations (name) VALUES ($1)',
            [filename]
          )
          
          await client.query('COMMIT')
          console.log('   ✅ Success')
          appliedCount++
        } catch (error: any) {
          await client.query('ROLLBACK')
          
          // Check if it's a "already exists" error (non-critical)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('relation') && error.message.includes('already exists')) {
            console.log('   ⚠️  Skipped (already exists)')
            skippedCount++
            
            // Still record as applied to avoid retrying
            await client.query(
              'INSERT INTO supabase_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
              [filename]
            )
          } else {
            throw error
          }
        }
      } catch (error: any) {
        console.log('   ❌ Failed')
        console.log(`   Error: ${error.message}`)
        failedCount++
        
        // Show more details for debugging
        if (error.position) {
          console.log(`   Position: ${error.position}`)
        }
        if (error.detail) {
          console.log(`   Detail: ${error.detail}`)
        }
        
        // Ask if we should continue (in non-interactive mode, continue)
        console.log('   Continuing with next migration...\n')
      }
      console.log('')
    }

    console.log('==================================')
    console.log('📊 Migration Summary:')
    console.log(`   ✅ Applied: ${appliedCount}`)
    console.log(`   ⚠️  Skipped: ${skippedCount}`)
    console.log(`   ❌ Failed:  ${failedCount}`)
    console.log('')

    if (failedCount === 0) {
      console.log('✅ All migrations completed successfully!')
      process.exit(0)
    } else {
      console.log('⚠️  Some migrations failed. Please review the errors above.')
      process.exit(1)
    }
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Run migrations
applyMigrations()

