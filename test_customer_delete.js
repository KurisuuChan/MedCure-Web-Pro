// Customer Delete Test Function
// Copy and paste this into the browser console on the Customer Information page

window.testCustomerDelete = async function() {
  console.log('🔍 Testing customer delete functionality...');
  
  try {
    // 1. Check if service is loaded
    if (typeof window.FixedCustomerService === 'undefined') {
      console.error('❌ FixedCustomerService not found');
      return;
    }
    console.log('✅ FixedCustomerService loaded');
    
    // 2. Test table structure detection
    const structure = await window.FixedCustomerService.detectTableStructure();
    console.log('📊 Table structure:', structure);
    
    // 3. Check if there are customers in the UI
    const customerRows = document.querySelectorAll('tbody tr');
    console.log(`📋 Found ${customerRows.length} customer rows in UI`);
    
    if (customerRows.length === 0) {
      console.log('⚠️ No customers found in the table - add some customers first');
      return;
    }
    
    // 4. Get test customer data from first row
    const firstRow = customerRows[0];
    const cells = firstRow.querySelectorAll('td');
    
    const testCustomer = {
      name: cells[0]?.textContent?.trim() || 'Unknown',
      phone: cells[1]?.textContent?.trim() || 'Unknown',
      email: cells[2]?.textContent?.trim() || 'Unknown'
    };
    
    console.log('🎯 Test customer data:', testCustomer);
    
    // 5. Test deletion (dry run)
    console.log('🧪 Running deletion test...');
    const testResult = await window.FixedCustomerService.testDeletion(testCustomer.name);
    console.log('🧪 Test result:', testResult);
    
    // 6. Check delete button functionality
    const deleteButtons = document.querySelectorAll('button[title="Delete Customer"]');
    console.log(`🔘 Found ${deleteButtons.length} delete buttons`);
    
    if (deleteButtons.length > 0) {
      console.log('✅ Delete buttons are present in the UI');
      console.log('🔍 You can now test by clicking a delete button and checking the console for detailed logs');
    }
    
    console.log('✅ Test complete - customer delete functionality should be working');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Auto-run the test
window.testCustomerDelete();