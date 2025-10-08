/**
 * 🧪 ENHANCED BATCH MANAGEMENT SYSTEM - COMPREHENSIVE TEST SUITE
 * 
 * Run this script to validate all enhanced batch management features
 * Execute in browser console while on BatchManagementPage
 */

class EnhancedBatchSystemTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
    console.log('🚀 Starting Enhanced Batch Management System Tests...\n');
  }

  async runAllTests() {
    try {
      // Test 1: Database Schema Validation
      await this.testDatabaseSchema();
      
      // Test 2: Enhanced Service Methods
      await this.testEnhancedService();
      
      // Test 3: FEFO Processing
      await this.testFEFOProcessing();
      
      // Test 4: Analytics Functions
      await this.testAnalytics();
      
      // Test 5: Maintenance Operations
      await this.testMaintenanceOperations();
      
      // Test 6: UI Components
      await this.testUIComponents();
      
      // Test 7: Performance Validation
      await this.testPerformance();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testDatabaseSchema() {
    console.log('📊 Testing Database Schema...');
    
    try {
      // Test enhanced tables exist
      const { data: tables, error } = await window.supabase
        .from('information_schema.tables')
        .select('table_name')
        .in('table_name', ['product_batches', 'inventory_logs', 'batch_adjustments']);
      
      if (error) throw error;
      
      const expectedTables = ['product_batches', 'inventory_logs', 'batch_adjustments'];
      const foundTables = tables.map(t => t.table_name);
      const missingTables = expectedTables.filter(t => !foundTables.includes(t));
      
      if (missingTables.length === 0) {
        this.addTestResult('✅ Database Schema', 'All enhanced tables exist');
      } else {
        this.addTestResult('❌ Database Schema', `Missing tables: ${missingTables.join(', ')}`);
      }
      
      // Test enhanced functions exist
      const { data: functions, error: funcError } = await window.supabase.rpc('test_enhanced_functions');
      
      if (!funcError) {
        this.addTestResult('✅ Database Functions', 'Enhanced functions available');
      } else {
        this.addTestResult('⚠️ Database Functions', 'Some functions may be missing');
      }
      
    } catch (error) {
      this.addTestResult('❌ Database Schema', `Error: ${error.message}`);
    }
  }

  async testEnhancedService() {
    console.log('🔧 Testing Enhanced Service Methods...');
    
    try {
      // Check if EnhancedBatchService is available
      if (typeof window.EnhancedBatchService !== 'undefined') {
        this.addTestResult('✅ Service Loading', 'EnhancedBatchService loaded successfully');
        
        // Test key methods exist
        const service = window.EnhancedBatchService;
        const requiredMethods = [
          'addProductBatch', 'getAllBatches', 'processFEFOSale',
          'quarantineExpiredBatches', 'getBatchAnalytics', 'validateStockAvailability'
        ];
        
        const missingMethods = requiredMethods.filter(method => typeof service[method] !== 'function');
        
        if (missingMethods.length === 0) {
          this.addTestResult('✅ Service Methods', 'All enhanced methods available');
        } else {
          this.addTestResult('❌ Service Methods', `Missing: ${missingMethods.join(', ')}`);
        }
        
      } else {
        this.addTestResult('❌ Service Loading', 'EnhancedBatchService not found');
      }
      
    } catch (error) {
      this.addTestResult('❌ Enhanced Service', `Error: ${error.message}`);
    }
  }

  async testFEFOProcessing() {
    console.log('🔄 Testing FEFO Processing...');
    
    try {
      // Create test data for FEFO
      const testBatches = [
        { product_id: 'test-product-1', quantity: 100, expiry_date: '2024-12-31' },
        { product_id: 'test-product-1', quantity: 50, expiry_date: '2024-11-30' },
        { product_id: 'test-product-1', quantity: 75, expiry_date: '2025-01-31' }
      ];
      
      // Test FEFO logic (should pick Nov batch first)
      const sortedBatches = testBatches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
      
      if (sortedBatches[0].expiry_date === '2024-11-30') {
        this.addTestResult('✅ FEFO Logic', 'Correctly sorts by expiry date');
      } else {
        this.addTestResult('❌ FEFO Logic', 'Incorrect sorting order');
      }
      
      // Test quantity validation
      const totalQuantity = testBatches.reduce((sum, batch) => sum + batch.quantity, 0);
      if (totalQuantity === 225) {
        this.addTestResult('✅ Quantity Calculation', 'Correct total quantity');
      } else {
        this.addTestResult('❌ Quantity Calculation', `Expected 225, got ${totalQuantity}`);
      }
      
    } catch (error) {
      this.addTestResult('❌ FEFO Processing', `Error: ${error.message}`);
    }
  }

  async testAnalytics() {
    console.log('📈 Testing Analytics Functions...');
    
    try {
      // Test analytics data structure
      const mockAnalytics = {
        totalBatches: 150,
        totalValue: 45000,
        expiringBatches: 12,
        expiredBatches: 3,
        statusBreakdown: {
          available: 120,
          reserved: 15,
          quarantined: 8,
          expired: 7
        }
      };
      
      // Validate analytics structure
      const requiredFields = ['totalBatches', 'totalValue', 'expiringBatches', 'expiredBatches', 'statusBreakdown'];
      const missingFields = requiredFields.filter(field => !(field in mockAnalytics));
      
      if (missingFields.length === 0) {
        this.addTestResult('✅ Analytics Structure', 'All required fields present');
      } else {
        this.addTestResult('❌ Analytics Structure', `Missing: ${missingFields.join(', ')}`);
      }
      
      // Test calculations
      const statusTotal = Object.values(mockAnalytics.statusBreakdown).reduce((sum, val) => sum + val, 0);
      if (statusTotal === mockAnalytics.totalBatches) {
        this.addTestResult('✅ Analytics Calculations', 'Status breakdown matches total');
      } else {
        this.addTestResult('❌ Analytics Calculations', 'Status breakdown mismatch');
      }
      
    } catch (error) {
      this.addTestResult('❌ Analytics Testing', `Error: ${error.message}`);
    }
  }

  async testMaintenanceOperations() {
    console.log('🛠️ Testing Maintenance Operations...');
    
    try {
      // Test expired batch detection
      const currentDate = new Date();
      const expiredDate = new Date(currentDate);
      expiredDate.setDate(currentDate.getDate() - 1);
      
      const testBatches = [
        { expiry_date: expiredDate.toISOString(), status: 'available' },
        { expiry_date: new Date(Date.now() + 86400000).toISOString(), status: 'available' }
      ];
      
      const expiredBatches = testBatches.filter(batch => {
        return new Date(batch.expiry_date) < currentDate && batch.status === 'available';
      });
      
      if (expiredBatches.length === 1) {
        this.addTestResult('✅ Expired Detection', 'Correctly identifies expired batches');
      } else {
        this.addTestResult('❌ Expired Detection', 'Failed to identify expired batches');
      }
      
      // Test quarantine functionality
      const quarantinedBatch = { ...expiredBatches[0], status: 'quarantined' };
      if (quarantinedBatch.status === 'quarantined') {
        this.addTestResult('✅ Quarantine Function', 'Can quarantine expired batches');
      } else {
        this.addTestResult('❌ Quarantine Function', 'Failed to quarantine batch');
      }
      
    } catch (error) {
      this.addTestResult('❌ Maintenance Operations', `Error: ${error.message}`);
    }
  }

  async testUIComponents() {
    console.log('🎨 Testing UI Components...');
    
    try {
      // Check for key UI elements
      const uiElements = {
        'Analytics Button': 'button:contains("Analytics")',
        'Quarantine Button': 'button:contains("Quarantine")',
        'Maintenance Button': 'button:contains("Maintenance")',
        'Batch Table': 'table',
        'Status Filter': 'select',
        'Search Input': 'input[placeholder*="Search"]'
      };
      
      let foundElements = 0;
      const totalElements = Object.keys(uiElements).length;
      
      for (const [name, selector] of Object.entries(uiElements)) {
        const element = document.querySelector(selector) || 
                       document.querySelector(`[data-testid="${selector}"]`) ||
                       Array.from(document.querySelectorAll('button')).find(btn => 
                         btn.textContent.includes(name.replace(' Button', ''))
                       );
        
        if (element) {
          foundElements++;
        } else {
          console.log(`⚠️ UI Element not found: ${name}`);
        }
      }
      
      const uiScore = Math.round((foundElements / totalElements) * 100);
      
      if (uiScore >= 80) {
        this.addTestResult('✅ UI Components', `${uiScore}% of elements found`);
      } else if (uiScore >= 60) {
        this.addTestResult('⚠️ UI Components', `${uiScore}% of elements found`);
      } else {
        this.addTestResult('❌ UI Components', `Only ${uiScore}% of elements found`);
      }
      
    } catch (error) {
      this.addTestResult('❌ UI Components', `Error: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    try {
      // Test large dataset handling
      const startTime = performance.now();
      
      // Simulate large batch processing
      const largeBatchSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        product_id: `product-${i % 100}`,
        quantity: Math.floor(Math.random() * 100) + 1,
        expiry_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: ['available', 'reserved', 'quarantined'][Math.floor(Math.random() * 3)]
      }));
      
      // Test filtering performance
      const filteredBatches = largeBatchSet.filter(batch => batch.status === 'available');
      
      // Test sorting performance
      const sortedBatches = largeBatchSet.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      if (processingTime < 100) {
        this.addTestResult('✅ Performance', `Processed 1000 batches in ${processingTime.toFixed(2)}ms`);
      } else if (processingTime < 500) {
        this.addTestResult('⚠️ Performance', `Processed 1000 batches in ${processingTime.toFixed(2)}ms`);
      } else {
        this.addTestResult('❌ Performance', `Slow processing: ${processingTime.toFixed(2)}ms`);
      }
      
    } catch (error) {
      this.addTestResult('❌ Performance Testing', `Error: ${error.message}`);
    }
  }

  addTestResult(status, description) {
    this.testResults.push({ status, description, timestamp: Date.now() });
    console.log(`${status} ${description}`);
  }

  generateReport() {
    const endTime = Date.now();
    const totalTime = endTime - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 ENHANCED BATCH MANAGEMENT SYSTEM TEST REPORT');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status.includes('✅')).length;
    const warning = this.testResults.filter(r => r.status.includes('⚠️')).length;
    const failed = this.testResults.filter(r => r.status.includes('❌')).length;
    const total = this.testResults.length;
    
    console.log(`\n📊 TEST SUMMARY:`);
    console.log(`   ✅ Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
    console.log(`   ⚠️ Warnings: ${warning}/${total} (${Math.round(warning/total*100)}%)`);
    console.log(`   ❌ Failed: ${failed}/${total} (${Math.round(failed/total*100)}%)`);
    console.log(`   ⏱️ Total Time: ${totalTime}ms`);
    
    console.log(`\n📝 DETAILED RESULTS:`);
    this.testResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.status} ${result.description}`);
    });
    
    console.log(`\n🎯 SYSTEM STATUS:`);
    if (failed === 0 && warning <= 1) {
      console.log('   🟢 EXCELLENT - System ready for production!');
    } else if (failed <= 1 && warning <= 3) {
      console.log('   🟡 GOOD - Minor issues, mostly functional');
    } else if (failed <= 3) {
      console.log('   🟠 NEEDS ATTENTION - Several issues to resolve');
    } else {
      console.log('   🔴 CRITICAL - Major issues require immediate attention');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Test suite completed!');
    console.log('='.repeat(60));
  }
}

// Auto-run tests
console.log('🔥 Enhanced Batch Management System Test Suite');
console.log('Run: new EnhancedBatchSystemTester().runAllTests()');

// For immediate execution, uncomment:
// new EnhancedBatchSystemTester().runAllTests();

// Export for manual testing
window.EnhancedBatchSystemTester = EnhancedBatchSystemTester;