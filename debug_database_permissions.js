// Database Permission Test and Fix
// Run this in the browser console to test and diagnose database permission issues

window.testDatabasePermissions = async function() {
  console.log('🔍 Testing database permissions for customer deletion...');
  
  try {
    // Test 1: Check if we can read customers
    console.log('📋 Test 1: Reading customers table...');
    const { data: customers, error: readError } = await window.supabase
      .from('customers')
      .select('*')
      .limit(5);
      
    if (readError) {
      console.error('❌ Cannot read customers table:', readError);
      return;
    }
    
    console.log(`✅ Can read customers table (${customers.length} customers found)`);
    
    if (customers.length === 0) {
      console.log('⚠️ No customers found - create a customer first to test deletion');
      return;
    }
    
    const testCustomer = customers[0];
    console.log('🎯 Using customer for testing:', testCustomer.customer_name);
    
    // Test 2: Check if stored function exists
    console.log('📋 Test 2: Checking for delete_customer_safely function...');
    const { data: funcResult, error: funcError } = await window.supabase
      .rpc('delete_customer_safely', { customer_uuid: 'test-uuid' });
      
    if (funcError) {
      if (funcError.message.includes('does not exist')) {
        console.log('⚠️ Stored function delete_customer_safely does not exist');
        console.log('💡 You need to run the SQL setup script in Supabase');
        console.log('📄 Check the file: database/CUSTOMER_DELETION_SETUP.sql');
      } else {
        console.log('⚠️ Function exists but returned error (expected for test UUID):', funcError.message);
      }
    } else {
      console.log('✅ Stored function is available');
    }
    
    // Test 3: Try direct update (test permissions)
    console.log('📋 Test 3: Testing direct update permissions...');
    const { error: updateError } = await window.supabase
      .from('customers')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testCustomer.id);
      
    if (updateError) {
      console.error('❌ Cannot update customers table:', updateError);
      console.log('💡 This indicates a Row Level Security (RLS) policy issue');
      console.log('📄 Run the SQL setup script to fix permissions');
    } else {
      console.log('✅ Can update customers table');
    }
    
    // Test 4: Check RLS policies
    console.log('📋 Test 4: Checking RLS policies...');
    const { data: policies, error: policyError } = await window.supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'customers');
      
    if (policyError) {
      console.log('⚠️ Cannot check RLS policies (this is normal for non-admin users)');
    } else {
      console.log(`📊 Found ${policies.length} RLS policies for customers table`);
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd}`);
      });
    }
    
    console.log('\n🔧 DIAGNOSIS COMPLETE');
    console.log('=====================================');
    
    if (updateError && updateError.message.includes('row-level security')) {
      console.log('❌ ISSUE FOUND: Row Level Security policy is blocking updates');
      console.log('💡 SOLUTION: Run this SQL in your Supabase SQL Editor:');
      console.log(`
-- Quick fix for customer deletion permissions:
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON customers
    FOR ALL 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
      `);
    } else {
      console.log('✅ Basic permissions look good');
      console.log('💡 If deletion still fails, run the full setup script');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Auto-run the test
window.testDatabasePermissions();