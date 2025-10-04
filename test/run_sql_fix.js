// Quick script to run the SQL fix
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlFix() {
  try {
    console.log('🔧 Running transaction status fix...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('database/FIX_TRANSACTION_STATUS.sql', 'utf8');
    
    // Extract the function definition (skip the SELECT message at the end)
    const functionDefinition = sqlContent.split('-- Success message')[0].trim();
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec', { sql: functionDefinition });
    
    if (error) {
      console.error('❌ SQL execution failed:', error);
      return;
    }
    
    console.log('✅ SQL fix executed successfully!');
    console.log('🎯 Your transactions should now complete immediately');
    
  } catch (error) {
    console.error('❌ Error running SQL fix:', error.message);
  }
}

runSqlFix();