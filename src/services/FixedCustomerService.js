/**
 * FIXED Customer Deletion Service
 * Works with any database structure (customers table or sales table)
 */

import { supabase } from '../config/supabase';

export class FixedCustomerService {
  
  /**
   * Delete customer with automatic table detection
   * @param {string} customerId - Customer ID or identifier
   * @returns {Promise<boolean>} Success status
   */
  static async deleteCustomer(customerId) {
    console.log('🗑️ Fixed customer deletion started:', customerId);
    
    try {
      // Step 1: Check which table structure we're using
      const tableStructure = await this.detectTableStructure();
      
      if (tableStructure.hasCustomersTable) {
        return await this.deleteFromCustomersTable(customerId);
      } else if (tableStructure.hasSalesTable) {
        return await this.deleteFromSalesTable(customerId);
      } else {
        throw new Error('No customer data table found');
      }
      
    } catch (error) {
      console.error('❌ Fixed customer deletion failed:', error);
      throw error;
    }
  }
  
  /**
   * Detect available table structure
   */
  static async detectTableStructure() {
    const structure = {
      hasCustomersTable: false,
      hasSalesTable: false
    };
    
    try {
      // Test customers table
      const { error: customersError } = await supabase
        .from('customers')
        .select('id')
        .limit(1);
        
      structure.hasCustomersTable = !customersError;
      
      // Test sales table
      const { error: salesError } = await supabase
        .from('sales')
        .select('id')
        .limit(1);
        
      structure.hasSalesTable = !salesError;
      
      console.log('📊 Table structure detected:', structure);
      return structure;
      
    } catch (error) {
      console.warn('⚠️ Error detecting table structure:', error);
      return structure;
    }
  }
  
  /**
   * Delete from customers table
   */
  static async deleteFromCustomersTable(customerId) {
    console.log('🗑️ Deleting from customers table:', customerId);
    
    // Check if customer exists
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
      
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('Customer not found');
      }
      throw fetchError;
    }
    
    // Soft delete
    const { error: deleteError } = await supabase
      .from('customers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);
      
    if (deleteError) {
      throw deleteError;
    }
    
    console.log('✅ Customer soft deleted from customers table');
    return true;
  }
  
  /**
   * Delete from sales table (anonymize customer data)
   */
  static async deleteFromSalesTable(customerId) {
    console.log('🗑️ Anonymizing customer data in sales table:', customerId);
    
    // Find customer data in sales
    const { data: salesRecords, error: fetchError } = await supabase
      .from('sales')
      .select('*')
      .or(`id.eq.${customerId},customer_name.ilike.%${customerId}%,customer_phone.eq.${customerId}`)
      .limit(10);
      
    if (fetchError) {
      throw fetchError;
    }
    
    if (!salesRecords || salesRecords.length === 0) {
      throw new Error('Customer not found in sales records');
    }
    
    // Get the customer info to anonymize
    const customerName = salesRecords[0].customer_name;
    const customerPhone = salesRecords[0].customer_phone;
    
    // Anonymize all records for this customer
    const { error: updateError } = await supabase
      .from('sales')
      .update({
        customer_name: '[DELETED CUSTOMER]',
        customer_phone: null,
        customer_email: null,
        customer_address: null,
        notes: `Original: ${customerName} - Deleted on ${new Date().toISOString()}`
      })
      .or(`customer_name.eq.${customerName},customer_phone.eq.${customerPhone}`);
      
    if (updateError) {
      throw updateError;
    }
    
    console.log('✅ Customer data anonymized in sales table');
    return true;
  }
  
  /**
   * Test customer deletion without actually deleting
   */
  static async testDeletion(customerId) {
    console.log('🧪 Testing customer deletion:', customerId);
    
    try {
      const structure = await this.detectTableStructure();
      console.log('📊 Will use structure:', structure);
      
      if (structure.hasCustomersTable) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId);
          
        console.log('🔍 Customer table test:', { data, error });
      }
      
      if (structure.hasSalesTable) {
        const { data, error } = await supabase
          .from('sales')
          .select('customer_name, customer_phone')
          .or(`id.eq.${customerId},customer_name.ilike.%${customerId}%`)
          .limit(5);
          
        console.log('🔍 Sales table test:', { data, error });
      }
      
      return { success: true, structure };
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  window.FixedCustomerService = FixedCustomerService;
  
  window.testCustomerDeletion = async (customerId) => {
    console.log('🧪 Testing customer deletion:', customerId);
    const result = await FixedCustomerService.testDeletion(customerId);
    console.log('🧪 Test result:', result);
    return result;
  };
  
  window.fixedDeleteCustomer = async (customerId) => {
    console.log('🗑️ Running fixed customer deletion:', customerId);
    try {
      const result = await FixedCustomerService.deleteCustomer(customerId);
      console.log('✅ Fixed deletion successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Fixed deletion failed:', error);
      return { success: false, error: error.message };
    }
  };
}

export default FixedCustomerService;

console.log('🔧 Fixed Customer Service loaded!');
console.log('Available functions:');
console.log('  • testCustomerDeletion(customerId)');
console.log('  • fixedDeleteCustomer(customerId)');