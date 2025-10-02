const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ccffpklqscpzqculffnd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjZmZwa2xxc2NwenFjdWxmZm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTYxMjAsImV4cCI6MjA3Mjc5MjEyMH0.Ngqvdx1pR-Y8inZVgj-uHMBi3c9ZFUlsz_Fc3kDqyN4'
);

async function debugTransactions() {
  try {
    console.log('🔍 Checking recent transactions...\n');
    
    const { data, error } = await supabase
      .from('sales')
      .select('id, customer_name, customer_phone, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(15);
    
    if (error) {
      console.log('❌ Error:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ No transactions found');
      return;
    }
    
    console.log('📋 Recent transactions:');
    console.log('='.repeat(80));
    console.log('ID       | Customer Name    | Phone        | Amount | Date');
    console.log('-'.repeat(80));
    
    data.forEach((txn, i) => {
      const id = txn.id ? txn.id.substring(0, 8) : 'N/A';
      const name = (txn.customer_name || 'N/A').padEnd(15);
      const phone = (txn.customer_phone || 'N/A').padEnd(12);
      const amount = `$${txn.total_amount || 0}`.padEnd(6);
      const date = new Date(txn.created_at).toLocaleString();
      
      console.log(`${id} | ${name} | ${phone} | ${amount} | ${date}`);
    });
    
    // Check for Rhea specifically
    console.log('\n🔍 Looking for Rhea transactions...');
    const rheaTransactions = data.filter(txn => 
      txn.customer_name && txn.customer_name.toLowerCase().includes('rhea')
    );
    
    console.log(`Found ${rheaTransactions.length} transactions for Rhea:`);
    rheaTransactions.forEach(txn => {
      console.log(`- ID: ${txn.id}, Name: "${txn.customer_name}", Phone: "${txn.customer_phone}", Amount: $${txn.total_amount}`);
    });
    
  } catch (err) {
    console.log('❌ Catch error:', err);
  }
}

debugTransactions();