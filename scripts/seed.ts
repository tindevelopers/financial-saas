import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// UK Accounting Categories based on HMRC and industry standards
const UK_CATEGORIES = [
  // INCOME CATEGORIES
  { name: 'Sales', type: 'income', description: 'Revenue from sales of goods or services' },
  { name: 'Other Income', type: 'income', description: 'Miscellaneous income, refunds, grants' },
  { name: 'Interest Income', type: 'income', description: 'Interest earned on savings or investments' },
  { name: 'Investment Income', type: 'income', description: 'Dividends, capital gains' },
  { name: 'Rental Income', type: 'income', description: 'Income from property rentals' },
  
  // COST OF GOODS SOLD
  { name: 'Cost of Goods Sold', type: 'expense', description: 'Direct costs of producing goods' },
  { name: 'Raw Materials', type: 'expense', description: 'Materials used in production' },
  { name: 'Direct Labour', type: 'expense', description: 'Labour costs directly tied to production' },
  { name: 'Contract Labour', type: 'expense', description: 'Contract or casual labour costs' },
  
  // OPERATING EXPENSES
  { name: 'Advertising', type: 'expense', description: 'Marketing and advertising expenses' },
  { name: 'Bank Charges', type: 'expense', description: 'Bank fees, transaction charges' },
  { name: 'Office Expenses', type: 'expense', description: 'General office supplies and equipment' },
  { name: 'Professional Fees', type: 'expense', description: 'Legal, accounting, consulting fees' },
  { name: 'Rent', type: 'expense', description: 'Office or property rent' },
  { name: 'Utilities', type: 'expense', description: 'Electricity, gas, water' },
  { name: 'Travel', type: 'expense', description: 'Business travel expenses' },
  { name: 'Meals & Entertainment', type: 'expense', description: 'Client meals, entertainment' },
  { name: 'Insurance', type: 'expense', description: 'Business insurance premiums' },
  { name: 'Depreciation', type: 'expense', description: 'Depreciation of assets' },
  { name: 'Repairs & Maintenance', type: 'expense', description: 'Repairs and maintenance costs' },
  { name: 'Telephone & Internet', type: 'expense', description: 'Phone and internet expenses' },
  { name: 'Subscriptions', type: 'expense', description: 'Software, memberships, subscriptions' },
  { name: 'Wages & Salaries', type: 'expense', description: 'Employee wages and salaries' },
  { name: 'Pension Contributions', type: 'expense', description: 'Employer pension contributions' },
  { name: 'National Insurance', type: 'expense', description: 'Employer NI contributions' },
  { name: 'Training & Development', type: 'expense', description: 'Staff training costs' },
  { name: 'Stationery & Printing', type: 'expense', description: 'Office stationery and printing' },
  { name: 'Postage & Courier', type: 'expense', description: 'Postage and delivery costs' },
  { name: 'Cleaning', type: 'expense', description: 'Cleaning services' },
  { name: 'Security', type: 'expense', description: 'Security services' },
  
  // SPECIFIC UK BUSINESS EXPENSES
  { name: 'Motor Expenses', type: 'expense', description: 'Vehicle running costs, fuel' },
  { name: 'Leasing', type: 'expense', description: 'Equipment or vehicle leasing' },
  { name: 'Licences', type: 'expense', description: 'Business licences and permits' },
  { name: 'Sundries', type: 'expense', description: 'Miscellaneous small expenses' },
  
  // TAX AND LOANS
  { name: 'VAT Payment', type: 'expense', description: 'VAT payments to HMRC' },
  { name: 'Corporation Tax', type: 'expense', description: 'Corporation tax payments' },
  { name: 'Loan Repayments', type: 'expense', description: 'Principal loan repayments' },
  { name: 'Interest Paid', type: 'expense', description: 'Interest on loans and credit' },
  
  // DRAWINGS AND TRANSFERS
  { name: 'Drawings', type: 'expense', description: 'Owner drawings (not expenses)' },
  { name: 'Transfers', type: 'expense', description: 'Transfers between accounts' },
]

async function main() {
  console.log('Starting seed...')
  
  try {
    // Check if we have any users/tenants
    const userCount = await prisma.user.count()
    
    if (userCount === 0) {
      console.log('No users found. Creating test user with default categories...')
      
      // Create test tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Company Ltd',
          domain: 'test-company.example.com',
          plan: 'free',
          region: 'us-east-1',
          status: 'active',
        },
      })
      
      console.log(`Created tenant: ${tenant.name}`)
      
      // Note: User creation is now handled by Supabase Auth
      // This seed script is kept for reference but users should be created via signup
      console.log('Note: Users are now created via Supabase Auth. Use the signup endpoint to create users.')
      
      // Create default UK categories for this tenant
      for (const categoryData of UK_CATEGORIES) {
        await prisma.category.create({
          data: {
            ...categoryData,
            tenantId: tenant.id,
            isDefault: true,
          },
        })
      }
      
      console.log(`Created ${UK_CATEGORIES.length} default UK accounting categories`)
    } else {
      console.log(`Found ${userCount} existing users. Checking for categories...`)
      
      // Get all tenants
      const tenants = await prisma.tenant.findMany()
      
      for (const tenant of tenants) {
        const categoryCount = await prisma.category.count({
          where: { tenantId: tenant.id },
        })
        
        if (categoryCount === 0) {
          console.log(`Adding default categories for tenant: ${tenant.name}`)
          
          // Create default categories for this tenant
          for (const categoryData of UK_CATEGORIES) {
            await prisma.category.create({
              data: {
                ...categoryData,
                tenantId: tenant.id,
                isDefault: true,
              },
            })
          }
          
          console.log(`Created ${UK_CATEGORIES.length} categories for ${tenant.name}`)
        } else {
          console.log(`Tenant ${tenant.name} already has ${categoryCount} categories`)
        }
      }
    }
    
    console.log('Seed completed successfully!')
  } catch (error) {
    console.error('Error during seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
