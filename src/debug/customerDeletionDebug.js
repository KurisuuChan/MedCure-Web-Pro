// 🔍 CUSTOMER DELETION DEBUG SCRIPT
// Copy and paste this into your browser console while on the Customer Information page

console.log('🔍 Starting customer deletion debug...');

async function debugCustomerDeletion() {
  try {
    // Step 1: Check if we can access the customers table
    console.log('📊 Testing customers table access...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(3);
    
    console.log('📊 Customers table result:', { data: customers, error: customersError });
    
    if (customersError) {
      console.error('❌ Cannot access customers table:', customersError);
      
      if (customersError.message.includes('relation "customers" does not exist')) {
        console.log('💡 The customers table does not exist!');
        console.log('💡 Your app might be using a different table structure');
        
        // Test sales table instead
        console.log('🔍 Testing sales table...');
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('customer_name, customer_phone, created_at')
          .limit(3);
        
        console.log('📊 Sales table result:', { data: salesData, error: salesError });
        
        if (!salesError && salesData) {
          console.log('💡 Found customer data in sales table');
          console.log('💡 This suggests your app uses sales table for customer info, not a separate customers table');
        }
      }
      return;
    }

    // Step 2: Test customer deletion if table exists
    if (customers && customers.length > 0) {
      const testCustomer = customers[0];
      console.log('🧪 Testing deletion with customer:', testCustomer.customer_name);
      
      // Test soft delete
      const { data: deleteResult, error: deleteError } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', testCustomer.id)
        .select();
      
      console.log('🗑️ Delete test result:', { data: deleteResult, error: deleteError });
      
      if (deleteError) {
        console.error('❌ Delete failed:', deleteError);
        
        if (deleteError.message.includes('permission')) {
          console.log('💡 RLS policies are blocking the delete operation');
        }
      } else {
        console.log('✅ Delete test successful!');
        
        // Revert the test
        await supabase
          .from('customers')
          .update({ is_active: true })
          .eq('id', testCustomer.id);
        console.log('↩️ Reverted test deletion');
      }
    }

    // Step 3: Check the actual CustomerService being used
    if (typeof CustomerService !== 'undefined') {
      console.log('🔍 CustomerService is available');
      console.log('📋 CustomerService methods:', Object.getOwnPropertyNames(CustomerService));
      
      // Test the actual delete method
      if (customers && customers.length > 0) {
        const testCustomerId = customers[0].id;
        console.log('🧪 Testing CustomerService.deleteCustomer...');
        
        try {
          const result = await CustomerService.deleteCustomer(testCustomerId);
          console.log('✅ CustomerService.deleteCustomer result:', result);
        } catch (serviceError) {
          console.error('❌ CustomerService.deleteCustomer failed:', serviceError);
        }
      }
    } else {
      console.warn('⚠️ CustomerService not found in global scope');
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Check current page context
console.log('📍 Current page URL:', window.location.href);
console.log('📍 Current page title:', document.title);

// Check if we're on the customer page
if (window.location.href.includes('customer')) {
  console.log('✅ On customer page - running debug...');
  debugCustomerDeletion();
} else {
  console.log('⚠️ Not on customer page - navigate to customer page first');
}

console.log('');
console.log('💡 If you see "customers table does not exist" error:');
console.log('   Your app might be using sales table for customer data');
console.log('   The delete function needs to be updated accordingly');
console.log('');
console.log('💡 If you see RLS/permission errors:');
console.log('   Run this in Supabase SQL: ALTER TABLE customers DISABLE ROW LEVEL SECURITY;');