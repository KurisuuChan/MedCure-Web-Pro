/**
 * Comprehensive Customer Statistics Diagnostic Tool
 * Professional-grade analysis to identify the root cause of zero statistics
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class CustomerStatisticsDiagnostic {
  
  static async runComprehensiveAnalysis() {
    console.log('🔬 COMPREHENSIVE CUSTOMER STATISTICS ANALYSIS');
    console.log('============================================');
    
    try {
      // Step 1: Get raw database data
      const analysis = await this.getRawDatabaseData();
      
      // Step 2: Analyze data structures
      await this.analyzeDataStructures(analysis);
      
      // Step 3: Test matching algorithms
      await this.testMatchingAlgorithms(analysis);
      
      // Step 4: Identify root cause
      await this.identifyRootCause(analysis);
      
      // Step 5: Provide fix recommendations
      await this.provideFixes(analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }
  
  static async getRawDatabaseData() {
    console.log('\n📊 STEP 1: Fetching Raw Database Data');
    console.log('=====================================');
    
    // Get customers
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
      
    if (customerError) {
      console.error('❌ Customer fetch error:', customerError);
      throw customerError;
    }
    
    // Get transactions  
    const { data: transactions, error: transactionError } = await supabase
      .from('sales')
      .select('*')
      .not('status', 'eq', 'cancelled')
      .not('customer_name', 'eq', '[DELETED CUSTOMER]')
      .not('customer_name', 'is', null)
      .order('created_at', { ascending: false });
      
    if (transactionError) {
      console.error('❌ Transaction fetch error:', transactionError);
      throw transactionError;
    }
    
    console.log(`✅ Found ${customers?.length || 0} customers`);
    console.log(`✅ Found ${transactions?.length || 0} transactions`);
    
    return { customers, transactions };
  }
  
  static async analyzeDataStructures(analysis) {
    console.log('\n🔍 STEP 2: Analyzing Data Structures');
    console.log('====================================');
    
    const { customers, transactions } = analysis;
    
    // Analyze customer data structure
    if (customers && customers.length > 0) {
      const sampleCustomer = customers[0];
      console.log('👤 Sample Customer Structure:', {
        id: sampleCustomer.id,
        customer_name: sampleCustomer.customer_name,
        phone: sampleCustomer.phone,
        email: sampleCustomer.email,
        created_at: sampleCustomer.created_at,
        keys: Object.keys(sampleCustomer)
      });
      
      // Check for data quality issues
      const customersWithoutNames = customers.filter(c => !c.customer_name);
      const customersWithoutPhones = customers.filter(c => !c.phone);
      const customersWithoutIds = customers.filter(c => !c.id);
      
      console.log('📈 Customer Data Quality:', {
        total: customers.length,
        withoutNames: customersWithoutNames.length,
        withoutPhones: customersWithoutPhones.length,
        withoutIds: customersWithoutIds.length
      });
    }
    
    // Analyze transaction data structure
    if (transactions && transactions.length > 0) {
      const sampleTransaction = transactions[0];
      console.log('💰 Sample Transaction Structure:', {
        id: sampleTransaction.id,
        customer_id: sampleTransaction.customer_id,
        customer_name: sampleTransaction.customer_name,
        customer_phone: sampleTransaction.customer_phone,
        total_amount: sampleTransaction.total_amount,
        created_at: sampleTransaction.created_at,
        keys: Object.keys(sampleTransaction)
      });
      
      // Check for data quality issues
      const transactionsWithCustomerIds = transactions.filter(t => t.customer_id);
      const transactionsWithCustomerNames = transactions.filter(t => t.customer_name);
      const transactionsWithCustomerPhones = transactions.filter(t => t.customer_phone);
      
      console.log('📈 Transaction Data Quality:', {
        total: transactions.length,
        withCustomerIds: transactionsWithCustomerIds.length,
        withCustomerNames: transactionsWithCustomerNames.length,
        withCustomerPhones: transactionsWithCustomerPhones.length
      });
      
      // Show sample customer data from transactions
      console.log('📋 Sample Transaction Customer Data:');
      transactions.slice(0, 5).forEach((txn, idx) => {
        console.log(`  ${idx + 1}. ${txn.customer_name} | ${txn.customer_phone} | ID: ${txn.customer_id} | ₱${txn.total_amount}`);
      });
    }
    
    analysis.dataQuality = {
      customersTotal: customers?.length || 0,
      transactionsTotal: transactions?.length || 0,
      transactionsWithIds: transactions?.filter(t => t.customer_id)?.length || 0,
      transactionsWithNames: transactions?.filter(t => t.customer_name)?.length || 0,
      transactionsWithPhones: transactions?.filter(t => t.customer_phone)?.length || 0
    };
  }
  
  static async testMatchingAlgorithms(analysis) {
    console.log('\n🧪 STEP 3: Testing Matching Algorithms');
    console.log('======================================');
    
    const { customers, transactions } = analysis;
    const matchingResults = [];
    
    // Test each customer against all transactions
    for (const customer of customers.slice(0, 5)) { // Test first 5 customers
      console.log(`\n🎯 Testing matches for: ${customer.customer_name}`);
      
      const matches = {
        customer: customer,
        byId: [],
        byPhone: [],
        byName: [],
        byFuzzy: [],
        total: 0
      };
      
      for (const txn of transactions) {
        // Strategy 1: ID match
        if (txn.customer_id && customer.id && txn.customer_id === customer.id) {
          matches.byId.push(txn);
        }
        
        // Strategy 2: Phone match
        if (txn.customer_phone && customer.phone) {
          const normalizePhone = (phone) => phone?.toString().replace(/[^\d]/g, '') || '';
          const txnPhone = normalizePhone(txn.customer_phone);
          const customerPhone = normalizePhone(customer.phone);
          
          if (txnPhone && customerPhone && txnPhone.length >= 10 && customerPhone.length >= 10) {
            const txnLast10 = txnPhone.slice(-10);
            const customerLast10 = customerPhone.slice(-10);
            
            if (txnLast10 === customerLast10) {
              matches.byPhone.push(txn);
            }
          }
        }
        
        // Strategy 3: Name match
        if (txn.customer_name && customer.customer_name) {
          const txnName = txn.customer_name.toString().toLowerCase().trim();
          const customerName = customer.customer_name.toString().toLowerCase().trim();
          
          if (txnName === customerName) {
            matches.byName.push(txn);
          }
        }
      }
      
      // Remove duplicates and count total
      const allMatches = [...new Set([...matches.byId, ...matches.byPhone, ...matches.byName])];
      matches.total = allMatches.length;
      
      console.log(`  📊 Results: ${matches.total} total matches`);
      console.log(`    - By ID: ${matches.byId.length}`);
      console.log(`    - By Phone: ${matches.byPhone.length}`);
      console.log(`    - By Name: ${matches.byName.length}`);
      
      if (matches.total === 0) {
        console.log(`  ⚠️ NO MATCHES FOUND for ${customer.customer_name}!`);
        console.log(`    Customer: ID=${customer.id}, Phone=${customer.phone}, Name="${customer.customer_name}"`);
        
        // Find similar transactions
        const similarTransactions = transactions.filter(txn => {
          const txnName = txn.customer_name?.toString().toLowerCase() || '';
          const customerName = customer.customer_name?.toString().toLowerCase() || '';
          return txnName.includes(customerName.split(' ')[0]) || customerName.includes(txnName.split(' ')[0]);
        }).slice(0, 3);
        
        if (similarTransactions.length > 0) {
          console.log(`    🔍 Similar transactions found:`);
          similarTransactions.forEach(txn => {
            console.log(`      - "${txn.customer_name}" | ${txn.customer_phone} | ID: ${txn.customer_id}`);
          });
        }
      }
      
      matchingResults.push(matches);
    }
    
    analysis.matchingResults = matchingResults;
  }
  
  static async identifyRootCause(analysis) {
    console.log('\n🕵️ STEP 4: Root Cause Analysis');
    console.log('==============================');
    
    const { dataQuality, matchingResults } = analysis;
    const issues = [];
    
    // Check if transactions have customer_id references
    if (dataQuality.transactionsWithIds === 0) {
      issues.push({
        severity: 'CRITICAL',
        issue: 'No transactions have customer_id references',
        impact: 'ID-based matching will fail completely',
        solution: 'Need to populate customer_id in transactions table'
      });
    }
    
    // Check if phone formats match
    const phoneFormatIssues = matchingResults.filter(r => r.byPhone.length === 0 && r.customer.phone);
    if (phoneFormatIssues.length > 0) {
      issues.push({
        severity: 'HIGH',
        issue: 'Phone number format mismatch',
        impact: 'Phone-based matching is failing',
        solution: 'Need to normalize phone formats in both tables'
      });
    }
    
    // Check if name formats match
    const nameFormatIssues = matchingResults.filter(r => r.byName.length === 0 && r.customer.customer_name);
    if (nameFormatIssues.length > 0) {
      issues.push({
        severity: 'HIGH', 
        issue: 'Customer name format mismatch',
        impact: 'Name-based matching is failing',
        solution: 'Need to normalize name formats or improve fuzzy matching'
      });
    }
    
    // Check for zero matches
    const zeroMatches = matchingResults.filter(r => r.total === 0);
    if (zeroMatches.length > 0) {
      issues.push({
        severity: 'CRITICAL',
        issue: `${zeroMatches.length} customers have zero transaction matches`,
        impact: 'These customers will show 0 orders/revenue',
        solution: 'Data linking between customers and transactions is broken'
      });
    }
    
    console.log('🚨 Issues Identified:');
    issues.forEach((issue, idx) => {
      console.log(`\n  ${idx + 1}. [${issue.severity}] ${issue.issue}`);
      console.log(`     Impact: ${issue.impact}`);
      console.log(`     Solution: ${issue.solution}`);
    });
    
    analysis.issues = issues;
  }
  
  static async provideFixes(analysis) {
    console.log('\n🔧 STEP 5: Professional Fix Recommendations');
    console.log('==========================================');
    
    const { issues, customers, transactions } = analysis;
    
    console.log('💡 IMMEDIATE FIXES NEEDED:\n');
    
    // Fix 1: Database relationship issues
    if (issues.some(i => i.issue.includes('customer_id'))) {
      console.log('🔗 FIX 1: Establish Customer-Transaction Relationships');
      console.log('   - Create migration to populate customer_id in transactions');
      console.log('   - Match existing transactions to customers');
      console.log('   - Add foreign key constraints');
    }
    
    // Fix 2: Phone normalization
    if (issues.some(i => i.issue.includes('phone'))) {
      console.log('📱 FIX 2: Phone Number Normalization');
      console.log('   - Standardize phone formats in both tables');
      console.log('   - Remove formatting characters consistently');
      console.log('   - Handle country codes properly');
    }
    
    // Fix 3: Name standardization
    if (issues.some(i => i.issue.includes('name'))) {
      console.log('👤 FIX 3: Customer Name Standardization');
      console.log('   - Trim whitespace and normalize casing');
      console.log('   - Handle name variations (nicknames, abbreviations)');
      console.log('   - Implement fuzzy matching algorithms');
    }
    
    // Fix 4: Matching algorithm improvements
    console.log('🎯 FIX 4: Enhanced Matching Algorithm');
    console.log('   - Implement weighted matching scores');
    console.log('   - Add confidence levels for matches');
    console.log('   - Create match validation and manual review system');
    
    return analysis;
  }
}

// Make available globally for console access
if (typeof window !== 'undefined') {
  window.CustomerStatisticsDiagnostic = CustomerStatisticsDiagnostic;
  window.runDiagnostic = () => CustomerStatisticsDiagnostic.runComprehensiveAnalysis();
}

console.log('🔬 Professional Diagnostic Tool Loaded!');
console.log('Run: runDiagnostic() in console for comprehensive analysis');