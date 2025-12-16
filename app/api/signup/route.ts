import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Create tenant for this user (1 user = 1 tenant)
    const tenant = await prisma.tenant.create({
      data: {
        name: name || email.split('@')[0] + "'s Company",
      },
    })

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        tenantId: tenant.id,
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
        user: { id: user.id, email: user.email, name: user.name },
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
