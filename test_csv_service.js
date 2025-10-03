// Quick test to verify CSV import functionality
import { CSVImportService } from './src/services/domains/inventory/csvImportService.js';

console.log('🧪 Testing CSV Import Service...');

// Test 1: Sample CSV generation
console.log('📄 Testing sample CSV generation...');
try {
  const sampleCSV = CSVImportService.generateSampleCSV();
  console.log('✅ Sample CSV generated successfully');
  console.log('First line:', sampleCSV.split('\n')[0]);
} catch (error) {
  console.error('❌ Sample CSV generation failed:', error);
}

// Test 2: Field mapping
console.log('🗺️ Testing field mappings...');
try {
  const testHeaders = ['Product Name', 'generic_name', 'Brand', 'brand_name'];
  const normalized = CSVImportService.normalizeHeaders(testHeaders);
  console.log('✅ Field mapping works:', normalized);
} catch (error) {
  console.error('❌ Field mapping failed:', error);
}

// Test 3: Validation
console.log('✔️ Testing validation...');
try {
  const testData = [{
    generic_name: 'Test Medicine',
    category_name: 'Test Category',
    price_per_piece: '2.50'
  }];
  const result = CSVImportService.validateData(testData);
  console.log('✅ Validation works:', result.validRows, 'valid rows');
} catch (error) {
  console.error('❌ Validation failed:', error);
}

console.log('🎯 CSV Import Service test complete!');