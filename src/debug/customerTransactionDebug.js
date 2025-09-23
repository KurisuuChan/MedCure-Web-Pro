/**
 * Debug Customer and Transaction Data Mismatch
 * 
 * This script will:
 * 1. Check localStorage for any cached data
 * 2. Directly query the database for customer and transaction data
 * 3. Test the matching logic used by the CustomerService
 * 4. Identify why statistics show 0 but transaction history shows data
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const debugCustomerTransactionMismatch = async () => {
  console.log('🔍 DEBUG: Customer Transaction Mismatch Analysis');
  console.log('=====================================');

  // 1. Check localStorage for cached data
  console.log('\n📦 LOCALSTORAGE ANALYSIS:');
  const storedCustomers = localStorage.getItem('medcure_customers');
  const storedTransactions = localStorage.getItem('medcure_transactions');
  
  console.log('Stored customers:', storedCustomers ? JSON.parse(storedCustomers).length + ' customers' : 'None');
  console.log('Stored transactions:', storedTransactions ? JSON.parse(storedTransactions).length + ' transactions' : 'None');
  
  // Show all localStorage keys related to MedCure
  console.log('\n🔑 All MedCure localStorage keys:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.toLowerCase().includes('medcure')) {
      const value = localStorage.getItem(key);
      console.log(`- ${key}: ${value ? value.length + ' chars' : 'null'}`);
    }
  }

  // 2. Query database directly
  console.log('\n🗄️ DATABASE ANALYSIS:');
  
  // Get customers from database
  const { data: dbCustomers, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
    
  if (customerError) {
    console.error('❌ Error fetching customers:', customerError);
  } else {
    console.log(`✅ Database customers: ${dbCustomers?.length || 0}`);
    if (dbCustomers && dbCustomers.length > 0) {
      console.log('Sample customer:', {
        id: dbCustomers[0].id,
        name: dbCustomers[0].customer_name,
        phone: dbCustomers[0].phone,
        created_at: dbCustomers[0].created_at
      });
    }
  }

  // Get transactions from database
  const { data: dbTransactions, error: transactionError } = await supabase
    .from('sales')
    .select('*')
    .not('status', 'eq', 'cancelled')
    .not('customer_name', 'eq', '[DELETED CUSTOMER]')
    .not('customer_name', 'is', null)
    .order('created_at', { ascending: false });
    
  if (transactionError) {
    console.error('❌ Error fetching transactions:', transactionError);
  } else {
    console.log(`✅ Database transactions: ${dbTransactions?.length || 0}`);
    if (dbTransactions && dbTransactions.length > 0) {
      console.log('Sample transaction:', {
        id: dbTransactions[0].id,
        customer_id: dbTransactions[0].customer_id,
        customer_name: dbTransactions[0].customer_name,
        customer_phone: dbTransactions[0].customer_phone,
        total_amount: dbTransactions[0].total_amount,
        created_at: dbTransactions[0].created_at
      });
    }
  }

  // 3. Test matching logic for Charles specifically
  console.log('\n🎯 CHARLES MATCHING ANALYSIS:');
  if (dbCustomers && dbTransactions) {
    const charlesCustomer = dbCustomers.find(c => 
      c.customer_name && c.customer_name.toLowerCase().includes('charles')
    );
    
    if (charlesCustomer) {
      console.log('Found Charles customer:', {
        id: charlesCustomer.id,
        name: charlesCustomer.customer_name,
        phone: charlesCustomer.phone
      });
      
      // Test matching strategies
      const matchingTransactions = dbTransactions.filter(txn => {
        if (!txn) return false;
        
        // Skip deleted customer transactions
        if (txn.customer_name === '[DELETED CUSTOMER]' || !txn.customer_name) {
          return false;
        }
        
        // Strategy 1: Customer ID match
        if (txn.customer_id && charlesCustomer.id && txn.customer_id === charlesCustomer.id) {
          console.log('✅ ID Match:', txn.id, txn.customer_name);
          return true;
        }
        
        // Strategy 2: Phone number match
        if (txn.customer_phone && charlesCustomer.phone) {
          const normalizePhone = (phone) => {
            if (!phone) return '';
            return phone.toString().replace(/[^\d]/g, '');
          };
          
          const txnPhone = normalizePhone(txn.customer_phone);
          const customerPhone = normalizePhone(charlesCustomer.phone);
          
          if (txnPhone && customerPhone && txnPhone.length >= 10 && customerPhone.length >= 10) {
            const txnLast10 = txnPhone.slice(-10);
            const customerLast10 = customerPhone.slice(-10);
            
            if (txnLast10 === customerLast10) {
              console.log('✅ Phone Match:', txn.id, txn.customer_name, txnPhone, customerPhone);
              return true;
            }
          }
        }
        
        // Strategy 3: Exact name match
        if (txn.customer_name && charlesCustomer.customer_name) {
          const txnName = txn.customer_name.toString().toLowerCase().trim();
          const customerName = charlesCustomer.customer_name.toString().toLowerCase().trim();
          
          if (txnName === customerName) {
            console.log('✅ Name Match:', txn.id, txn.customer_name);
            return true;
          }
        }
        
        // Strategy 4: Fuzzy name match
        if (txn.customer_name && charlesCustomer.customer_name) {
          const txnName = txn.customer_name.toString().toLowerCase().trim();
          const customerName = charlesCustomer.customer_name.toString().toLowerCase().trim();
          
          if (txnName.includes(customerName) || customerName.includes(txnName)) {
            console.log('✅ Fuzzy Match:', txn.id, txn.customer_name);
            return true;
          }
        }
        
        return false;
      });
      
      console.log(`🎯 Charles matching results: ${matchingTransactions.length} transactions found`);
      const totalAmount = matchingTransactions.reduce((sum, txn) => 
        sum + (parseFloat(txn.total_amount) || 0), 0
      );
      console.log(`💰 Total amount: ₱${totalAmount.toLocaleString()}`);
      
      // Show first few matching transactions
      console.log('📋 First 3 matching transactions:');
      matchingTransactions.slice(0, 3).forEach(txn => {
        console.log(`- ${txn.id}: ${txn.customer_name} (${txn.customer_phone}) - ₱${txn.total_amount}`);
      });
    } else {
      console.log('❌ No Charles customer found in database');
    }
  }
  
  // 4. Check for caching issues
  console.log('\n🔄 CACHE ANALYSIS:');
  
  // Check if useCustomers hook is caching data
  console.log('Checking React Query or SWR cache...');
  
  // Clear any potential localStorage cache
  console.log('📝 Clearing potential caches...');
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('customer') || key.includes('transaction') || key.includes('medcure'))) {
      keysToRemove.push(key);
    }
  }
  
  console.log('🗑️ Keys that could be cleared:', keysToRemove);
  
  return {
    localStorage: {
      customers: storedCustomers ? JSON.parse(storedCustomers) : null,
      transactions: storedTransactions ? JSON.parse(storedTransactions) : null
    },
    database: {
      customers: dbCustomers,
      transactions: dbTransactions
    },
    cacheKeys: keysToRemove
  };
};

// Export for console access
window.debugCustomerTransactionMismatch = debugCustomerTransactionMismatch;

console.log('🔧 Debug script loaded! Run: debugCustomerTransactionMismatch()');