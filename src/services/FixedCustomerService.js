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
    
    if (!customerId) {
      throw new Error('Customer ID is required for deletion');
    }
    
    try {
      // Step 1: Check which table structure we're using
      console.log('🔍 Detecting table structure...');
      const tableStructure = await this.detectTableStructure();
      console.log('📊 Table structure result:', tableStructure);
      
      if (tableStructure.hasCustomersTable) {
        console.log('📋 Using customers table for deletion');
        return await this.deleteFromCustomersTable(customerId);
      } else if (tableStructure.hasSalesTable) {
        console.log('💰 Using sales table for deletion');
        return await this.deleteFromSalesTable(customerId);
      } else {
        throw new Error('No customer data table found - neither customers nor sales table is accessible');
      }
      
    } catch (error) {
      console.error('❌ Fixed customer deletion failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
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
   * Delete from customers table using stored function
   */
  static async deleteFromCustomersTable(customerId) {
    console.log('🗑️ Deleting from customers table:', customerId);
    
    try {
      // First, try to find customer by ID to get the UUID
      let query = supabase.from('customers').select('id, customer_name, phone, email');
      
      // Try different ways to match the customer
      if (customerId && this.isValidUUID(customerId)) {
        // Already a UUID
        query = query.eq('id', customerId);
      } else if (customerId && customerId.includes('@')) {
        // Email address
        query = query.eq('email', customerId);
      } else if (customerId && customerId.startsWith('09')) {
        // Phone number
        query = query.eq('phone', customerId);
      } else {
        // Try name or other identifiers
        query = query.or(`customer_name.ilike.%${customerId}%,phone.eq.${customerId},email.eq.${customerId}`);
      }
      
      const { data: customers, error: fetchError } = await query;
      
      if (fetchError) {
        console.error('❌ Error fetching customer:', fetchError);
        throw new Error(`Failed to find customer: ${fetchError.message}`);
      }
      
      if (!customers || customers.length === 0) {
        throw new Error(`Customer not found with identifier: ${customerId}`);
      }
      
      const customer = customers[0]; // Take first match
      console.log('✅ Found customer for deletion:', customer);
      
      // Use stored function for safe deletion
      const { data: result, error: deleteError } = await supabase
        .rpc('delete_customer_safely', { customer_uuid: customer.id });
        
      if (deleteError) {
        console.error('❌ Error calling delete function:', deleteError);
        // Fallback to direct update if function doesn't exist
        return await this.fallbackDirectDelete(customer.id);
      }
      
      console.log('🗑️ Delete function result:', result);
      
      if (result && result.success) {
        console.log('✅ Customer deleted successfully using stored function');
        return true;
      } else {
        throw new Error(result?.error || 'Delete function returned failure');
      }
      
    } catch (error) {
      console.error('❌ Error in deleteFromCustomersTable:', error);
      
      // If it's a function not found error, try fallback
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        console.log('🔄 Stored function not found, trying fallback approach...');
        return await this.fallbackDirectDelete(customerId);
      }
      
      throw error;
    }
  }
  
  /**
   * Fallback direct delete method (for when stored function is not available)
   */
  static async fallbackDirectDelete(customerId) {
    console.log('🔄 Using fallback direct delete method');
    
    try {
      // Try to update directly with a more permissive approach
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          customer_name: '[DELETED CUSTOMER]',
          phone: null,
          email: null,
          address: null,
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);
        
      if (updateError) {
        console.error('❌ Fallback delete also failed:', updateError);
        throw new Error(`Both stored function and direct update failed: ${updateError.message}`);
      }
      
      console.log('✅ Customer anonymized using fallback method');
      return true;
      
    } catch (error) {
      console.error('❌ Fallback delete failed:', error);
      throw error;
    }
  }
  
  /**
   * Check if string is a valid UUID
   */
  static isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
  
  /**
   * Delete from sales table (anonymize customer data)
   */
  static async deleteFromSalesTable(customerId) {
    console.log('🗑️ Anonymizing customer data in sales table:', customerId);
    
    try {
      // Build flexible query to find customer data in sales
      let query = supabase.from('sales').select('*');
      
      if (customerId && customerId.includes('@')) {
        // Email
        query = query.eq('customer_email', customerId);
      } else if (customerId && customerId.startsWith('09')) {
        // Phone
        query = query.eq('customer_phone', customerId);
      } else {
        // Name or other identifier
        query = query.or(`customer_name.ilike.%${customerId}%,customer_phone.eq.${customerId},customer_email.eq.${customerId}`);
      }
      
      const { data: salesRecords, error: fetchError } = await query.limit(10);
        
      if (fetchError) {
        console.error('❌ Error fetching sales records:', fetchError);
        throw new Error(`Failed to find customer in sales: ${fetchError.message}`);
      }
      
      if (!salesRecords || salesRecords.length === 0) {
        throw new Error(`Customer not found in sales records with identifier: ${customerId}`);
      }
      
      console.log(`✅ Found ${salesRecords.length} sales records for customer`);
      
      // Get the customer info to anonymize
      const customerName = salesRecords[0].customer_name;
      const customerPhone = salesRecords[0].customer_phone;
      const customerEmail = salesRecords[0].customer_email;
      
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
        .or(`customer_name.eq.${customerName},customer_phone.eq.${customerPhone},customer_email.eq.${customerEmail}`);
        
      if (updateError) {
        console.error('❌ Error anonymizing sales records:', updateError);
        throw new Error(`Failed to anonymize customer data: ${updateError.message}`);
      }
      
      console.log('✅ Customer data anonymized in sales table');
      return true;
      
    } catch (error) {
      console.error('❌ Error in deleteFromSalesTable:', error);
      throw error;
    }
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