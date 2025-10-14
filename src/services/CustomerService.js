import { supabase } from '../config/supabase';

// CustomerService.js - Comprehensive customer management for MedCure POS
// Handles customer CRUD operations with Supabase                 console.log(`  ✅ Name Match: ${txn.id} -> ${customer.customer_name}`);atabase persistence

export class CustomerService {
  
  /**
   * Create a new customer in database or return existing one
   * @param {Object} customerData - Customer information
   * @param {string} customerData.customer_name - Customer name
   * @param {string} customerData.phone - Customer phone
   * @param {string} [customerData.email] - Customer email (optional)
   * @param {string} [customerData.address] - Customer address (optional)
   * @returns {Promise<Object>} Created or existing customer
   */
  static async createCustomer(customerData) {
    try {
      console.log('🔍 [DEBUG] CustomerService.createCustomer called with:', customerData);
      
      // Enhanced validation
      if (!customerData.customer_name || !customerData.phone) {
        console.error('🔍 [DEBUG] Validation failed - missing name or phone:', { 
          customer_name: customerData.customer_name, 
          phone: customerData.phone 
        });
        throw new Error('Customer name and phone are required');
      }

      if (customerData.phone.length < 10) {
        console.error('🔍 [DEBUG] Validation failed - phone too short:', customerData.phone);
        throw new Error('Phone number must be at least 10 digits');
      }

      // Check for existing customer with same phone number
      const { data: existingCustomers, error: searchError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customerData.phone.trim())
        .eq('is_active', true)
        .limit(1);

      if (searchError) {
        console.error('❌ Error searching for existing customer:', searchError);
        throw new Error('Failed to check for existing customer');
      }

      if (existingCustomers && existingCustomers.length > 0) {
        console.log('✅ Returning existing customer:', existingCustomers[0]);
        console.log('🔍 [DEBUG] Existing customer ID:', existingCustomers[0].id);
        return existingCustomers[0];
      }

      // Create new customer in database
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([
          {
            customer_name: customerData.customer_name.trim(),
            phone: customerData.phone.trim(),
            email: customerData.email?.trim() || null,
            address: customerData.address?.trim() || null,
            total_purchases: 0,
            is_active: true
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating customer:', createError);
        throw new Error(`Failed to create customer: ${createError.message}`);
      }

      console.log('✅ Customer created successfully in database:', newCustomer);
      console.log('🔍 [DEBUG] New customer ID:', newCustomer.id);
      console.log('🔍 [DEBUG] New customer object keys:', Object.keys(newCustomer));
      return newCustomer;
    } catch (error) {
      console.error('❌ Error in createCustomer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Get all active customers from database with transaction statistics
   * @returns {Promise<Array>} Array of customer objects with purchase stats
   */
  static async getAllCustomers() {
    try {
      // First get all customers
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (customerError) {
        console.error('❌ Error fetching customers:', customerError);
        throw new Error(`Failed to fetch customers: ${customerError.message}`);
      }

      console.log(`✅ Retrieved ${customers?.length || 0} customers from database`);
      
      // If no customers, return empty array
      if (!customers || customers.length === 0) {
        return [];
      }

      // Now get transaction statistics for each customer
      console.log('📊 Calculating customer transaction statistics...');
      
      try {
        // Get ALL transactions first (same approach as CustomerInformationPage)
        const { data: allTransactions, error: statsError } = await supabase
          .from('sales')
          .select('*')
          .not('status', 'eq', 'cancelled')
          .not('customer_name', 'eq', '[DELETED CUSTOMER]')
          .not('customer_name', 'is', null)
          .order('created_at', { ascending: false });

        if (statsError) {
          console.warn('⚠️ Could not fetch transactions:', statsError);
        } else {
          console.log(`📈 Found ${allTransactions?.length || 0} total transactions to analyze`);
        }

        // Calculate statistics for each customer using the same logic as CustomerInformationPage
        const customersWithStats = customers.map(customer => {
          console.log(`\n🔍 Calculating stats for: ${customer.customer_name} (ID: ${customer.id}, Phone: ${customer.phone})`);
          
          // Filter transactions for this customer using the same logic as fetchCustomerTransactions
          const customerTransactions = (allTransactions || []).filter(txn => {
            if (!txn) return false;
            
            // Skip deleted customer transactions
            if (txn.customer_name === '[DELETED CUSTOMER]' || !txn.customer_name) {
              return false;
            }
            
            // Strategy 1: Customer ID match (most reliable if available)
            if (txn.customer_id && customer.id && txn.customer_id === customer.id) {
              console.log(`  ✅ ID Match: ${txn.id} -> ${customer.customer_name}`);
              return true;
            }
            
            // Strategy 2: Phone number match (normalize and compare)
            if (txn.customer_phone && customer.phone) {
              const normalizePhone = (phone) => {
                if (!phone) return '';
                return phone.toString().replace(/[^\d]/g, ''); // Remove all non-digits
              };
              
              const txnPhone = normalizePhone(txn.customer_phone);
              const customerPhone = normalizePhone(customer.phone);
              
              if (txnPhone && customerPhone && txnPhone.length >= 10 && customerPhone.length >= 10) {
                // Compare last 10 digits (handles country codes)
                const txnLast10 = txnPhone.slice(-10);
                const customerLast10 = customerPhone.slice(-10);
                
                if (txnLast10 === customerLast10) {
                  console.log(`  ✅ Phone Match: ${txn.id} -> ${customer.customer_name} (${txnLast10})`);
                  return true;
                }
              }
            }
            
            // Strategy 3: Exact name match (case insensitive)
            if (txn.customer_name && customer.customer_name) {
              const txnName = txn.customer_name.toString().toLowerCase().trim();
              const customerName = customer.customer_name.toString().toLowerCase().trim();
              
              if (txnName === customerName) {
                console.log(`  ✅ Name Match: ${txn.id} -> ${customer.customer_name}`);
                return true;
              }
            }
            
            // Strategy 4: Fuzzy name match (for slight variations)
            if (txn.customer_name && customer.customer_name) {
              const txnName = txn.customer_name.toString().toLowerCase().trim();
              const customerName = customer.customer_name.toString().toLowerCase().trim();
              
              // Check if names are similar (one contains the other)
              if (txnName.includes(customerName) || customerName.includes(txnName)) {
                // Only accept fuzzy match if phone is also empty or matches
                const txnPhone = txn.customer_phone ? txn.customer_phone.toString().trim() : '';
                const customerPhone = customer.phone ? customer.phone.toString().trim() : '';
                
                if (!txnPhone && !customerPhone) {
                  return true;
                }
              }
            }
            
            return false;
          });
          
          // Calculate statistics from matched transactions
          const purchase_count = customerTransactions.length;
          const total_purchases = customerTransactions.reduce((sum, txn) => 
            sum + (parseFloat(txn.total_amount) || 0), 0
          );
          const last_purchase_date = customerTransactions.length > 0 
            ? customerTransactions[0].created_at // Already sorted by created_at desc
            : null;
          
          console.log(`📊 Stats for ${customer.customer_name}: ${purchase_count} orders, ₱${total_purchases.toLocaleString()}`);
          
          // Extra debug for zero matches
          if (purchase_count === 0) {
            console.log(`  ⚠️ No matches found for ${customer.customer_name}`);
            console.log(`  📝 Customer data: ID=${customer.id}, Phone=${customer.phone}`);
            console.log(`  📊 Available transactions sample:`, 
              allTransactions.slice(0, 3).map(t => ({
                id: t.id,
                customer_id: t.customer_id,
                customer_name: t.customer_name,
                customer_phone: t.customer_phone
              }))
            );
          }
          
          // Return customer with calculated stats
          return {
            ...customer,
            purchase_count,
            total_purchases,
            last_purchase_date
          };
        });

        console.log(`✅ Enriched ${customersWithStats.length} customers with transaction statistics`);
        return customersWithStats;
        
      } catch (statsError) {
        console.warn('⚠️ Failed to calculate transaction stats, returning customers without stats:', statsError);
        // Return customers with zero stats if transaction calculation fails
        return customers.map(customer => ({
          ...customer,
          purchase_count: 0,
          total_purchases: 0,
          last_purchase_date: null
        }));
      }

    } catch (error) {
      console.error('❌ Error getting customers:', error);
      return [];
    }
  }

  /**
   * Search customers by name or phone in database
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Filtered customer array
   */
  static async searchCustomers(searchTerm) {
    try {
      const term = searchTerm?.toLowerCase().trim();
      
      if (!term) {
        return await this.getAllCustomers();
      }

      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .or(`customer_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error searching customers:', error);
        throw new Error(`Failed to search customers: ${error.message}`);
      }

      console.log(`✅ Found ${customers?.length || 0} customers matching "${term}"`);
      return customers || [];
    } catch (error) {
      console.error('❌ Error searching customers:', error);
      return [];
    }
  }

  /**
   * Get customer by ID from database
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object|null>} Customer object or null if not found
   */
  static async getCustomerById(customerId) {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          console.log(`ℹ️ Customer not found with ID: ${customerId}`);
          return null;
        }
        console.error('❌ Error fetching customer by ID:', error);
        throw new Error(`Failed to fetch customer: ${error.message}`);
      }

      console.log('✅ Customer found by ID:', customer);
      return customer;
    } catch (error) {
      console.error('❌ Error getting customer by ID:', error);
      return null;
    }
  }

  /**
   * Update customer information in database
   * @param {string} customerId - Customer ID
   * @param {Object} updateData - Updated customer data
   * @returns {Promise<Object|null>} Updated customer or null if not found
   */
  static async updateCustomer(customerId, updateData) {
    try {
      const { data: updatedCustomer, error } = await supabase
        .from('customers')
        .update({
          customer_name: updateData.customer_name?.trim(),
          phone: updateData.phone?.trim(),
          email: updateData.email?.trim() || null,
          address: updateData.address?.trim() || null,
          notes: updateData.notes?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating customer:', error);
        throw new Error(`Failed to update customer: ${error.message}`);
      }

      if (!updatedCustomer) {
        throw new Error('Customer not found');
      }
      
      console.log('✅ Customer updated successfully in database:', updatedCustomer);
      return updatedCustomer;
    } catch (error) {
      console.error('❌ Error updating customer:', error);
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  /**
   * Update customer purchase statistics in database
   * @param {string} customerPhone - Customer phone number
   * @param {number} purchaseAmount - Purchase amount to add
   * @returns {Promise<Object|null>} Updated customer or null if not found
   */
  static async updateCustomerPurchaseStats(customerPhone, purchaseAmount) {
    try {
      // First get the current customer data
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customerPhone)
        .eq('is_active', true)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log(`ℹ️ Customer with phone ${customerPhone} not found for purchase tracking`);
          return null;
        }
        throw fetchError;
      }

      // Update purchase statistics
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({
          total_purchases: (customer.total_purchases || 0) + purchaseAmount,
          last_purchase_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating customer purchase stats:', updateError);
        throw updateError;
      }
      
      console.log('✅ Customer purchase stats updated in database:', updatedCustomer);
      return updatedCustomer;
    } catch (error) {
      console.error('❌ Error updating customer purchase stats:', error);
      return null;
    }
  }

  /**
   * Delete customer (soft delete) and clean up their transaction references
   * @param {string} customerId - Customer ID
   * @param {boolean} cleanupTransactions - Whether to clean up transaction references (default: true)
   * @returns {Promise<boolean>} Success status
   */
  static async deleteCustomer(customerId, cleanupTransactions = true) {
    console.log('🗑️ Starting customer deletion process:', customerId);
    
    try {
      // Check if customers table exists, if not use sales table approach
      let customerToDelete = null;
      let useCustomersTable = true;
      
      // Try customers table first
      const { data: customerData, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('is_active', true)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST301' || fetchError.message.includes('does not exist')) {
          console.log('📊 Customers table does not exist, using sales table approach');
          useCustomersTable = false;
          
          // Get customer info from sales table
          const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select('customer_name, customer_phone, customer_email, customer_address')
            .eq('id', customerId) // Assuming customerId might be a sales record ID
            .single();
            
          if (salesError && salesError.code === 'PGRST116') {
            // Try to find customer by other means
            const { data: customerFromSales, error: altError } = await supabase
              .from('sales')
              .select('customer_name, customer_phone, customer_email, customer_address')
              .or(`customer_name.eq.${customerId},customer_phone.eq.${customerId}`)
              .limit(1)
              .single();
              
            if (altError) {
              throw new Error('Customer not found in sales records');
            }
            customerToDelete = customerFromSales;
          } else if (salesError) {
            throw salesError;
          } else {
            customerToDelete = salesData;
          }
        } else if (fetchError.code === 'PGRST116') {
          throw new Error('Customer not found');
        } else {
          throw fetchError;
        }
      } else {
        customerToDelete = customerData;
      }

      console.log('🎯 Customer to delete:', customerToDelete);

      // Perform deletion based on table structure
      if (useCustomersTable) {
        // Use customers table
        const { error: deleteError } = await supabase
          .from('customers')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId);

        if (deleteError) {
          console.error('❌ Error deleting from customers table:', deleteError);
          throw deleteError;
        }
        
        console.log('✅ Customer deleted from customers table');
      } else {
        // Use sales table approach - mark customer data as deleted
        if (customerToDelete?.customer_name) {
          const { error: updateError } = await supabase
            .from('sales')
            .update({
              customer_name: '[DELETED CUSTOMER]',
              customer_phone: null,
              customer_email: null,
              customer_address: null,
              notes: `Original customer: ${customerToDelete.customer_name} deleted on ${new Date().toISOString()}`
            })
            .or(`customer_name.eq.${customerToDelete.customer_name},customer_phone.eq.${customerToDelete.customer_phone}`);

          if (updateError) {
            console.error('❌ Error updating sales records:', updateError);
            throw updateError;
          }
          
          console.log('✅ Customer data anonymized in sales table');
        }
      }

      // If cleanup is requested, mark transactions for deletion in database
      if (cleanupTransactions && customerToDelete.phone) {
        try {
          // Update transactions to mark customer as deleted
          const { error: updateError } = await supabase
            .from('sales')
            .update({ 
              customer_name: '[DELETED CUSTOMER]',
              customer_phone: null,
              customer_address: null,
              notes: `Original customer: ${customerToDelete.customer_name} deleted on ${new Date().toISOString()}`
            })
            .eq('customer_phone', customerToDelete.phone);

          if (updateError) {
            console.warn('⚠️ Could not update transaction references:', updateError);
          } else {
            console.log('✅ Customer transaction references cleaned up');
          }
        } catch (dbError) {
          console.warn('⚠️ Database cleanup failed:', dbError);
        }
      }
      
      console.log('✅ Customer deleted successfully from database with cleanup');
      return true;
    } catch (error) {
      console.error('❌ Error deleting customer:', error);
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  /**
   * Clear all customers (soft delete all active customers)
   * @returns {Promise<boolean>} Success status
   */
  static async clearAllCustomers() {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error clearing customers:', error);
        throw error;
      }
      
      console.log('✅ All customers cleared successfully from database');
      return true;
    } catch (error) {
      console.error('❌ Error clearing customers:', error);
      return false;
    }
  }

  /**
   * Get customer by name and phone (for checkout integration)
   * @param {string} customerName - Customer name
   * @param {string} customerPhone - Customer phone
   * @returns {Promise<Object|null>} Customer object or null if not found
   */
  static async getCustomerByNamePhone(customerName, customerPhone) {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_name', customerName)
        .eq('phone', customerPhone)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`ℹ️ Customer not found with name: ${customerName}, phone: ${customerPhone}`);
          return null;
        }
        console.error('❌ Error getting customer by name/phone:', error);
        throw error;
      }

      console.log('✅ Customer found by name/phone:', customer);
      return customer;
    } catch (error) {
      console.error('❌ Error getting customer by name/phone:', error);
      return null;
    }
  }

  /**
   * Ensure database connection and customer table accessibility
   * @returns {Promise<boolean>} Success status
   */
  static async ensurePersistence() {
    try {
      // Test database connection by trying to fetch customers
      const { data, error } = await supabase
        .from('customers')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database connection failed:', error);
        return false;
      }

      console.log('✅ Database connection verified for customers table');
      return true;
    } catch (error) {
      console.error('❌ Customer persistence check failed:', error);
      return false;
    }
  }

  /**
   * Import customers from sales table for initial migration to customers table
   * @returns {Promise<number>} Number of customers imported
   */
  static async importFromSalesTable() {
    try {
      // Get unique customers from sales table
      const { data: sales, error } = await supabase
        .from('sales')
        .select('customer_name, customer_phone, customer_address')
        .not('customer_name', 'is', null)
        .not('customer_name', 'eq', '')
        .not('customer_name', 'eq', 'Guest')
        .not('customer_name', 'eq', '[DELETED CUSTOMER]');

      if (error) throw error;

      // Get existing customers from database
      const existingCustomers = await this.getAllCustomers();
      const existingPhones = new Set(existingCustomers.map(c => c.phone));
      
      let importedCount = 0;
      const uniqueCustomers = new Map();
      
      // Create unique customer map based on phone
      for (const sale of sales) {
        if (sale.customer_phone && !existingPhones.has(sale.customer_phone)) {
          uniqueCustomers.set(sale.customer_phone, {
            customer_name: sale.customer_name,
            phone: sale.customer_phone,
            address: sale.customer_address || '',
            email: '' // Empty email for migrated customers
          });
        }
      }
      
      // Import unique customers
      for (const customerData of uniqueCustomers.values()) {
        try {
          await this.createCustomer(customerData);
          importedCount++;
        } catch (createError) {
          console.warn(`⚠️ Failed to import customer ${customerData.customer_name}:`, createError);
        }
      }

      console.log(`✅ Imported ${importedCount} customers from sales table to database`);
      return importedCount;
    } catch (error) {
      console.error('❌ Error importing customers:', error);
      throw new Error(`Failed to import customers: ${error.message}`);
    }
  }

  /**
   * Migrate existing localStorage customers to database (one-time migration)
   * @returns {Promise<number>} Number of customers migrated
   */
  static async migrateFromLocalStorage() {
    try {
      // Get customers from localStorage if they exist
      const stored = localStorage.getItem('medcure_customers');
      if (!stored) {
        console.log('ℹ️ No localStorage customers found to migrate');
        return 0;
      }

      const localCustomers = JSON.parse(stored);
      if (!Array.isArray(localCustomers) || localCustomers.length === 0) {
        console.log('ℹ️ No valid localStorage customers found to migrate');
        return 0;
      }

      let migratedCount = 0;
      
      for (const localCustomer of localCustomers) {
        try {
          // Try to create customer in database
          await this.createCustomer({
            customer_name: localCustomer.customer_name,
            phone: localCustomer.phone,
            email: localCustomer.email || '',
            address: localCustomer.address || ''
          });
          migratedCount++;
        } catch (createError) {
          // Skip duplicates or invalid customers
          console.warn(`⚠️ Skipped migrating customer ${localCustomer.customer_name}:`, createError.message);
        }
      }

      // After successful migration, clear localStorage
      if (migratedCount > 0) {
        localStorage.removeItem('medcure_customers');
        // Also clear backups
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('medcure_customers_backup_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('✅ localStorage customers cleared after migration');
      }

      console.log(`✅ Migrated ${migratedCount} customers from localStorage to database`);
      return migratedCount;
    } catch (error) {
      console.error('❌ Error migrating customers from localStorage:', error);
      throw new Error(`Failed to migrate customers: ${error.message}`);
    }
  }
}

// Named exports for specific functions
export const {
  createCustomer,
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  getCustomerByNamePhone,
  updateCustomer,
  updateCustomerPurchaseStats,
  deleteCustomer,
  clearAllCustomers,
  ensurePersistence,
  importFromSalesTable
} = CustomerService;