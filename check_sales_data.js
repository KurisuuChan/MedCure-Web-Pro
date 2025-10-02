// Quick script to check sales data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cslwevxjssmhemsghqqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHdldnhqc3NtaGVtc2docXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0NzIyNjEsImV4cCI6MjA0OTA0ODI2MX0.AaUlHf7Ss3MdWqQYU-K4zcDxhAwDIr4qSCpfkwYVGCw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSalesData() {
  console.log('🔍 Checking sales data...\n');

  // Check sales table
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('📊 Recent Sales:');
  if (salesError) {
    console.log('Error:', salesError);
  } else {
    console.log(JSON.stringify(sales, null, 2));
  }
  console.log(`Total count: ${sales?.length || 0}\n`);

  // Check sales_items table
  const { data: salesItems, error: itemsError } = await supabase
    .from('sales_items')
    .select('*, products(name), sales(status, created_at)')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('🛒 Recent Sales Items:');
  if (itemsError) {
    console.log('Error:', itemsError);
  } else {
    console.log(JSON.stringify(salesItems, null, 2));
  }
  console.log(`Total count: ${salesItems?.length || 0}\n`);

  // Check top selling function
  const { data: topProducts, error: topError } = await supabase
    .rpc('get_top_selling_products', { days_limit: 30, product_limit: 5 });

  console.log('🏆 Top Selling Products (from RPC):');
  if (topError) {
    console.log('Error:', topError);
  } else {
    console.log(JSON.stringify(topProducts, null, 2));
  }
  console.log(`Total count: ${topProducts?.length || 0}\n`);
}

checkSalesData().catch(console.error);
