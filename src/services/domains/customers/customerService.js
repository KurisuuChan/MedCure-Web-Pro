import { supabase } from '../../../config/supabase';

/**
 * Customer Service - Works with existing sales table schema
 */
export class CustomerService {
  /**
   * Create a new customer and save permanently
   * @param {Object} customerData - Customer information
   * @param {string} customerData.customer_name - Customer name
   * @param {string} customerData.phone - Customer phone
   * @param {string} customerData.email - Customer email (optional)
   * @param {string} customerData.address - Customer address (optional)
   * @param {string} createdBy - User ID who created the customer
   * @returns {Promise<Object>} Customer object for immediate use
   */
  static async createCustomer(customerData, createdBy) {
    try {
      console.log('🔍 [CustomerService] Creating and saving customer permanently:', customerData);

      const customer = {
        id: crypto.randomUUID(),
        customer_name: customerData.customer_name,
        phone: customerData.phone,
        email: customerData.email || null,
        address: customerData.address || null,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        is_new: true,
      };

      // Save customer to localStorage for persistence
      await this.saveCustomerToStorage(customer);

      // Also create a "customer registration" entry in sales table with $0 amount
      // This ensures the customer appears in sales-based searches immediately
      try {
        const { error } = await supabase
          .from('sales')
          .insert([{
            user_id: createdBy,
            total_amount: 0,
            payment_method: 'registration',
            status: 'completed',
            notes: 'Customer registration entry',
            customer_name: customerData.customer_name,
            customer_phone: customerData.phone,
            customer_email: customerData.email,
          }]);

        if (error) {
          console.warn('⚠️ Failed to create registration entry:', error);
          // Don't throw error, customer is still saved in localStorage
        }
      } catch (regError) {
        console.warn('⚠️ Registration entry failed:', regError);
      }

      console.log('✅ [CustomerService] Customer saved permanently:', customer);
      return customer;
    } catch (error) {
      console.error('❌ [CustomerService] Failed to create customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Save customer to localStorage for permanent storage
   * @param {Object} customer - Customer object
   */
  static async saveCustomerToStorage(customer) {
    try {
      const existingCustomers = this.getCustomersFromStorage();
      const customerKey = `${customer.customer_name.toLowerCase()}-${(customer.phone || '').toLowerCase()}`;
      
      // Check if customer already exists
      const existingIndex = existingCustomers.findIndex(c => 
        `${c.customer_name.toLowerCase()}-${(c.phone || '').toLowerCase()}` === customerKey
      );

      if (existingIndex >= 0) {
        // Update existing customer
        existingCustomers[existingIndex] = { ...existingCustomers[existingIndex], ...customer };
      } else {
        // Add new customer
        existingCustomers.push(customer);
      }

      localStorage.setItem('medcure_customers', JSON.stringify(existingCustomers));
      console.log('✅ Customer saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save customer to storage:', error);
    }
  }

  /**
   * Get customers from localStorage
   * @returns {Array} Array of stored customers
   */
  static getCustomersFromStorage() {
    try {
      const stored = localStorage.getItem('medcure_customers');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load customers from storage:', error);
      return [];
    }
  }

  /**
   * Get all customers from both localStorage and sales history
   * @returns {Promise<Array>} Array of unique customer objects
   */
  static async getAllCustomers() {
    try {
      console.log('🔍 [CustomerService] Fetching customers from storage and sales table');

      // Get customers from localStorage first
      const storedCustomers = this.getCustomersFromStorage();
      
      // Get customers from sales history
      const { data, error } = await supabase
        .from('sales')
        .select('customer_name, customer_phone, customer_email, created_at, total_amount')
        .not('customer_name', 'is', null)
        .neq('customer_name', '')
        .neq('payment_method', 'registration') // Exclude registration entries
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [CustomerService] Error fetching customers:', error);
        throw error;
      }

      // Combine and deduplicate customers
      const customerMap = new Map();
      
      // Add stored customers first (they have complete data including address)
      storedCustomers.forEach(customer => {
        const key = `${customer.customer_name.toLowerCase()}-${(customer.phone || '').toLowerCase()}`;
        customerMap.set(key, {
          ...customer,
          total_purchases: 0,
          purchase_count: 0,
          last_purchase_date: null,
        });
      });
      
      // Add/update with sales data
      data?.forEach(sale => {
        const key = `${sale.customer_name.toLowerCase()}-${(sale.customer_phone || '').toLowerCase()}`;
        
        if (customerMap.has(key)) {
          const existing = customerMap.get(key);
          existing.total_purchases += sale.total_amount || 0;
          existing.purchase_count += 1;
          if (!existing.last_purchase_date || new Date(sale.created_at) > new Date(existing.last_purchase_date)) {
            existing.last_purchase_date = sale.created_at;
          }
          // Update email if not present
          if (!existing.email && sale.customer_email) {
            existing.email = sale.customer_email;
          }
        } else {
          customerMap.set(key, {
            id: crypto.randomUUID(),
            customer_name: sale.customer_name,
            phone: sale.customer_phone,
            email: sale.customer_email,
            address: null, // No address in sales table
            created_at: sale.created_at,
            last_purchase_date: sale.created_at,
            total_purchases: sale.total_amount || 0,
            purchase_count: 1,
          });
        }
      });

      const customers = Array.from(customerMap.values())
        .sort((a, b) => a.customer_name.localeCompare(b.customer_name));

      console.log(`✅ [CustomerService] Fetched ${customers.length} unique customers (${storedCustomers.length} stored + sales data)`);
      return customers;
    } catch (error) {
      console.error('❌ [CustomerService] Failed to fetch customers:', error);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  }

  /**
   * Get customer by name and phone (using existing schema)
   * @param {string} customerName - Customer name
   * @param {string} customerPhone - Customer phone
   * @returns {Promise<Object|null>} Customer object or null
   */
  static async getCustomerByNamePhone(customerName, customerPhone) {
    try {
      console.log('🔍 [CustomerService] Fetching customer by name/phone:', customerName, customerPhone);

      const { data, error } = await supabase
        .from('sales')
        .select('customer_name, customer_phone, customer_email, created_at, total_amount')
        .eq('customer_name', customerName)
        .eq('customer_phone', customerPhone || '')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [CustomerService] Error fetching customer:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Aggregate customer data from sales history
      const totalPurchases = data.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const customer = {
        id: crypto.randomUUID(),
        customer_name: data[0].customer_name,
        phone: data[0].customer_phone,
        email: data[0].customer_email,
        created_at: data[data.length - 1].created_at, // First purchase
        last_purchase_date: data[0].created_at, // Latest purchase
        total_purchases: totalPurchases,
        purchase_count: data.length,
      };

      console.log('✅ [CustomerService] Customer fetched:', customer);
      return customer;
    } catch (error) {
      console.error('❌ [CustomerService] Failed to fetch customer:', error);
      return null;
    }
  }

  /**
   * Search customers by name or phone in both storage and sales
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching customers
   */
  static async searchCustomers(query) {
    try {
      console.log('🔍 [CustomerService] Searching customers in storage and sales:', query);

      const queryLower = query.toLowerCase();
      
      // Get stored customers first
      const storedCustomers = this.getCustomersFromStorage();
      
      // Get customers from sales history  
      const { data, error } = await supabase
        .from('sales')
        .select('customer_name, customer_phone, customer_email, created_at, total_amount')
        .not('customer_name', 'is', null)
        .neq('customer_name', '')
        .neq('payment_method', 'registration')
        .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ [CustomerService] Error searching customers:', error);
        throw error;
      }

      // Combine and deduplicate results
      const customerMap = new Map();
      
      // Add matching stored customers first
      storedCustomers
        .filter(customer => 
          customer.customer_name.toLowerCase().includes(queryLower) ||
          (customer.phone && customer.phone.toLowerCase().includes(queryLower))
        )
        .forEach(customer => {
          const key = `${customer.customer_name.toLowerCase()}-${(customer.phone || '').toLowerCase()}`;
          customerMap.set(key, {
            ...customer,
            total_purchases: 0,
            purchase_count: 0,
            last_purchase_date: null,
          });
        });
      
      // Add/update with sales data
      data?.forEach(sale => {
        const key = `${sale.customer_name.toLowerCase()}-${(sale.customer_phone || '').toLowerCase()}`;
        
        if (customerMap.has(key)) {
          const existing = customerMap.get(key);
          existing.total_purchases += sale.total_amount || 0;
          existing.purchase_count += 1;
          if (!existing.last_purchase_date || new Date(sale.created_at) > new Date(existing.last_purchase_date)) {
            existing.last_purchase_date = sale.created_at;
          }
        } else {
          customerMap.set(key, {
            id: crypto.randomUUID(),
            customer_name: sale.customer_name,
            phone: sale.customer_phone,
            email: sale.customer_email,
            address: null,
            created_at: sale.created_at,
            last_purchase_date: sale.created_at,
            total_purchases: sale.total_amount || 0,
            purchase_count: 1,
          });
        }
      });

      const customers = Array.from(customerMap.values())
        .sort((a, b) => {
          // Prioritize customers with addresses (stored customers)
          if (a.address && !b.address) return -1;
          if (!a.address && b.address) return 1;
          // Then sort by last purchase date
          if (a.last_purchase_date && b.last_purchase_date) {
            return new Date(b.last_purchase_date) - new Date(a.last_purchase_date);
          }
          return a.customer_name.localeCompare(b.customer_name);
        })
        .slice(0, 20);

      console.log(`✅ [CustomerService] Found ${customers.length} matching customers`);
      return customers;
    } catch (error) {
      console.error('❌ [CustomerService] Failed to search customers:', error);
      return [];
    }
  }

  /**
   * Update customer information (not applicable with existing schema)
   * Customer data is stored in sales table
   */
  static async updateCustomer(customerId, updateData) {
    console.log('ℹ️ [CustomerService] Customer updates are handled through sales records in existing schema');
    return null;
  }

  /**
   * Update customer's purchase info (handled automatically through sales table)
   * @param {string} customerId - Customer UUID (not used in existing schema)
   * @param {number} purchaseAmount - Amount of the purchase
   * @returns {Promise<Object>} Success indicator
   */
  static async updateCustomerPurchase(customerId, purchaseAmount) {
    try {
      console.log('ℹ️ [CustomerService] Purchase tracking handled automatically through sales table');
      // In existing schema, customer purchase history is automatically tracked
      // through the sales table when transactions are created
      return { success: true, message: 'Purchase tracked in sales table' };
    } catch (error) {
      console.error('❌ [CustomerService] Failed to update customer purchase:', error);
      return null;
    }
  }

  /**
   * Get customer by ID (legacy method for compatibility)
   * @param {string} customerId - Customer UUID
   * @returns {Promise<Object|null>} Always returns null in existing schema
   */
  static async getCustomerById(customerId) {
    console.log('ℹ️ [CustomerService] Use getCustomerByNamePhone instead with existing schema');
    return null;
  }

  /**
   * Deactivate customer (not applicable with existing schema)
   */
  static async deactivateCustomer(customerId) {
    console.log('ℹ️ [CustomerService] Customer deactivation not available with existing schema');
    return null;
  }
}