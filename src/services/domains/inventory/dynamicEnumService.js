// =============================================================================
// DYNAMIC ENUM SERVICE
// =============================================================================
// Purpose: Dynamically fetch and manage enum values from database
// Features: Auto-refresh enum values, validation with auto-extension
// Date: October 6, 2025
// =============================================================================

import { supabase } from '../../../config/supabase';
import { logDebug, handleError } from '../../core/serviceUtils';

export class DynamicEnumService {
  // Cache for enum values to avoid frequent database calls
  static enumCache = {
    dosage_forms: [],
    drug_classifications: [],
    last_updated: null,
    cache_duration: 5 * 60 * 1000, // 5 minutes in milliseconds
  };

  /**
   * Get current enum values from database with caching
   * @param {boolean} forceRefresh - Force refresh from database
   * @returns {Promise<Object>} Current enum values
   */
  static async getEnumValues(forceRefresh = false) {
    try {
      const now = new Date().getTime();
      const cacheAge = this.enumCache.last_updated 
        ? now - this.enumCache.last_updated 
        : Infinity;

      // Use cache if it's fresh and not forcing refresh
      if (!forceRefresh && cacheAge < this.enumCache.cache_duration && this.enumCache.last_updated) {
        logDebug('Using cached enum values', this.enumCache);
        return {
          dosage_forms: this.enumCache.dosage_forms,
          drug_classifications: this.enumCache.drug_classifications,
          cached: true,
          last_updated: new Date(this.enumCache.last_updated)
        };
      }

      logDebug('Fetching fresh enum values from database');

      // Call the database function to get current enum values
      const { data, error } = await supabase.rpc('get_enum_values_json');

      if (error) {
        console.error('❌ Error fetching enum values:', error);
        
        // Return cached values if available, otherwise return defaults
        if (this.enumCache.last_updated) {
          console.warn('Using stale cached enum values due to database error');
          return {
            dosage_forms: this.enumCache.dosage_forms,
            drug_classifications: this.enumCache.drug_classifications,
            cached: true,
            stale: true,
            error: error.message
          };
        }
        
        // Return hardcoded defaults if no cache available
        return this.getDefaultEnumValues();
      }

      // Update cache
      this.enumCache = {
        dosage_forms: data.dosage_forms || [],
        drug_classifications: data.drug_classifications || [],
        last_updated: now,
        cache_duration: this.enumCache.cache_duration
      };

      console.log('✅ Successfully fetched enum values:', data);

      return {
        dosage_forms: data.dosage_forms || [],
        drug_classifications: data.drug_classifications || [],
        cached: false,
        last_updated: new Date(data.last_updated)
      };

    } catch (error) {
      console.error('❌ DynamicEnumService.getEnumValues() failed:', error);
      handleError(error, 'Get enum values');
      
      // Return cached values or defaults on error
      if (this.enumCache.last_updated) {
        return {
          dosage_forms: this.enumCache.dosage_forms,
          drug_classifications: this.enumCache.drug_classifications,
          cached: true,
          stale: true,
          error: error.message
        };
      }
      
      return this.getDefaultEnumValues();
    }
  }

  /**
   * Get default enum values as fallback
   * @returns {Object} Default enum values
   */
  static getDefaultEnumValues() {
    return {
      dosage_forms: [
        'Tablet',
        'Capsule', 
        'Syrup',
        'Injection',
        'Ointment',
        'Drops',
        'Inhaler'
      ],
      drug_classifications: [
        'Prescription (Rx)',
        'Over-the-Counter (OTC)',
        'Controlled Substance'
      ],
      cached: false,
      default: true,
      last_updated: new Date()
    };
  }

  /**
   * Validate and auto-add dosage form
   * @param {string} value - Dosage form value to validate
   * @returns {Promise<Object>} Validation result
   */
  static async validateOrAddDosageForm(value) {
    try {
      if (!value || value.trim() === '') {
        return { 
          is_valid: true, 
          value: null, 
          was_added: false, 
          message: 'Empty value - no validation needed' 
        };
      }

      logDebug('Validating dosage form:', value);

      const { data, error } = await supabase.rpc('validate_or_add_dosage_form', {
        input_value: value.trim()
      });

      if (error) {
        console.error('❌ Error validating dosage form:', error);
        throw error;
      }

      // If a new value was added, invalidate cache
      if (data.was_added) {
        this.enumCache.last_updated = null; // Force refresh next time
        console.log('🆕 New dosage form added:', data.value);
      }

      return data;

    } catch (error) {
      console.error('❌ DynamicEnumService.validateOrAddDosageForm() failed:', error);
      handleError(error, 'Validate dosage form');
      
      // Return basic validation for fallback
      return {
        is_valid: true, // Assume valid to not block import
        value: value,
        was_added: false,
        message: `Validation failed: ${error.message}`,
        error: true
      };
    }
  }

  /**
   * Validate and auto-add drug classification
   * @param {string} value - Drug classification value to validate
   * @returns {Promise<Object>} Validation result
   */
  static async validateOrAddDrugClassification(value) {
    try {
      if (!value || value.trim() === '') {
        return { 
          is_valid: true, 
          value: null, 
          was_added: false, 
          message: 'Empty value - no validation needed' 
        };
      }

      logDebug('Validating drug classification:', value);

      const { data, error } = await supabase.rpc('validate_or_add_drug_classification', {
        input_value: value.trim()
      });

      if (error) {
        console.error('❌ Error validating drug classification:', error);
        throw error;
      }

      // If a new value was added, invalidate cache
      if (data.was_added) {
        this.enumCache.last_updated = null; // Force refresh next time
        console.log('🆕 New drug classification added:', data.value);
      }

      return data;

    } catch (error) {
      console.error('❌ DynamicEnumService.validateOrAddDrugClassification() failed:', error);
      handleError(error, 'Validate drug classification');
      
      // Return basic validation for fallback
      return {
        is_valid: true, // Assume valid to not block import
        value: value,
        was_added: false,
        message: `Validation failed: ${error.message}`,
        error: true
      };
    }
  }

  /**
   * Batch validate enum values for import
   * @param {Array<string>} dosageForms - Array of dosage forms to validate
   * @param {Array<string>} drugClassifications - Array of drug classifications to validate
   * @returns {Promise<Object>} Batch validation result
   */
  static async validateEnumValuesBatch(dosageForms = [], drugClassifications = []) {
    try {
      logDebug('Batch validating enum values:', { dosageForms, drugClassifications });

      // Filter out empty values
      const cleanDosageForms = dosageForms.filter(form => form && form.trim());
      const cleanClassifications = drugClassifications.filter(cls => cls && cls.trim());

      const { data, error } = await supabase.rpc('validate_enum_values_batch', {
        dosage_forms: cleanDosageForms,
        drug_classifications: cleanClassifications
      });

      if (error) {
        console.error('❌ Error in batch validation:', error);
        throw error;
      }

      // If any values were added, invalidate cache
      if (data.total_added > 0) {
        this.enumCache.last_updated = null; // Force refresh next time
        console.log(`🆕 ${data.total_added} new enum values added during batch validation`);
      }

      return data;

    } catch (error) {
      console.error('❌ DynamicEnumService.validateEnumValuesBatch() failed:', error);
      handleError(error, 'Batch validate enum values');
      
      // Return basic result for fallback
      return {
        total_processed: 0,
        total_added: 0,
        validation_details: [],
        error: true,
        message: error.message
      };
    }
  }

  /**
   * Get recent enum changes for admin dashboard
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>} Recent enum changes
   */
  static async getRecentEnumChanges(days = 30) {
    try {
      logDebug('Fetching recent enum changes:', { days });

      const { data, error } = await supabase.rpc('get_recent_enum_changes', {
        days: days
      });

      if (error) {
        console.error('❌ Error fetching recent enum changes:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('❌ DynamicEnumService.getRecentEnumChanges() failed:', error);
      handleError(error, 'Get recent enum changes');
      return [];
    }
  }

  /**
   * Analyze unrecognized enum values in existing products
   * @returns {Promise<Object>} Analysis of unrecognized values
   */
  static async analyzeUnrecognizedValues() {
    try {
      logDebug('Analyzing unrecognized enum values');

      const { data, error } = await supabase.rpc('analyze_unrecognized_enum_values');

      if (error) {
        console.error('❌ Error analyzing unrecognized values:', error);
        throw error;
      }

      return data;

    } catch (error) {
      console.error('❌ DynamicEnumService.analyzeUnrecognizedValues() failed:', error);
      handleError(error, 'Analyze unrecognized values');
      return {
        current_dosage_forms: [],
        current_drug_classifications: [],
        unrecognized_dosage_forms: [],
        unrecognized_drug_classifications: [],
        error: true,
        message: error.message
      };
    }
  }

  /**
   * Invalidate enum cache (force refresh on next access)
   */
  static invalidateCache() {
    this.enumCache.last_updated = null;
    logDebug('Enum cache invalidated');
  }

  /**
   * Preload enum values (useful for app initialization)
   * @returns {Promise<Object>} Preloaded enum values
   */
  static async preloadEnumValues() {
    try {
      logDebug('Preloading enum values');
      return await this.getEnumValues(true); // Force fresh fetch
    } catch (error) {
      console.error('❌ Failed to preload enum values:', error);
      return this.getDefaultEnumValues();
    }
  }

  /**
   * Get cache status and statistics
   * @returns {Object} Cache status information
   */
  static getCacheStatus() {
    const now = new Date().getTime();
    const age = this.enumCache.last_updated ? now - this.enumCache.last_updated : null;
    
    return {
      is_cached: this.enumCache.last_updated !== null,
      cache_age_ms: age,
      cache_age_minutes: age ? Math.round(age / (1000 * 60) * 100) / 100 : null,
      is_fresh: age ? age < this.enumCache.cache_duration : false,
      total_dosage_forms: this.enumCache.dosage_forms.length,
      total_drug_classifications: this.enumCache.drug_classifications.length,
      last_updated: this.enumCache.last_updated ? new Date(this.enumCache.last_updated) : null
    };
  }
}

export default DynamicEnumService;