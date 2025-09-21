// Enhanced Notification Type System
export const ENHANCED_NOTIFICATION_TYPES = {
  // Business Critical
  CRITICAL_STOCK_OUT: 'critical_stock_out',
  SYSTEM_DOWN: 'system_down',
  PAYMENT_FAILURE: 'payment_failure',
  DATA_CORRUPTION: 'data_corruption',
  
  // Operational
  LOW_STOCK: 'low_stock',
  EXPIRY_WARNING: 'expiry_warning',
  PRICE_CHANGE: 'price_change',
  SUPPLIER_DELIVERY: 'supplier_delivery',
  
  // Customer Related
  CUSTOMER_BIRTHDAY: 'customer_birthday',
  LOYALTY_MILESTONE: 'loyalty_milestone',
  PRESCRIPTION_REMINDER: 'prescription_reminder',
  
  // Financial
  DAILY_SALES_SUMMARY: 'daily_sales_summary',
  PROFIT_THRESHOLD: 'profit_threshold',
  EXPENSE_ALERT: 'expense_alert',
  
  // Compliance & Security
  LICENSE_RENEWAL: 'license_renewal',
  AUDIT_REQUIRED: 'audit_required',
  SECURITY_BREACH: 'security_breach',
  REGULATORY_UPDATE: 'regulatory_update',
  
  // Marketing & Promotions
  PROMOTION_START: 'promotion_start',
  CAMPAIGN_PERFORMANCE: 'campaign_performance',
  SEASONAL_OPPORTUNITY: 'seasonal_opportunity',
  
  // Staff Management
  SHIFT_REMINDER: 'shift_reminder',
  TRAINING_DUE: 'training_due',
  PERFORMANCE_REVIEW: 'performance_review',
  
  // Analytics & Insights
  UNUSUAL_PATTERN: 'unusual_pattern',
  TREND_DETECTED: 'trend_detected',
  FORECAST_UPDATE: 'forecast_update',
  ML_INSIGHT: 'ml_insight'
};

export const NOTIFICATION_PRIORITY_LEVELS = {
  CRITICAL: { value: 5, color: 'red', sound: true, persistent: true },
  HIGH: { value: 4, color: 'orange', sound: true, persistent: false },
  MEDIUM: { value: 3, color: 'yellow', sound: false, persistent: false },
  LOW: { value: 2, color: 'blue', sound: false, persistent: false },
  INFO: { value: 1, color: 'gray', sound: false, persistent: false }
};

export const NOTIFICATION_CHANNELS = {
  DESKTOP: 'desktop',
  TOAST: 'toast', 
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app',
  DASHBOARD_WIDGET: 'dashboard_widget'
};