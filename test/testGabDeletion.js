// 🧪 TEST GAB CUSTOMER DELETION
// Copy and paste this into your browser console

console.log('🧪 Testing Gab customer deletion...');

// First, let's see Gab's current data
async function checkGabStatus() {
    console.log('🔍 Checking Gab\'s current status...');
    
    // Try to find Gab in customers table (most likely)
    try {
        const { data: customers, error: custError } = await window.supabase
            .from('customers')
            .select('*')
            .or(`name.ilike.%Gab%,phone.ilike.%9182764579%`)
            .limit(5);
            
        if (customers && customers.length > 0) {
            console.log('✅ Found Gab in customers table:', customers);
            return { table: 'customers', data: customers[0] };
        }
    } catch (e) {
        console.log('⚠️ Customers table check failed:', e.message);
    }
    
    // Try sales table as backup
    try {
        const { data: sales, error: salesError } = await window.supabase
            .from('sales')
            .select('customer_name, customer_phone')
            .or(`customer_name.ilike.%Gab%,customer_phone.ilike.%9182764579%`)
            .limit(5);
            
        if (sales && sales.length > 0) {
            console.log('✅ Found Gab in sales table:', sales);
            return { table: 'sales', data: sales[0] };
        }
    } catch (e) {
        console.log('⚠️ Sales table check failed:', e.message);
    }
    
    console.log('❌ Could not find Gab in any table');
    return null;
}

// Test the actual deletion
async function testRealDeletion() {
    console.log('🧪 Testing REAL customer deletion for Gab...');
    
    // Get Gab's actual ID from the customers list
    const gabCustomer = window.customers?.find(c => c.name?.includes('Gab')) || 
                       window.customers?.find(c => c.phone?.includes('9182764579'));
    
    if (!gabCustomer) {
        console.log('❌ Could not find Gab in the customers list');
        return;
    }
    
    console.log('✅ Found Gab:', gabCustomer);
    
    try {
        // Use the FixedCustomerService to delete
        const result = await window.FixedCustomerService.deleteCustomer(gabCustomer.id);
        console.log('🎉 Deletion result:', result);
        
        if (result.success) {
            console.log('✅ SUCCESS! Gab was deleted successfully');
        } else {
            console.log('❌ FAILED! Deletion was not successful:', result.error);
        }
    } catch (error) {
        console.log('💥 ERROR during deletion:', error);
    }
}

// Run the tests
checkGabStatus().then(() => testRealDeletion());