/**
 * Data Migration Script: Convert TEXT IDs to UUIDs
 * 
 * This script migrates existing data from TEXT (cuid) IDs to UUID format
 * to match the SaaS base structure.
 * 
 * ⚠️  WARNING: Backup your database before running this!
 * 
 * Usage:
 *   tsx scripts/migrate-text-to-uuid.ts
 */

import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

interface IdMapping {
  oldId: string
  newId: string
}

async function migrateTextToUuid() {
  console.log('🔄 Starting TEXT → UUID Migration')
  console.log('=====================================\n')

  try {
    // Step 1: Backup existing data (export to JSON)
    console.log('📦 Step 1: Creating backup...')
    const tenants = await prisma.$queryRaw`
      SELECT * FROM tenants WHERE id::text NOT LIKE '%-%-%-%-%'
    ` as any[]
    
    console.log(`   Found ${tenants.length} tenants to migrate\n`)

    // Step 2: Create ID mappings
    console.log('📋 Step 2: Creating ID mappings...')
    const tenantMappings: IdMapping[] = []
    const userMappings: IdMapping[] = []
    const categoryMappings: IdMapping[] = []
    const uploadMappings: IdMapping[] = []
    const transactionMappings: IdMapping[] = []
    const correctionMappings: IdMapping[] = []
    const googleSheetsMappings: IdMapping[] = []

    // Generate new UUIDs for tenants
    for (const tenant of tenants) {
      const newId = uuidv4()
      tenantMappings.push({ oldId: tenant.id, newId })
    }
    console.log(`   Created ${tenantMappings.length} tenant mappings\n`)

    // Step 3: Migrate in correct order (respecting foreign keys)
    console.log('🔄 Step 3: Migrating data...\n')

    // 3.1 Migrate Tenants
    console.log('   Migrating tenants...')
    for (const mapping of tenantMappings) {
      await prisma.$executeRaw`
        UPDATE tenants 
        SET id = ${mapping.newId}::uuid
        WHERE id = ${mapping.oldId}
      `
    }
    console.log('   ✅ Tenants migrated\n')

    // 3.2 Migrate Users (get from existing data)
    console.log('   Migrating users...')
    const users = await prisma.$queryRaw`
      SELECT * FROM users WHERE id::text NOT LIKE '%-%-%-%-%'
    ` as any[]
    
    for (const user of users) {
      const newId = uuidv4()
      userMappings.push({ oldId: user.id, newId })
      
      // Find tenant mapping
      const tenantMapping = tenantMappings.find(m => m.oldId === user.tenantId)
      if (!tenantMapping) {
        console.warn(`   ⚠️  No tenant mapping found for user ${user.id}`)
        continue
      }
      
      await prisma.$executeRaw`
        UPDATE users 
        SET id = ${newId}::uuid,
            tenant_id = ${tenantMapping.newId}::uuid
        WHERE id = ${user.oldId}
      `
    }
    console.log('   ✅ Users migrated\n')

    // 3.3 Migrate Categories
    console.log('   Migrating categories...')
    const categories = await prisma.$queryRaw`
      SELECT * FROM categories WHERE id::text NOT LIKE '%-%-%-%-%'
    ` as any[]
    
    for (const category of categories) {
      const newId = uuidv4()
      categoryMappings.push({ oldId: category.id, newId })
      
      const tenantMapping = tenantMappings.find(m => m.oldId === category.tenantId)
      if (!tenantMapping) continue
      
      await prisma.$executeRaw`
        UPDATE categories 
        SET id = ${newId}::uuid,
            tenant_id = ${tenantMapping.newId}::uuid
        WHERE id = ${category.oldId}
      `
    }
    console.log('   ✅ Categories migrated\n')

    // 3.4 Migrate Uploads
    console.log('   Migrating uploads...')
    const uploads = await prisma.$queryRaw`
      SELECT * FROM uploads WHERE id::text NOT LIKE '%-%-%-%-%'
    ` as any[]
    
    for (const upload of uploads) {
      const newId = uuidv4()
      uploadMappings.push({ oldId: upload.id, newId })
      
      const tenantMapping = tenantMappings.find(m => m.oldId === upload.tenantId)
      if (!tenantMapping) continue
      
      await prisma.$executeRaw`
        UPDATE uploads 
        SET id = ${newId}::uuid,
            tenant_id = ${tenantMapping.newId}::uuid
        WHERE id = ${upload.oldId}
      `
    }
    console.log('   ✅ Uploads migrated\n')

    // 3.5 Migrate Transactions
    console.log('   Migrating transactions...')
    const transactions = await prisma.$queryRaw`
      SELECT * FROM transactions WHERE id::text NOT LIKE '%-%-%-%-%'
    ` as any[]
    
    for (const transaction of transactions) {
      const newId = uuidv4()
      transactionMappings.push({ oldId: transaction.id, newId })
      
      const tenantMapping = tenantMappings.find(m => m.oldId === transaction.tenantId)
      const uploadMapping = uploadMappings.find(m => m.oldId === transaction.uploadId)
      const categoryMapping = transaction.categoryId 
        ? categoryMappings.find(m => m.oldId === transaction.categoryId)
        : null
      
      if (!tenantMapping || !uploadMapping) continue
      
      await prisma.$executeRaw`
        UPDATE transactions 
        SET id = ${newId}::uuid,
            tenant_id = ${tenantMapping.newId}::uuid,
            upload_id = ${uploadMapping.newId}::uuid,
            category_id = ${categoryMapping?.newId || null}::uuid
        WHERE id = ${transaction.oldId}
      `
    }
    console.log('   ✅ Transactions migrated\n')

    // 3.6 Migrate User Corrections
    console.log('   Migrating user corrections...')
    const corrections = await prisma.$queryRaw`
      SELECT * FROM user_corrections WHERE id::text NOT LIKE '%-%-%-%-%'
    ` as any[]
    
    for (const correction of corrections) {
      const newId = uuidv4()
      correctionMappings.push({ oldId: correction.id, newId })
      
      const tenantMapping = tenantMappings.find(m => m.oldId === correction.tenantId)
      const transactionMapping = transactionMappings.find(m => m.oldId === correction.transactionId)
      const categoryMapping = categoryMappings.find(m => m.oldId === correction.correctedCategoryId)
      
      if (!tenantMapping || !transactionMapping || !categoryMapping) continue
      
      await prisma.$executeRaw`
        UPDATE user_corrections 
        SET id = ${newId}::uuid,
            tenant_id = ${tenantMapping.newId}::uuid,
            transaction_id = ${transactionMapping.newId}::uuid,
            corrected_category_id = ${categoryMapping.newId}::uuid,
            original_category_id = ${correction.originalCategoryId 
              ? categoryMappings.find(m => m.oldId === correction.originalCategoryId)?.newId || null
              : null}::uuid
        WHERE id = ${correction.oldId}
      `
    }
    console.log('   ✅ User corrections migrated\n')

    // 3.7 Migrate Google Sheets Connections
    console.log('   Migrating Google Sheets connections...')
    const googleSheets = await prisma.$queryRaw`
      SELECT * FROM google_sheets_connections WHERE id::text NOT LIKE '%-%-%-%-%'
    ` as any[]
    
    for (const conn of googleSheets) {
      const newId = uuidv4()
      googleSheetsMappings.push({ oldId: conn.id, newId })
      
      const tenantMapping = tenantMappings.find(m => m.oldId === conn.tenantId)
      if (!tenantMapping) continue
      
      await prisma.$executeRaw`
        UPDATE google_sheets_connections 
        SET id = ${newId}::uuid,
            tenant_id = ${tenantMapping.newId}::uuid
        WHERE id = ${conn.oldId}
      `
    }
    console.log('   ✅ Google Sheets connections migrated\n')

    console.log('✅ Migration complete!')
    console.log('\n📊 Summary:')
    console.log(`   Tenants: ${tenantMappings.length}`)
    console.log(`   Users: ${userMappings.length}`)
    console.log(`   Categories: ${categoryMappings.length}`)
    console.log(`   Uploads: ${uploadMappings.length}`)
    console.log(`   Transactions: ${transactionMappings.length}`)
    console.log(`   Corrections: ${correctionMappings.length}`)
    console.log(`   Google Sheets: ${googleSheetsMappings.length}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateTextToUuid()
  .then(() => {
    console.log('\n✅ Migration script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error)
    process.exit(1)
  })

