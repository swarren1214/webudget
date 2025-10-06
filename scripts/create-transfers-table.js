// Script to create transfers table in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTransfersTable() {
  console.log('Creating transfers table...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create transfers table if it doesn't exist
      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,
        from_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        to_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL DEFAULT 'completed',
        note TEXT,
        plaid_transfer_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON transfers(from_account_id);
      CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON transfers(to_account_id);
      CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date);
    `
  });

  if (error) {
    console.error('Error creating table:', error);
    console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
    console.log(`
      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,
        from_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        to_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL DEFAULT 'completed',
        note TEXT,
        plaid_transfer_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON transfers(from_account_id);
      CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON transfers(to_account_id);
      CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date);
    `);
    process.exit(1);
  }

  console.log('✅ Transfers table created successfully!');
}

createTransfersTable();
