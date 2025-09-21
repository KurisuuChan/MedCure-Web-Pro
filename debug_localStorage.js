// Check localStorage for transaction data
console.log('🔍 Checking localStorage for transactions...\n');

// Check various localStorage keys that might contain transaction data
const keysToCheck = [
  'medcure_sales',
  'medcure_transactions', 
  'transactions',
  'sales',
  'pos_transactions'
];

keysToCheck.forEach(key => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`✅ Found data in localStorage['${key}']:`, Array.isArray(parsed) ? `${parsed.length} items` : 'Object');
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('Sample transaction:', parsed[0]);
        
        // Look for Rhea specifically
        const rheaTransactions = parsed.filter(txn => 
          txn.customer_name && txn.customer_name.toLowerCase().includes('rhea')
        );
        console.log(`Found ${rheaTransactions.length} Rhea transactions in ${key}`);
      }
    } else {
      console.log(`❌ No data in localStorage['${key}']`);
    }
  } catch (e) {
    console.log(`❌ Error parsing localStorage['${key}']:`, e.message);
  }
});

// Check all localStorage keys for anything that might be transaction-related
console.log('\n🔍 All localStorage keys:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`- ${key}`);
}