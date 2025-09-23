/**
 * Quick fix for customer statistics issue
 * This script will:
 * 1. Clear all localStorage data that might be caching old results
 * 2. Force refresh customer data without cache
 * 3. Add debugging to see what's happening
 */

// Clear all MedCure related localStorage
export const clearMedCureCache = () => {
  console.log('🧹 Clearing all MedCure cache data...');
  
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.toLowerCase().includes('medcure') ||
      key.toLowerCase().includes('customer') ||
      key.toLowerCase().includes('transaction') ||
      key.toLowerCase().includes('pos') ||
      key.includes('supabase')
    )) {
      keysToRemove.push(key);
    }
  }
  
  console.log('🗑️ Removing keys:', keysToRemove);
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Removed: ${key}`);
  });
  
  // Also clear sessionStorage
  const sessionKeysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.toLowerCase().includes('medcure') ||
      key.toLowerCase().includes('customer') ||
      key.toLowerCase().includes('transaction')
    )) {
      sessionKeysToRemove.push(key);
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`✅ Removed from session: ${key}`);
  });
  
  console.log('🎯 Cache cleared! Please refresh the page.');
  return true;
};

// Force refresh customer data
export const forceRefreshCustomers = async () => {
  console.log('🔄 Force refreshing customer data...');
  
  // Clear cache first
  clearMedCureCache();
  
  // Import and call customer service directly
  try {
    const { CustomerService } = await import('../services/CustomerService');
    console.log('📞 Calling CustomerService.getAllCustomers() directly...');
    
    const customers = await CustomerService.getAllCustomers();
    console.log('📋 Fresh customer data:', customers);
    
    return customers;
  } catch (error) {
    console.error('❌ Error refreshing customers:', error);
    throw error;
  }
};

// Add to window for console access
if (typeof window !== 'undefined') {
  window.clearMedCureCache = clearMedCureCache;
  window.forceRefreshCustomers = forceRefreshCustomers;
}

console.log('🔧 Cache cleaner loaded!');
console.log('📝 Available commands:');
console.log('  - clearMedCureCache() - Clear all cached data');  
console.log('  - forceRefreshCustomers() - Force refresh customer data');