import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    
    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('📊 Tables in database:')
    tablesResult.rows.forEach(r => console.log(`  - ${r.table_name}`))
    console.log('')
    
    // Check ID column types
    const idTypesResult = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND column_name IN ('id', 'user_id', 'tenant_id')
      ORDER BY table_name, column_name
    `)
    
    console.log('🔑 ID column types:')
    idTypesResult.rows.forEach(r => 
      console.log(`  ${r.table_name}.${r.column_name}: ${r.data_type}`)
    )
    
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await client.end()
  }
}

checkSchema()

