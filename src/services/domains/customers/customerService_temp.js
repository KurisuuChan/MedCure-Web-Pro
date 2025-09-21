import { supabase } from '../../../config/supabase';

/**
 * Customer Service - Temporary implementation using sales table
 * This works with existing schema until customers table is created
 */
export class CustomerService {
  /**
   * Create a new customer (stores in sales table for now)
   * @param {Object} customerData - Customer information
   * @param {string} createdBy - User ID who created the customer
   * @returns {Promise<Object>} Created customer object
   */
  static async createCustomer(customerData, createdBy) {
    try {
      console.log('🔍 [CustomerService] Creating customer (temp implementation):', customerData);

      // For now, we'll just return the customer data with a generated ID
      // The actual customer will be saved when they make their first purchase
      const tempCustomer = {
        id: crypto.randomUUID(),
        customer_name: customerData.customer_name,
        phone: customerData.phone,
        email: customerData.email || null,
        address: customerData.address || null,
        notes: customerData.notes || null,
        created_by: createdBy,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_purchase_date: null,
        total_purchases: 0,
      };

      console.log('✅ [CustomerService] Temporary customer created:', tempCustomer);
      return tempCustomer;
    } catch (error) {
      console.error('❌ [CustomerService] Failed to create customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Get all customers from sales history
   * @returns {Promise<Array>} Array of customer objects
   */
  static async getAllCustomers() {
    try {
      console.log('🔍 [CustomerService] Fetching customers from sales data');

      const { data, error } = await supabase
        .from('sales')
        .select('customer_name, customer_phone, customer_email, created_at, total_amount')
        .not('customer_name', 'is', null)
        .neq('customer_name', '');

      if (error) {
        console.error('❌ [CustomerService] Error fetching customers:', error);
        throw error;
      }

      // Group by customer and aggregate data
      const customerMap = new Map();
      
      data.forEach(sale => {
        const key = `${sale.customer_name}-${sale.customer_phone}`;
        if (customerMap.has(key)) {
          const existing = customerMap.get(key);
          existing.total_purchases += sale.total_amount || 0;
          if (new Date(sale.created_at) > new Date(existing.last_purchase_date)) {
            existing.last_purchase_date = sale.created_at;
          }
        } else {
          customerMap.set(key, {
            id: crypto.randomUUID(),
            customer_name: sale.customer_name,
            phone: sale.customer_phone,
            email: sale.customer_email,
            is_active: true,
            created_at: sale.created_at,
            last_purchase_date: sale.created_at,
            total_purchases: sale.total_amount || 0,
          });
        }
      });

      const customers = Array.from(customerMap.values())
        .sort((a, b) => a.customer_name.localeCompare(b.customer_name));

      console.log(`✅ [CustomerService] Fetched ${customers.length} customers from sales data`);
      return customers;
    } catch (error) {
      console.error('❌ [CustomerService] Failed to fetch customers:', error);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  }

  /**
   * Search customers by name or phone from sales data
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching customers
   */
  static async searchCustomers(query) {
    try {
      console.log('🔍 [CustomerService] Searching customers:', query);

      const { data, error } = await supabase
        .from('sales')
        .select('customer_name, customer_phone, customer_email, created_at, total_amount')
        .not('customer_name', 'is', null)
        .neq('customer_name', '')
        .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`);

      if (error) {
        console.error('❌ [CustomerService] Error searching customers:', error);
        throw error;
      }

      // Group and deduplicate results
      const customerMap = new Map();
      
      data.forEach(sale => {
        const key = `${sale.customer_name}-${sale.customer_phone}`;
        if (customerMap.has(key)) {
          const existing = customerMap.get(key);
          existing.total_purchases += sale.total_amount || 0;
          if (new Date(sale.created_at) > new Date(existing.last_purchase_date)) {
            existing.last_purchase_date = sale.created_at;
          }
        } else {
          customerMap.set(key, {
            id: crypto.randomUUID(),
            customer_name: sale.customer_name,
            phone: sale.customer_phone,
            email: sale.customer_email,
            is_active: true,
            created_at: sale.created_at,
            last_purchase_date: sale.created_at,
            total_purchases: sale.total_amount || 0,
          });
        }
      });

      const customers = Array.from(customerMap.values())
        .sort((a, b) => a.customer_name.localeCompare(b.customer_name))
        .slice(0, 20);

      console.log(`✅ [CustomerService] Found ${customers.length} customers`);
      return customers;
    } catch (error) {
      console.error('❌ [CustomerService] Failed to search customers:', error);
      return [];
    }
  }

  /**
   * Get customer by ID (temporary implementation)
   * @param {string} customerId - Customer UUID
   * @returns {Promise<Object|null>} Customer object or null
   */
  static async getCustomerById(customerId) {
    try {
      console.log('🔍 [CustomerService] Fetching customer by ID (temp):', customerId);
      // For temporary implementation, return null as we can't lookup by temp ID
      return null;
    } catch (error) {
      console.error('❌ [CustomerService] Failed to fetch customer:', error);
      return null;
    }
  }

  /**
   * Update customer (not implemented in temp version)
   */
  static async updateCustomer(customerId, updateData) {
    console.log('⚠️ [CustomerService] Update not available in temp implementation');
    return null;
  }

  /**
   * Update customer's purchase info (not needed in temp version)
   */
  static async updateCustomerPurchase(customerId, purchaseAmount) {
    console.log('⚠️ [CustomerService] Purchase update not needed in temp implementation');
    return null;
  }

  /**
   * Deactivate customer (not implemented in temp version)
   */
  static async deactivateCustomer(customerId) {
    console.log('⚠️ [CustomerService] Deactivate not available in temp implementation');
    return null;
  }
}