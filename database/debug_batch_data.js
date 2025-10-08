// Quick debug script to check batch data structure
// Run this in browser console on your batch management page

console.log("=== BATCH DATA DEBUG ===");

// Check if batches are loaded
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log("React detected - checking component state...");
}

// Test the enhanced batch service
async function testBatchService() {
  try {
    console.log("Testing Enhanced Batch Service...");
    
    // This should match your import structure
    const response = await fetch('/api/batches'); // Adjust URL as needed
    console.log("Response:", response);
    
    // Alternatively, if you have access to the service:
    // const batches = await EnhancedBatchService.getAllBatches();
    // console.log("Batches from service:", batches);
    
  } catch (error) {
    console.error("Error testing batch service:", error);
  }
}

// Check localStorage for any cached data
console.log("LocalStorage data:", {
  products: localStorage.getItem('products'),
  batches: localStorage.getItem('batches'),
});

// Run the test
testBatchService();

console.log("=== END DEBUG ===");