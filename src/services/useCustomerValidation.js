// Professional form validation system for Customer Information
import { useState, useCallback, useMemo } from 'react';

export const CustomerValidationRules = {
  customer_name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-'\.]+$/,
    message: 'Name must be 2-100 characters and contain only letters, spaces, hyphens, apostrophes, and periods'
  },
  email: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  phone: {
    required: false,
    pattern: /^[\d\s\-\+\(\)\.]+$/,
    minLength: 10,
    maxLength: 20,
    message: 'Phone number must be 10-20 digits and can include spaces, dashes, parentheses, and plus signs'
  },
  address: {
    required: false,
    maxLength: 500,
    message: 'Address must be less than 500 characters'
  }
};

export const useCustomerValidation = () => {
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Validate individual field
  const validateField = useCallback((fieldName, value) => {
    const rule = CustomerValidationRules[fieldName];
    if (!rule) return { isValid: true, error: null };

    const errors = [];
    const stringValue = String(value || '').trim();

    // Required field validation
    if (rule.required && !stringValue) {
      errors.push(`${fieldName.replace('_', ' ')} is required`);
    }

    // Skip other validations if field is empty and not required
    if (!stringValue && !rule.required) {
      return { isValid: true, error: null };
    }

    // Length validations
    if (rule.minLength && stringValue.length < rule.minLength) {
      errors.push(`Must be at least ${rule.minLength} characters`);
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      errors.push(`Must be less than ${rule.maxLength} characters`);
    }

    // Pattern validation
    if (rule.pattern && stringValue && !rule.pattern.test(stringValue)) {
      errors.push(rule.message || 'Invalid format');
    }

    // Custom validations
    if (fieldName === 'email' && stringValue) {
      // Additional email validation
      const emailParts = stringValue.split('@');
      if (emailParts.length === 2 && emailParts[1].split('.').length < 2) {
        errors.push('Email domain must have a valid extension');
      }
    }

    if (fieldName === 'phone' && stringValue) {
      // Clean phone number for digit count
      const digitsOnly = stringValue.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        errors.push('Phone number must have at least 10 digits');
      }
    }

    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors.join(', ') : null
    };
  }, []);

  // Validate entire customer object
  const validateCustomer = useCallback((customerData) => {
    const errors = {};
    let isValid = true;

    // Validate each field
    Object.keys(CustomerValidationRules).forEach(fieldName => {
      const result = validateField(fieldName, customerData[fieldName]);
      if (!result.isValid) {
        errors[fieldName] = result.error;
        isValid = false;
      }
    });

    // Cross-field validations
    if (customerData.email && customerData.phone) {
      // Both email and phone provided - good
    } else if (!customerData.email && !customerData.phone) {
      // Neither email nor phone provided
      errors.contact = 'Please provide either an email address or phone number';
      isValid = false;
    }

    setValidationErrors(errors);

    return {
      isValid,
      errors: Object.values(errors),
      fieldErrors: errors
    };
  }, [validateField]);

  // Real-time field validation
  const validateFieldRealTime = useCallback((fieldName, value) => {
    const result = validateField(fieldName, value);
    
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: result.error
    }));

    return result;
  }, [validateField]);

  // Clear validation errors
  const clearValidationErrors = useCallback((fieldName = null) => {
    if (fieldName) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } else {
      setValidationErrors({});
    }
  }, []);

  // Get validation state for a field
  const getFieldValidation = useCallback((fieldName) => {
    const error = validationErrors[fieldName];
    return {
      hasError: !!error,
      error,
      isValid: !error
    };
  }, [validationErrors]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return Object.keys(validationErrors).length === 0;
  }, [validationErrors]);

  // Format validation errors for display
  const getValidationSummary = useCallback(() => {
    const errors = Object.values(validationErrors).filter(Boolean);
    return {
      hasErrors: errors.length > 0,
      errorCount: errors.length,
      errors,
      summary: errors.length > 0 ? `Please fix ${errors.length} error${errors.length > 1 ? 's' : ''}` : null
    };
  }, [validationErrors]);

  return {
    // Validation methods
    validateField,
    validateCustomer,
    validateFieldRealTime,
    
    // State management
    validationErrors,
    isValidating,
    setIsValidating,
    
    // Utility methods
    clearValidationErrors,
    getFieldValidation,
    isFormValid,
    getValidationSummary,
    
    // Validation rules (for reference)
    rules: CustomerValidationRules
  };
};

// Professional validated input component
export const ValidatedInput = ({ 
  type = 'text',
  name,
  value,
  onChange,
  validation,
  label,
  placeholder,
  required = false,
  className = '',
  ...props 
}) => {
  const fieldValidation = validation.getFieldValidation(name);
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(e);
    
    // Real-time validation
    validation.validateFieldRealTime(name, newValue);
  };

  const handleBlur = (e) => {
    // Validate on blur for better UX
    validation.validateFieldRealTime(name, e.target.value);
    props.onBlur?.(e);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`
          w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0 transition-colors
          ${fieldValidation.hasError 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${className}
        `}
        {...props}
      />
      
      {fieldValidation.hasError && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {fieldValidation.error}
        </p>
      )}
    </div>
  );
};

export default useCustomerValidation;