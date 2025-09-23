// Professional error handling system for Customer Information
import { useState, useCallback } from 'react';

export const CustomerErrorTypes = {
  VALIDATION_ERROR: 'validation_error',
  DUPLICATE_CUSTOMER: 'duplicate_customer', 
  NETWORK_ERROR: 'network_error',
  PERMISSION_DENIED: 'permission_denied',
  NOT_FOUND: 'not_found',
  UNKNOWN_ERROR: 'unknown_error'
};

export class CustomerErrorHandler {
  static mapError(error) {
    // Map different error types to user-friendly messages
    const errorMap = {
      [CustomerErrorTypes.VALIDATION_ERROR]: {
        title: 'Invalid Information',
        message: 'Please correct the highlighted fields and try again.',
        type: 'warning',
        retryable: false,
        icon: 'AlertTriangle'
      },
      [CustomerErrorTypes.DUPLICATE_CUSTOMER]: {
        title: 'Customer Already Exists',
        message: 'A customer with this phone number already exists in the system.',
        type: 'warning',
        retryable: false,
        icon: 'Users'
      },
      [CustomerErrorTypes.NETWORK_ERROR]: {
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        type: 'error',
        retryable: true,
        icon: 'Wifi'
      },
      [CustomerErrorTypes.PERMISSION_DENIED]: {
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.',
        type: 'error',
        retryable: false,
        icon: 'Lock'
      },
      [CustomerErrorTypes.NOT_FOUND]: {
        title: 'Customer Not Found',
        message: 'The requested customer could not be found.',
        type: 'warning',
        retryable: false,
        icon: 'Search'
      }
    };

    // Determine error type from error object
    let errorType = CustomerErrorTypes.UNKNOWN_ERROR;
    
    if (error?.message?.includes('duplicate') || error?.code === 'duplicate_key') {
      errorType = CustomerErrorTypes.DUPLICATE_CUSTOMER;
    } else if (error?.message?.includes('validation') || error?.name === 'ValidationError') {
      errorType = CustomerErrorTypes.VALIDATION_ERROR;
    } else if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
      errorType = CustomerErrorTypes.NETWORK_ERROR;
    } else if (error?.code === 'PGRST116') {
      errorType = CustomerErrorTypes.NOT_FOUND;
    }

    const mappedError = errorMap[errorType] || {
      title: 'Unexpected Error',
      message: 'Something went wrong. Please try again or contact support if the problem persists.',
      type: 'error',
      retryable: true,
      icon: 'AlertCircle'
    };

    return {
      ...mappedError,
      originalError: error,
      timestamp: new Date().toISOString()
    };
  }

  static logError(error, context = {}) {
    const errorInfo = {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('[CustomerSystem Error]', errorInfo);

    // In production, send to error reporting service
    if (import.meta.env.PROD && window.errorReporting) {
      window.errorReporting.captureError(error, errorInfo);
    }
  }
}

// Enhanced error boundary hook for customer operations
export const useCustomerErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((error, context = {}) => {
    const mappedError = CustomerErrorHandler.mapError(error);
    CustomerErrorHandler.logError(error, context);
    setError(mappedError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const retryOperation = useCallback(async (operation) => {
    if (!error?.retryable) return;
    
    setIsRetrying(true);
    try {
      await operation();
      clearError();
    } catch (retryError) {
      handleError(retryError, { isRetry: true });
    } finally {
      setIsRetrying(false);
    }
  }, [error, handleError, clearError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retryOperation
  };
};