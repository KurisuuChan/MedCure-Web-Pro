// Simple CSV validation test
import { CSVImportService } from './src/services/domains/inventory/csvImportService.js';
import fs from 'fs';

async function testCSV() {
  try {
    // Read the corrected CSV file
    const csvContent = fs.readFileSync('./corrected_import_template.csv', 'utf8');
    console.log('📄 CSV Content loaded');
    
    // Parse CSV
    const parsedData = CSVImportService.parseCSV(csvContent);
    console.log('✅ CSV Parsed successfully');
    console.log('📊 Parsed rows:', parsedData.length);
    console.log('🔍 First row:', parsedData[0]);
    
    // Validate data
    const validationResult = await CSVImportService.validateData(parsedData);
    console.log('📋 Validation Result:');
    console.log('- Valid rows:', validationResult.validRows);
    console.log('- Error rows:', validationResult.errorRows);
    
    if (validationResult.validationErrors.length > 0) {
      console.log('❌ Validation Errors:');
      validationResult.validationErrors.forEach(error => {
        console.log('  -', error);
      });
    } else {
      console.log('✅ All rows are valid!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testCSV();