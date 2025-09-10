// 🛠️ **SHARED SERVICE UTILITIES**
// Common utilities used across all services

// 🔧 **CONFIGURATION**
const ENABLE_DEBUG_LOGS = import.meta.env.DEV;

// 🛠️ **UTILITY FUNCTIONS**
export const logDebug = (message, data = null) => {
  if (ENABLE_DEBUG_LOGS) {
    console.log(`🔍 [DataService] ${message}`, data || "");
  }
};

export const handleError = (error, operation) => {
  console.error(`❌ [DataService] ${operation} failed:`, error);
  throw new Error(`${operation} failed: ${error.message}`);
};
