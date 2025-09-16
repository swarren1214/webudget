// Quick database check for implementation planning
const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log('Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Check if institutions table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'institutions'
      );
    `);
    console.log('\n🔍 Institutions table exists:', tableCheck.rows[0].exists);
    
    // Check plaid_items table structure and data
    const result = await pool.query(`
      SELECT 
        plaid_institution_id, 
        institution_name, 
        COUNT(*) as count 
      FROM plaid_items 
      GROUP BY plaid_institution_id, institution_name 
      ORDER BY count DESC
      LIMIT 10
    `);
    
    console.log('\n📊 Current plaid_items institution data:');
    console.log('Total unique institutions:', result.rows.length);
    result.rows.forEach(row => {
      console.log(`  ${row.plaid_institution_id}: ${row.institution_name} (${row.count} items)`);
    });
    
    // Check total count
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM plaid_items');
    console.log(`\nTotal plaid_items: ${totalResult.rows[0].total}`);
    
    // Check for null or duplicate plaid_institution_id values
    const nullCheck = await pool.query('SELECT COUNT(*) as null_count FROM plaid_items WHERE plaid_institution_id IS NULL');
    console.log(`\n🔎 Null plaid_institution_id values: ${nullCheck.rows[0].null_count}`);
    
    const duplicateCheck = await pool.query(`
      SELECT plaid_institution_id, COUNT(*) as dup_count 
      FROM plaid_items 
      GROUP BY plaid_institution_id 
      HAVING COUNT(*) > 1 
      ORDER BY dup_count DESC
      LIMIT 5
    `);
    console.log(`\n🔎 Duplicate plaid_institution_id values: ${duplicateCheck.rows.length}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase().catch(console.error);
