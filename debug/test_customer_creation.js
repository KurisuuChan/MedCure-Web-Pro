// Test Customer Creation - Run this in browser console to debug
// Open browser console (F12) and paste this code

async function testCustomerCreation() {
  console.log("🧪 Testing customer creation...");
  
  // Test 1: Check if CustomerService is available
  try {
    console.log("1. Checking CustomerService availability...");
    if (typeof window.CustomerService === 'undefined') {
      console.error("❌ CustomerService not available on window object");
      return;
    }
    
    // Test 2: Try creating a customer with valid data
    console.log("2. Testing customer creation with valid data...");
    const testCustomer = await window.CustomerService.createCustomer({
      customer_name: "Test Customer Debug",
      phone: "09123456789",
      email: "test@example.com",
      address: "Test Address 123"
    });
    
    console.log("✅ Customer created successfully:", testCustomer);
    console.log("🔍 Customer ID:", testCustomer.id);
    
    // Test 3: Check if customer exists in database
    console.log("3. Checking if customer was saved to database...");
    // This would require a database query
    
    return testCustomer;
    
  } catch (error) {
    console.error("❌ Customer creation test failed:", error);
    console.error("Error details:", error.message);
  }
}

// Run the test
testCustomerCreation();