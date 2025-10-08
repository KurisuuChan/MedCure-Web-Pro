// Debug script to test customer deletion functionality
// Run this in the browser console on the Customer Information page

console.log('🔍 Starting customer delete debug...');

async function debugCustomerDelete() {
  try {
    // Check if FixedCustomerService is available
    if (typeof window.FixedCustomerService === 'undefined') {
      console.error('❌ FixedCustomerService not found in window object');
      return;
    }
    
    console.log('✅ FixedCustomerService found');
    
    // Test table structure detection
    console.log('🔍 Testing table structure detection...');
    const structure = await window.FixedCustomerService.detectTableStructure();
    console.log('📊 Table structure:', structure);
    
    // Get a sample customer ID from the page
    const customerRows = document.querySelectorAll('tbody tr');
    if (customerRows.length === 0) {
      console.log('⚠️ No customers found in the table');
      return;
    }
    
    // Try to get customer ID from the first customer row
    const firstRow = customerRows[0];
    const customerName = firstRow.querySelector('td:first-child')?.textContent?.trim();
    
    if (customerName) {
      console.log('🔍 Testing deletion for customer:', customerName);
      
      // Test the deletion function
      const testResult = await window.testCustomerDeletion(customerName);
      console.log('🧪 Test deletion result:', testResult);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Also check if there are any event listeners on delete buttons
function checkDeleteButtons() {
  const deleteButtons = document.querySelectorAll('button[title="Delete Customer"]');
  console.log(`🔍 Found ${deleteButtons.length} delete buttons`);
  
  deleteButtons.forEach((button, index) => {
    console.log(`Button ${index + 1}:`, {
      hasOnClick: !!button.onclick,
      eventListeners: getEventListeners ? getEventListeners(button) : 'Not available'
    });
  });
}

// Run the debug
debugCustomerDelete();
checkDeleteButtons();

console.log('🔍 Debug complete. Check the logs above for issues.');