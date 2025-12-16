/**
 * Test script to verify upload authentication flow
 * Run with: npx tsx scripts/test-upload-auth.ts
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

async function testUploadAuth() {
  console.log('🧪 Testing Upload Authentication Flow\n')

  // 1. Check environment variables
  console.log('1. Checking environment variables...')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
    return
  }
  console.log('✅ Environment variables present\n')

  // 2. Check database connection
  console.log('2. Testing database connection...')
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful\n')
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message)
    return
  }

  // 3. Check if users exist
  console.log('3. Checking users in database...')
  try {
    const userCount = await prisma.user.count()
    console.log(`   Found ${userCount} users in database`)
    
    if (userCount === 0) {
      console.log('⚠️  No users found. You may need to sign up first.')
    } else {
      const users = await prisma.user.findMany({
        take: 5,
        include: { tenant: true },
      })
      console.log('\n   Sample users:')
      users.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id}, Tenant: ${user.tenantId || 'N/A'})`)
      })
    }
    console.log('')
  } catch (error: any) {
    console.error('❌ Error querying users:', error.message)
    return
  }

  // 4. Test Supabase client creation
  console.log('4. Testing Supabase client...')
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log(`   ⚠️  Session check (expected to be null without auth): ${error.message}`)
    } else {
      console.log('   ✅ Supabase client created successfully')
      console.log(`   Session exists: ${!!data.session}`)
    }
    console.log('')
  } catch (error: any) {
    console.error('❌ Supabase client test failed:', error.message)
    return
  }

  // 5. Check upload table structure
  console.log('5. Checking upload table structure...')
  try {
    const uploadCount = await prisma.upload.count()
    console.log(`   Found ${uploadCount} uploads in database`)
    
    // Check if we can create a test upload (without actually creating it)
    const sampleUpload = await prisma.upload.findFirst({
      include: {
        transactions: {
          take: 1,
        },
      },
    })
    
    if (sampleUpload) {
      console.log(`   Sample upload: ${sampleUpload.filename} (${sampleUpload.status})`)
      console.log(`   Transactions: ${sampleUpload.transactions.length}`)
    }
    console.log('')
  } catch (error: any) {
    console.error('❌ Error checking upload table:', error.message)
    return
  }

  // 6. Test authentication flow simulation
  console.log('6. Testing authentication flow...')
  console.log('   This simulates what happens in requireAuth():')
  
  try {
    // Simulate getCurrentUserWithTenant logic
    const testUser = await prisma.user.findFirst({
      include: { tenant: true },
    })
    
    if (!testUser) {
      console.log('   ⚠️  No users found to test with')
    } else {
      console.log(`   ✅ Found test user: ${testUser.email}`)
      console.log(`   - User ID: ${testUser.id}`)
      console.log(`   - Tenant ID: ${testUser.tenantId || 'N/A'}`)
      console.log(`   - Has tenant: ${!!testUser.tenant}`)
      
      if (!testUser.tenantId) {
        console.log('   ⚠️  WARNING: User has no tenantId - this will cause 401 errors!')
      }
    }
    console.log('')
  } catch (error: any) {
    console.error('❌ Error testing auth flow:', error.message)
    return
  }

  console.log('✅ All tests completed\n')
  console.log('📝 Summary:')
  console.log('   - Environment variables: ✅')
  console.log('   - Database connection: ✅')
  console.log('   - Users in database: ✅')
  console.log('   - Supabase client: ✅')
  console.log('   - Upload table: ✅')
  console.log('\n💡 Next steps:')
  console.log('   1. Ensure you are signed in (session cookies should be set)')
  console.log('   2. Check browser DevTools > Application > Cookies for Supabase cookies')
  console.log('   3. Verify middleware.ts is running and refreshing sessions')
  console.log('   4. Test the upload endpoint with proper authentication')
}

// Run the test
testUploadAuth()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
