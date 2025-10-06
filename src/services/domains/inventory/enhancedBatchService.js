// 🚀 **ENHANCED BATCH MANAGEMENT SERVICE**
// Senior Developer Implementation
// Addresses all identified batch management flaws

import { supabase } from "../../../config/supabase";
import { logDebug, handleError } from "../../core/serviceUtils";

export class EnhancedBatchService {
  
  /**
   * Add a new product batch with comprehensive validation
   * @param {Object} batchData - Enhanced batch information
   * @returns {Promise<Object>} Result of the batch addition
   */
  static async addProductBatch(batchData) {
    try {
      logDebug('Adding enhanced product batch:', batchData);

      const { 
        productId, 
        quantity, 
        batchNumber, 
        expiryDate, 
        costPerUnit = 0,
        supplierName,
        notes 
      } = batchData;

      // Validate required fields
      if (!productId || !quantity || quantity <= 0) {
        throw new Error('Product ID and positive quantity are required');
      }

      // Get current user ID from auth context if available
      const userId = this.getCurrentUserId();

      const { data, error } = await supabase.rpc('add_product_batch', {
        p_product_id: productId,
        p_quantity: parseInt(quantity),
        p_expiry_date: expiryDate || null
      });

      if (error) {
        console.error('❌ EnhancedBatchService.addProductBatch() Supabase error:', error);
        throw error;
      }

      // Check if the response indicates an error
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to add batch');
      }

      console.log('✅ Successfully added enhanced product batch:', data);
      logDebug('Enhanced batch addition result:', data);
      
      return {
        success: true,
        batch_id: data.batch_id,
        batch_number: data.batch_number,
        ...data
      };
    } catch (error) {
      console.error('❌ EnhancedBatchService.addProductBatch() failed:', error);
      handleError(error, 'Add product batch');
      throw error;
    }
  }

  /**
   * Get all batches with enhanced filtering and sorting
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of batches with enhanced data
   */
  static async getAllBatches(filters = {}) {
    try {
      logDebug('Fetching all product batches with enhanced filters:', filters);

      const {
        productId = null,
        status = null,
        expiryFilter = 'all',
        limit = 100
      } = filters;

      const { data, error } = await supabase.rpc('get_all_batches_enhanced', {
        p_product_id: productId,
        p_status: status,
        p_expiry_filter: expiryFilter,
        p_limit: limit
      });

      if (error) {
        console.error('❌ EnhancedBatchService.getAllBatches() Supabase error:', error);
        throw error;
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} enhanced batches`);
      logDebug('Enhanced batches data:', data);
      
      return data || [];
    } catch (error) {
      console.error('❌ EnhancedBatchService.getAllBatches() failed:', error);
      handleError(error, 'Get all batches');
      return [];
    }
  }

  /**
   * Update batch quantity with enhanced validation and audit trail
   * @param {number} batchId - ID of the batch to update
   * @param {number} newQuantity - New quantity for the batch
   * @param {string} reason - Reason for the adjustment
   * @param {string} adjustmentType - Type of adjustment
   * @returns {Promise<Object>} Result of the batch update
   */
  static async updateBatchQuantity(batchId, newQuantity, reason = 'Manual adjustment', adjustmentType = 'manual_count') {
    try {
      logDebug('Updating batch quantity with enhanced validation:', { batchId, newQuantity, reason, adjustmentType });

      if (!batchId || newQuantity < 0) {
        throw new Error('Valid batch ID and non-negative quantity are required');
      }

      // Get current user ID from auth context if available
      const userId = this.getCurrentUserId();

      const { data, error } = await supabase.rpc('update_batch_quantity', {
        p_batch_id: batchId,
        p_new_quantity: parseInt(newQuantity),
        p_reason: reason
      });

      if (error) {
        console.error('❌ EnhancedBatchService.updateBatchQuantity() Supabase error:', error);
        throw error;
      }

      // Check if the response indicates an error
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to update batch quantity');
      }

      console.log('✅ Successfully updated batch quantity:', data);
      logDebug('Enhanced batch update result:', data);
      
      return data;
    } catch (error) {
      console.error('❌ EnhancedBatchService.updateBatchQuantity() failed:', error);
      handleError(error, 'Update batch quantity');
      throw error;
    }
  }

  /**
   * Process FEFO sale with enhanced validation and tracking
   * @param {string} productId - UUID of the product
   * @param {number} quantityNeeded - Quantity to deduct
   * @param {string} saleId - Optional sale transaction ID
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} FEFO processing result
   */
  static async processFEFOSale(productId, quantityNeeded, saleId = null, notes = null) {
    try {
      logDebug('Processing enhanced FEFO sale:', { productId, quantityNeeded, saleId });

      if (!productId || quantityNeeded <= 0) {
        throw new Error('Valid product ID and positive quantity are required');
      }

      // Get current user ID from auth context if available
      const userId = this.getCurrentUserId();

      const { data, error } = await supabase.rpc('process_sale_fefo_enhanced', {
        p_product_id: productId,
        p_quantity_needed: parseInt(quantityNeeded),
        p_user_id: userId,
        p_sale_id: saleId,
        p_notes: notes
      });

      if (error) {
        console.error('❌ EnhancedBatchService.processFEFOSale() Supabase error:', error);
        throw error;
      }

      // Check if the response indicates an error
      if (data && !data.success) {
        throw new Error(data.error || 'FEFO processing failed');
      }

      console.log('✅ Successfully processed enhanced FEFO sale:', data);
      logDebug('Enhanced FEFO processing result:', data);
      
      return data;
    } catch (error) {
      console.error('❌ EnhancedBatchService.processFEFOSale() failed:', error);
      handleError(error, 'Process FEFO sale');
      throw error;
    }
  }

  /**
   * Quarantine expired batches automatically
   * @returns {Promise<Object>} Quarantine operation result
   */
  static async quarantineExpiredBatches() {
    try {
      logDebug('Quarantining expired batches with enhanced monitoring');

      const { data, error } = await supabase.rpc('quarantine_expired_batches');

      if (error) {
        console.error('❌ EnhancedBatchService.quarantineExpiredBatches() Supabase error:', error);
        throw error;
      }

      console.log('✅ Successfully quarantined expired batches:', data);
      logDebug('Enhanced quarantine result:', data);
      
      return data;
    } catch (error) {
      console.error('❌ EnhancedBatchService.quarantineExpiredBatches() failed:', error);
      handleError(error, 'Quarantine expired batches');
      throw error;
    }
  }

  /**
   * Get batch analytics and insights
   * @returns {Promise<Object>} Batch analytics data
   */
  static async getBatchAnalytics() {
    try {
      logDebug('Fetching batch analytics');

      // Get analytics data using your schema (generic_name, brand_name)
      const { data: analytics, error } = await supabase
        .from('product_batches')
        .select(`
          status,
          expiry_date,
          quantity,
          original_quantity,
          cost_per_unit,
          products!inner(generic_name, brand_name, category)
        `);

      if (error) throw error;

      // Process analytics
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const result = {
        totalBatches: analytics.length,
        activeBatches: analytics.filter(b => b.status === 'active').length,
        expiredBatches: analytics.filter(b => b.status === 'expired').length,
        depletedBatches: analytics.filter(b => b.status === 'depleted').length,
        expiringBatches: analytics.filter(b => 
          b.expiry_date && new Date(b.expiry_date) <= thirtyDaysFromNow && new Date(b.expiry_date) >= now
        ).length,
        totalValue: analytics.reduce((sum, b) => sum + (b.quantity * (b.cost_per_unit || 0)), 0),
        averageUtilization: analytics.length > 0 ? 
          analytics.reduce((sum, b) => sum + ((b.original_quantity - b.quantity) / b.original_quantity), 0) / analytics.length * 100 : 0
      };

      console.log('✅ Successfully generated batch analytics:', result);
      return result;
    } catch (error) {
      console.error('❌ EnhancedBatchService.getBatchAnalytics() failed:', error);
      handleError(error, 'Get batch analytics');
      return {
        totalBatches: 0,
        activeBatches: 0,
        expiredBatches: 0,
        depletedBatches: 0,
        expiringBatches: 0,
        totalValue: 0,
        averageUtilization: 0
      };
    }
  }

  /**
   * Validate batch before sale to prevent overselling
   * @param {string} productId - Product ID
   * @param {number} requestedQuantity - Requested quantity
   * @returns {Promise<Object>} Validation result
   */
  static async validateStockAvailability(productId, requestedQuantity) {
    try {
      logDebug('Validating stock availability:', { productId, requestedQuantity });

      const { data: batches, error } = await supabase
        .from('product_batches')
        .select('quantity, reserved_quantity, expiry_date, status')
        .eq('product_id', productId)
        .eq('status', 'active')
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('expiry_date', { ascending: true, nullsLast: true });

      if (error) throw error;

      const availableQuantity = batches.reduce((sum, batch) => 
        sum + (batch.quantity - batch.reserved_quantity), 0
      );

      const result = {
        isValid: availableQuantity >= requestedQuantity,
        availableQuantity,
        requestedQuantity,
        shortage: Math.max(0, requestedQuantity - availableQuantity),
        batchesAvailable: batches.length
      };

      console.log('✅ Stock validation result:', result);
      return result;
    } catch (error) {
      console.error('❌ EnhancedBatchService.validateStockAvailability() failed:', error);
      return {
        isValid: false,
        availableQuantity: 0,
        requestedQuantity,
        shortage: requestedQuantity,
        batchesAvailable: 0,
        error: error.message
      };
    }
  }

  /**
   * Get current user ID from auth context
   * @returns {string|null} Current user ID
   */
  static getCurrentUserId() {
    try {
      // Try to get user from different possible contexts
      if (typeof window !== 'undefined') {
        // Check for auth context in window
        const authUser = window.supabaseAuth?.user || window.user;
        if (authUser?.id) return authUser.id;
      }
      
      // Return null if no user context found
      return null;
    } catch (error) {
      logDebug('Could not get current user ID:', error);
      return null;
    }
  }

  /**
   * Auto-run maintenance tasks
   * @returns {Promise<Object>} Maintenance results
   */
  static async runMaintenance() {
    try {
      logDebug('Running batch maintenance tasks');

      const results = {
        quarantined: await this.quarantineExpiredBatches(),
        analytics: await this.getBatchAnalytics(),
        timestamp: new Date().toISOString()
      };

      console.log('✅ Batch maintenance completed:', results);
      return results;
    } catch (error) {
      console.error('❌ Batch maintenance failed:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default EnhancedBatchService;