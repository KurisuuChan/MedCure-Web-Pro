// Debug script to test the RPC call directly in browser
// Open your dashboard, then run this in browser console

console.log('🔍 Testing RPC function call...');

// Test the RPC call directly
const testRPC = async () => {
  try {
    const { data, error } = await window.supabase
      .rpc('get_top_selling_products', { days_limit: 30, product_limit: 5 });

    console.log('📊 RPC Result:', {
      data: data,
      error: error,
      dataLength: data ? data.length : 0,
      hasData: data && data.length > 0
    });

    if (data && data.length > 0) {
      console.log('✅ Top selling products from RPC:');
      data.forEach((product, index) => {
        console.log(`${index + 1}. ${product.brand_name} (${product.generic_name}) - ${product.total_quantity} units, ₱${product.total_revenue}`);
      });
    } else {
      console.log('❌ No data returned from RPC function');
      if (error) {
        console.log('Error details:', error);
      }
    }
  } catch (err) {
    console.error('❌ RPC call failed:', err);
  }
};

// Run the test
testRPC();

// Expected results:
// 1. Amoxil (Amoxicillin) - 544 units
// 2. Biogesic (Paracetamol) - 3 units  
// 3. Cecon (Ascorbic Acid) - 2 units