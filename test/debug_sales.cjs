const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ccffpklqscpzqculffnd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjZmZwa2xxc2NwenFjdWxmZm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTYxMjAsImV4cCI6MjA3Mjc5MjEyMH0.Ngqvdx1pR-Y8inZVgj-uHMBi3c9ZFUlsz_Fc3kDqyN4'
);

async function checkSalesTable() {
  try {
    console.log('🔍 Testing sales table access...\n');
    
    // First try to get a count
    const { count, error: countError } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true });
    
    console.log('Table count:', count);
    if (countError) {
      console.log('Count Error:', countError);
    }
    
    // Try to get actual data
    const { data, error } = await supabase
      .from('sales')
      .select('id, customer_name, customer_phone, total_amount, created_at, status')
      .limit(5);
    
    if (error) {
      console.log('❌ Error accessing sales table:', error);
      
      // Check if it's an authentication issue
      if (error.message.includes('RLS') || error.message.includes('policy')) {
        console.log('🔐 This might be a Row Level Security (RLS) issue.');
        console.log('💡 The app needs to be authenticated to access transaction data.');
      }
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('📋 Sales table exists but contains no data.');
      console.log('💡 This explains why no transactions are showing up.');
      return;
    }
    
    console.log(`✅ Found ${data.length} transactions:`);
    data.forEach((txn, i) => {
      console.log(`${i+1}. ${txn.customer_name} | ${txn.customer_phone} | $${txn.total_amount} | ${txn.status}`);
    });
    
  } catch (err) {
    console.log('❌ Catch error:', err);
  }
}

checkSalesTable();