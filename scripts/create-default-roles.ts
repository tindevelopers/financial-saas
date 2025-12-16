/**
 * Create default roles in the database
 * 
 * Usage:
 *   tsx scripts/create-default-roles.ts
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  process.exit(1)
}

async function createDefaultRoles() {
  console.log('🔐 Creating Default Roles')
  console.log('==========================\n')

  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    const sql = `
      INSERT INTO roles (id, name, description, coverage, max_seats, current_seats, permissions, gradient, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'Owner', 'Full access to all features', 'Per tenant', 0, 0, ARRAY[]::text[], 'from-blue-500 to-purple-600', NOW(), NOW()),
        (gen_random_uuid(), 'Admin', 'Administrative access', 'Per tenant', 0, 0, ARRAY[]::text[], 'from-green-500 to-teal-600', NOW(), NOW()),
        (gen_random_uuid(), 'Member', 'Standard user access', 'Per tenant', 0, 0, ARRAY[]::text[], 'from-gray-500 to-gray-600', NOW(), NOW()),
        (gen_random_uuid(), 'Viewer', 'Read-only access', 'Per tenant', 0, 0, ARRAY[]::text[], 'from-orange-500 to-red-600', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name, description;
    `

    const result = await client.query(sql)

    if (result.rows.length > 0) {
      console.log('✅ Created roles:')
      result.rows.forEach(row => {
        console.log(`   - ${row.name}: ${row.description}`)
      })
    } else {
      console.log('⚠️  All roles already exist')
    }

    // Verify roles exist
    const verifyResult = await client.query('SELECT id, name, description FROM roles ORDER BY name')
    console.log('\n📋 Current roles in database:')
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.name}: ${row.description}`)
    })

    console.log('\n✅ Default roles setup complete!')
  } catch (error: any) {
    console.error('❌ Error creating roles:', error.message)
    if (error.detail) {
      console.error('   Detail:', error.detail)
    }
    process.exit(1)
  } finally {
    await client.end()
  }
}

createDefaultRoles()

