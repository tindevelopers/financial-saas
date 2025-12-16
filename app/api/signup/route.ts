import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

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
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create user', details: error?.message },
      { status: 500 }
    )
  }
}
