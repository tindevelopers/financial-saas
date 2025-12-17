/**
 * Create a system admin user with full access to all SaaS base menus
 * 
 * Usage: npx tsx scripts/create-system-admin.ts
 * 
 * This script:
 * 1. Creates a user in Supabase Auth
 * 2. Creates user profile in database
 * 3. Assigns Platform Admin role (or creates System Admin role)
 * 4. Gives access to all tenants
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

const SYSTEM_ADMIN_EMAIL = 'systemadmin@tin.info'
const SYSTEM_ADMIN_PASSWORD = '88888888'
const SYSTEM_ADMIN_NAME = 'System Administrator'

async function createSystemAdmin() {
  console.log('🔧 Creating System Admin User...\n')

  try {
    // 1. Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase environment variables:\n' +
        '  - NEXT_PUBLIC_SUPABASE_URL\n' +
        '  - SUPABASE_SERVICE_ROLE_KEY (required for admin operations)'
      )
    }

    // 2. Create Supabase admin client (uses service role key for admin operations)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('✅ Supabase admin client created')

    // 3. Check if user already exists in Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === SYSTEM_ADMIN_EMAIL)

    let authUserId: string

    if (existingUser) {
      console.log(`⚠️  User already exists in Supabase Auth: ${SYSTEM_ADMIN_EMAIL}`)
      authUserId = existingUser.id
      
      // Update password if needed
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: SYSTEM_ADMIN_PASSWORD,
        email_confirm: true, // Ensure email is confirmed
      })
      console.log('✅ Password updated and email confirmed')
    } else {
      // Create new user in Supabase Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: SYSTEM_ADMIN_EMAIL,
        password: SYSTEM_ADMIN_PASSWORD,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: SYSTEM_ADMIN_NAME,
        },
      })

      if (createError) {
        throw new Error(`Failed to create user in Supabase Auth: ${createError.message}`)
      }

      authUserId = newUser.user.id
      console.log(`✅ User created in Supabase Auth: ${authUserId}`)
    }

    // 4. Get or create System Admin role
    let systemAdminRole = await prisma.role.findUnique({
      where: { name: 'System Admin' },
    })

    if (!systemAdminRole) {
      // Check if Platform Admin exists (use that as fallback)
      systemAdminRole = await prisma.role.findUnique({
        where: { name: 'Platform Admin' },
      })

      if (!systemAdminRole) {
        // Create System Admin role with all permissions
        systemAdminRole = await prisma.role.create({
          data: {
            name: 'System Admin',
            description: 'Full system control with access to all SaaS base menus and features',
            coverage: 'Global',
            maxSeats: 0, // Unlimited
            currentSeats: 0,
            permissions: [
              'All permissions',
              'Billing',
              'API keys',
              'Audit logs',
              'User management',
              'Tenant management',
              'Workspace management',
              'Role management',
              'System settings',
              'Database access',
              'Feature flags',
              'Webhooks',
              'Usage reports',
              'View dashboards',
              'View reports',
              'Workspace settings',
              'Branding',
              'Data residency',
              'Automations',
            ],
            gradient: 'from-red-500 to-pink-600',
          },
        })
        console.log('✅ Created System Admin role')
      } else {
        console.log('✅ Using existing Platform Admin role')
      }
    } else {
      console.log('✅ Found existing System Admin role')
    }

    // 5. Check if user profile exists
    let userProfile = await prisma.user.findUnique({
      where: { id: authUserId },
    })

    if (userProfile) {
      console.log(`⚠️  User profile already exists: ${userProfile.email}`)
      
      // Update user profile to ensure correct role and status
      userProfile = await prisma.user.update({
        where: { id: authUserId },
        data: {
          email: SYSTEM_ADMIN_EMAIL,
          fullName: SYSTEM_ADMIN_NAME,
          roleId: systemAdminRole.id,
          plan: 'enterprise', // Highest plan
          status: 'active',
        },
      })
      console.log('✅ User profile updated')
    } else {
      // Create user profile
      // Note: System admin might not have a tenant (global access)
      // But we'll create a system tenant for them if needed
      let systemTenant = await prisma.tenant.findUnique({
        where: { domain: 'system.tin.info' },
      })

      if (!systemTenant) {
        systemTenant = await prisma.tenant.create({
          data: {
            name: 'System Tenant',
            domain: 'system.tin.info',
            status: 'active',
            plan: 'enterprise',
            region: 'global',
            features: ['all'],
          },
        })
        console.log('✅ Created system tenant')
      }

      userProfile = await prisma.user.create({
        data: {
          id: authUserId,
          email: SYSTEM_ADMIN_EMAIL,
          fullName: SYSTEM_ADMIN_NAME,
          roleId: systemAdminRole.id,
          tenantId: systemTenant.id, // Assign to system tenant
          plan: 'enterprise',
          status: 'active',
        },
      })
      console.log('✅ User profile created')
    }

    // 6. Grant access to all existing tenants via UserTenantRole
    const allTenants = await prisma.tenant.findMany()
    console.log(`\n📋 Granting access to ${allTenants.length} tenants...`)

    for (const tenant of allTenants) {
      const existingAccess = await prisma.userTenantRole.findUnique({
        where: {
          userId_tenantId_roleId: {
            userId: authUserId,
            tenantId: tenant.id,
            roleId: systemAdminRole.id,
          },
        },
      })

      if (!existingAccess) {
        await prisma.userTenantRole.create({
          data: {
            userId: authUserId,
            tenantId: tenant.id,
            roleId: systemAdminRole.id,
          },
        })
        console.log(`  ✅ Access granted to tenant: ${tenant.name}`)
      } else {
        console.log(`  ⏭️  Already has access to: ${tenant.name}`)
      }
    }

    // 7. Grant access to all workspaces
    const allWorkspaces = await prisma.workspace.findMany()
    console.log(`\n📋 Granting access to ${allWorkspaces.length} workspaces...`)

    for (const workspace of allWorkspaces) {
      const existingWorkspaceAccess = await prisma.workspaceUser.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: authUserId,
          },
        },
      })

      if (!existingWorkspaceAccess) {
        await prisma.workspaceUser.create({
          data: {
            workspaceId: workspace.id,
            userId: authUserId,
            roleId: systemAdminRole.id,
            permissions: ['all'], // All permissions
          },
        })
        console.log(`  ✅ Access granted to workspace: ${workspace.name}`)
      } else {
        console.log(`  ⏭️  Already has access to: ${workspace.name}`)
      }
    }

    console.log('\n✅ System Admin User Created Successfully!\n')
    console.log('📝 Summary:')
    console.log(`   Email: ${SYSTEM_ADMIN_EMAIL}`)
    console.log(`   Password: ${SYSTEM_ADMIN_PASSWORD}`)
    console.log(`   Name: ${SYSTEM_ADMIN_NAME}`)
    console.log(`   Role: ${systemAdminRole.name}`)
    console.log(`   User ID: ${authUserId}`)
    console.log(`   Tenant Access: ${allTenants.length} tenants`)
    console.log(`   Workspace Access: ${allWorkspaces.length} workspaces`)
    console.log('\n🔐 You can now sign in with these credentials')

  } catch (error: any) {
    console.error('\n❌ Error creating system admin:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createSystemAdmin()
