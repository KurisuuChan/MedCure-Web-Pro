import { supabase } from '../../../config/supabase';

/**
 * Enhanced Product Search Service
 * Provides comprehensive search and filtering capabilities for products
 */
export class EnhancedProductSearchService {
  
  /**
   * Comprehensive product search using the enhanced RPC function
   * @param {string} searchTerm - The search term to look for
   * @returns {Promise<{success: boolean, data: Array, error?: string}>}
   */
  static async searchProducts(searchTerm = '') {
    try {
      console.log('🔍 Searching products with term:', searchTerm);
      
      const { data, error } = await supabase
        .rpc('search_products', { 
          search_term: searchTerm || '' 
        });

      if (error) {
        console.error('❌ Error searching products:', error);
        return { success: false, error: error.message, data: [] };
      }

      console.log(`✅ Found ${data?.length || 0} products`);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Exception in searchProducts:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Advanced product search with filters
   * @param {Object} params - Search parameters
   * @param {string} params.searchTerm - The search term
   * @param {string} params.drugClassification - Drug classification filter
   * @param {string} params.category - Category filter
   * @param {number} params.limit - Maximum results to return
   * @returns {Promise<{success: boolean, data: Array, error?: string}>}
   */
  static async searchProductsFiltered({
    searchTerm = '',
    drugClassification = '',
    category = '',
    limit = 100
  } = {}) {
    try {
      console.log('🔍 Advanced search with filters:', {
        searchTerm,
        drugClassification,
        category,
        limit
      });
      
      const { data, error } = await supabase
        .rpc('search_products_filtered', {
          search_term: searchTerm || '',
          drug_classification_filter: drugClassification || '',
          category_filter: category || '',
          limit_count: limit
        });

      if (error) {
        console.error('❌ Error in filtered search:', error);
        return { success: false, error: error.message, data: [] };
      }

      console.log(`✅ Filtered search found ${data?.length || 0} products`);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Exception in searchProductsFiltered:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get distinct manufacturers for filter dropdown
   * @returns {Promise<{success: boolean, data: Array, error?: string}>}
   */
  static async getDistinctManufacturers() {
    try {
      console.log('📋 Fetching distinct manufacturers...');
      
      // Since we removed manufacturer field, return empty array
      console.log(`✅ Found 0 manufacturers (field removed)`);
      return { success: true, data: [] };
    } catch (error) {
      console.error('❌ Exception in getDistinctManufacturers:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get distinct drug classifications for filter dropdown
   * @returns {Promise<{success: boolean, data: Array, error?: string}>}
   */
  static async getDistinctDrugClassifications() {
    try {
      console.log('📋 Fetching distinct drug classifications...');
      
      const { data, error } = await supabase
        .from('products')
        .select('drug_classification')
        .eq('is_active', true)
        .eq('is_archived', false)
        .not('drug_classification', 'is', null);

      if (error) {
        console.error('❌ Error fetching drug classifications:', error);
        return { success: false, error: error.message, data: [] };
      }

      const classifications = [...new Set(data?.map(item => item.drug_classification).filter(Boolean))].sort() || [];
      console.log(`✅ Found ${classifications.length} drug classifications`);
      return { success: true, data: classifications };
    } catch (error) {
      console.error('❌ Exception in getDistinctDrugClassifications:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get all products with enhanced search capabilities (fallback method)
   * @param {Object} filters - Filter options
   * @returns {Promise<{success: boolean, data: Array, error?: string}>}
   */
  static async getAllProductsEnhanced(filters = {}) {
    try {
      console.log('📋 Fetching all products with enhanced data...');
      
      let query = supabase
        .from('products')
        .select(`
          *,
          generic_name,
          brand_name,
          dosage_form,
          dosage_strength,
          drug_classification
        `)
        .eq('is_active', true)
        .eq('is_archived', false);

      // Apply filters if provided
      if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }

      if (filters.drugClassification && filters.drugClassification !== 'All') {
        query = query.eq('drug_classification', filters.drugClassification);
      }



      // Order by brand name, then generic name
      query = query.order('brand_name', { ascending: true, nullsFirst: false })
                   .order('generic_name', { ascending: true, nullsFirst: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching enhanced products:', error);
        return { success: false, error: error.message, data: [] };
      }

      console.log(`✅ Fetched ${data?.length || 0} enhanced products`);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Exception in getAllProductsEnhanced:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get product suggestions for autocomplete
   * @param {string} searchTerm - The partial search term
   * @param {number} limit - Maximum suggestions to return
   * @returns {Promise<{success: boolean, data: Array, error?: string}>}
   */
  static async getProductSuggestions(searchTerm = '', limit = 10) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return { success: true, data: [] };
      }

      console.log('💡 Getting product suggestions for:', searchTerm);
      
      const { data, error } = await supabase
        .rpc('search_products_filtered', {
          search_term: searchTerm,
          drug_classification_filter: '',
          category_filter: '',
          limit_count: limit
        });

      if (error) {
        console.error('❌ Error getting suggestions:', error);
        return { success: false, error: error.message, data: [] };
      }

      // Format suggestions for autocomplete
      const suggestions = data?.map(product => ({
        id: product.id,
        label: `${product.brand_name || product.brand || 'Unknown Brand'} - ${product.generic_name || product.name}`,
        brand: product.brand_name || product.brand,
        generic: product.generic_name || product.name,
        dosage: product.dosage_strength,
        form: product.dosage_form
      })) || [];

      console.log(`✅ Generated ${suggestions.length} suggestions`);
      return { success: true, data: suggestions };
    } catch (error) {
      console.error('❌ Exception in getProductSuggestions:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Search products by registration number
   * @param {string} registrationNumber - The registration number to search for
   * @returns {Promise<{success: boolean, data: Array, error?: string}>}
   */
  static async searchByRegistrationNumber(registrationNumber) {
    try {
      console.log('🔍 Searching by registration number:', registrationNumber);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('registration_number', registrationNumber)
        .eq('is_active', true)
        .eq('is_archived', false);

      if (error) {
        console.error('❌ Error searching by registration number:', error);
        return { success: false, error: error.message, data: [] };
      }

      console.log(`✅ Found ${data?.length || 0} products with registration number`);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Exception in searchByRegistrationNumber:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get distinct dosage strengths for filter dropdown
   * @returns {Promise<{success: boolean, data: Array, error?: string}>}
   */
  static async getDistinctDosageStrengths() {
    try {
      console.log('📋 Fetching distinct dosage strengths...');
      
      const { data, error } = await supabase
        .from('products')
        .select('dosage_strength')
        .eq('is_active', true)
        .eq('is_archived', false)
        .not('dosage_strength', 'is', null);

      if (error) {
        console.error('❌ Error fetching dosage strengths:', error);
        return { success: false, error: error.message, data: [] };
      }

      const strengths = [...new Set(data?.map(item => item.dosage_strength).filter(Boolean))].sort() || [];
      console.log(`✅ Found ${strengths.length} dosage strengths`);
      return { success: true, data: strengths };
    } catch (error) {
      console.error('❌ Exception in getDistinctDosageStrengths:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get distinct dosage forms for filter dropdown
   * @returns {Promise<{success: boolean, data: Array, error?: string}>}
   */
  static async getDistinctDosageForms() {
    try {
      console.log('📋 Fetching distinct dosage forms...');
      
      const { data, error } = await supabase
        .from('products')
        .select('dosage_form')
        .eq('is_active', true)
        .eq('is_archived', false)
        .not('dosage_form', 'is', null);

      if (error) {
        console.error('❌ Error fetching dosage forms:', error);
        return { success: false, error: error.message, data: [] };
      }

      const forms = [...new Set(data?.map(item => item.dosage_form).filter(Boolean))].sort() || [];
      console.log(`✅ Found ${forms.length} dosage forms`);
      return { success: true, data: forms };
    } catch (error) {
      console.error('❌ Exception in getDistinctDosageForms:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get filter options for advanced search
   * @returns {Promise<{success: boolean, data: Object, error?: string}>}
   */
  static async getFilterOptions() {
    try {
      console.log('🎛️ Fetching filter options...');
      
      const [classificationsResult, strengthsResult, formsResult] = await Promise.all([
        this.getDistinctDrugClassifications(),
        this.getDistinctDosageStrengths(),
        this.getDistinctDosageForms()
      ]);

      // Get categories from the existing products
      const { data: categoryData, error: categoryError } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true)
        .eq('is_archived', false);

      let categories = [];
      if (!categoryError && categoryData) {
        categories = [...new Set(categoryData.map(item => item.category).filter(Boolean))].sort();
      }

      const filterOptions = {
        drugClassifications: classificationsResult.success ? classificationsResult.data : [],
        categories: categories,
        dosageStrengths: strengthsResult.success ? strengthsResult.data : [],
        dosageForms: formsResult.success ? formsResult.data : []
      };

      console.log('✅ Filter options loaded:', {
        drugClassifications: filterOptions.drugClassifications.length,
        categories: filterOptions.categories.length,
        dosageStrengths: filterOptions.dosageStrengths.length,
        dosageForms: filterOptions.dosageForms.length
      });

      return { success: true, data: filterOptions };
    } catch (error) {
      console.error('❌ Exception in getFilterOptions:', error);
      return { success: false, error: error.message, data: {} };
    }
  }
}