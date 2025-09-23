import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/CustomerService';
import { useAuth } from './useAuth';

/**
 * Custom hook for customer management
 */
export const useCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all customers
   */
  const fetchCustomers = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (forceRefresh) {
        console.log('🔄 [useCustomers] Force refreshing customer data...');
        // Clear any potential cache
        setCustomers([]);
      }
      
      // CustomerService.getAllCustomers() is now async
      const data = await CustomerService.getAllCustomers();
      setCustomers(data);
      console.log(`✅ [useCustomers] Loaded ${data.length} customers from database`);
      
      // Enhanced debugging for transaction statistics
      if (data && data.length > 0) {
        console.log('🔍 [useCustomers] Sample customer with stats:', {
          name: data[0].customer_name,
          purchase_count: data[0].purchase_count,
          total_purchases: data[0].total_purchases,
          last_purchase_date: data[0].last_purchase_date
        });
      }
    } catch (err) {
      console.error('❌ [useCustomers] Failed to fetch customers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new customer
   */
  const createCustomer = useCallback(async (customerData) => {
    try {
      setError(null);
      const newCustomer = await CustomerService.createCustomer(customerData);
      
      // Add to local state to avoid re-fetch
      setCustomers(prev => [...prev, newCustomer]);
      
      return newCustomer;
    } catch (err) {
      console.error('❌ [useCustomers] Failed to create customer:', err);
      setError(err.message);
      throw err;
    }
  }, [user?.id]);

  /**
   * Search customers
   */
  const searchCustomers = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);
      // CustomerService.searchCustomers() is now async
      const data = await CustomerService.searchCustomers(query);
      return data;
    } catch (err) {
      console.error('❌ [useCustomers] Failed to search customers:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update customer
   */
  const updateCustomer = useCallback(async (customerId, updateData) => {
    try {
      setError(null);
      const updatedCustomer = await CustomerService.updateCustomer(customerId, updateData);
      
      // Update local state
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === customerId ? updatedCustomer : customer
        )
      );
      
      return updatedCustomer;
    } catch (err) {
      console.error('❌ [useCustomers] Failed to update customer:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get customer by name and phone (for existing schema)
   */
  const getCustomerByNamePhone = useCallback(async (customerName, customerPhone) => {
    try {
      setError(null);
      // CustomerService.getCustomerByNamePhone() is now async 
      return await CustomerService.getCustomerByNamePhone(customerName, customerPhone);
    } catch (err) {
      console.error('❌ [useCustomers] Failed to get customer:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Delete customer
   */
  const deleteCustomer = useCallback(async (customerId) => {
    try {
      setError(null);
      const success = await CustomerService.deleteCustomer(customerId);
      
      if (success) {
        // Remove from local state
        setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      }
      
      return success;
    } catch (err) {
      console.error('❌ [useCustomers] Failed to delete customer:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    forceRefresh: () => fetchCustomers(true),
    createCustomer,
    searchCustomers,
    updateCustomer,
    getCustomerByNamePhone,
    deleteCustomer,
    clearError,
  };
};