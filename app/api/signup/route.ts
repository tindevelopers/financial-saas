import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      )
    }

    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL environment variable')
      return NextResponse.json(
        { error: 'Server configuration error: Missing database connection' },
        { status: 500 }
      )
    }

    // Check if using direct connection instead of pooler (common mistake)
    const dbUrl = process.env.DATABASE_URL
    if (dbUrl.includes(':5432') && !dbUrl.includes('pooler') && !dbUrl.includes('pgbouncer')) {
      console.error('DATABASE_URL appears to be using direct connection instead of connection pooler')
      console.error('For Vercel/serverless, use Supabase Connection Pooling URL (port 6543)')
      return NextResponse.json(
        { 
          error: 'Database configuration error: Please use Supabase Connection Pooling URL for serverless environments. See SUPABASE_CONNECTION_SETUP.md for details.',
          hint: 'Use the connection string from Supabase Dashboard → Settings → Database → Connection Pooling (port 6543)'
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const supabase = await createServerSupabaseClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    })

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user in authentication system' },
        { status: 400 }
      )
    }

    try {
      // Create tenant for this user (1 user = 1 tenant)
      const domain = email.split('@')[1] || 'example.com'
      const tenant = await prisma.tenant.create({
        data: {
          name: name || email.split('@')[0] + "'s Company",
          domain: `${email.split('@')[0]}.${domain}`,
          status: 'active',
          plan: 'free',
          region: 'us-east-1',
        },
      })

      // Get default role (Viewer or assign based on first user)
      const defaultRole = await prisma.role.findFirst({
        where: { name: 'Viewer' },
      })

      // Create user profile in public schema
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          fullName: name || email.split('@')[0],
          tenantId: tenant.id,
          roleId: defaultRole?.id,
          plan: 'free',
          status: 'active',
        },
      })

      // Create default UK accounting categories for this tenant
      const categories = [
        { name: 'Sales', type: 'income', description: 'Revenue from sales' },
        { name: 'Other Income', type: 'income', description: 'Miscellaneous income' },
        { name: 'Interest Income', type: 'income', description: 'Interest earned' },
        { name: 'Cost of Goods Sold', type: 'expense', description: 'Direct costs' },
        { name: 'Advertising', type: 'expense', description: 'Marketing expenses' },
        { name: 'Bank Charges', type: 'expense', description: 'Bank fees' },
        { name: 'Office Expenses', type: 'expense', description: 'Office supplies' },
        { name: 'Professional Fees', type: 'expense', description: 'Legal, accounting fees' },
        { name: 'Rent', type: 'expense', description: 'Property rent' },
        { name: 'Utilities', type: 'expense', description: 'Electricity, gas, water' },
        { name: 'Travel', type: 'expense', description: 'Business travel' },
        { name: 'Meals & Entertainment', type: 'expense', description: 'Client meals' },
        { name: 'Insurance', type: 'expense', description: 'Business insurance' },
        { name: 'Repairs & Maintenance', type: 'expense', description: 'Repairs' },
        { name: 'Telephone & Internet', type: 'expense', description: 'Communications' },
        { name: 'Subscriptions', type: 'expense', description: 'Software subscriptions' },
        { name: 'Drawings', type: 'expense', description: 'Owner drawings' },
      ]

      for (const cat of categories) {
        await prisma.category.create({
          data: {
            ...cat,
            tenantId: tenant.id,
            isDefault: true,
          },
        })
      }

      return NextResponse.json(
        {
          message: 'User created successfully',
          user: { id: user.id, email: user.email, fullName: user.fullName },
        },
        { status: 201 }
      )
    } catch (dbError: any) {
      console.error('Database error during signup:', dbError)
      // If user was created in Supabase but database operations failed,
      // we should still return an error but note that auth was successful
      if (authData?.user) {
        console.error('User created in Supabase but database operations failed. User ID:', authData.user.id)
      }
      throw dbError // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('Signup error:', error)
    console.error('Error stack:', error?.stack)
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to create user'
    if (error?.message) {
      errorMessage = error.message
    }
    
    // Check for specific error types
    if (error?.code === 'P2002') {
      errorMessage = 'Email already exists'
    } else if (error?.code?.startsWith('P')) {
      errorMessage = 'Database error: ' + error.message
    } else if (error?.message?.includes('Missing Supabase')) {
      errorMessage = 'Server configuration error: Missing Supabase credentials'
    } else if (error?.message?.includes('DATABASE_URL')) {
      errorMessage = 'Server configuration error: Missing database connection'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error?.message,
          stack: error?.stack 
        })
      },
      { status: 500 }
    )
  }
}
