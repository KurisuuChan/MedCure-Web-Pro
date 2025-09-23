// Professional validation system for Customer forms
import { useState, useCallback, useEffect } from 'react';
import { isValidEmail, isValidPhoneNumber, isRequired } from '../utils/validation';

export const CustomerValidationRules = {
  customer_name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-\'\.]+$/,
    label: 'Customer Name',
    errorMessages: {
      required: 'Customer name is required',
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name cannot exceed 100 characters',
      pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },
  phone: {
    required: true,
    phone: true,
    minLength: 10,
    maxLength: 15,
    label: 'Phone Number',
    errorMessages: {
      required: 'Phone number is required',
      phone: 'Please enter a valid Philippine phone number (e.g., 09123456789)',
      minLength: 'Phone number must be at least 10 digits',
      maxLength: 'Phone number cannot exceed 15 digits'
    }
  },
  email: {
    required: false,
    email: true,
    maxLength: 255,
    label: 'Email Address',
    errorMessages: {
      email: 'Please enter a valid email address',
      maxLength: 'Email cannot exceed 255 characters'
    }
  },
  address: {
    required: false,
    maxLength: 500,
    label: 'Address',
    errorMessages: {
      maxLength: 'Address cannot exceed 500 characters'
    }
  }
};

// Custom validation hook for customer forms
export const useCustomerValidation = (initialData = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validate a single field
  const validateField = useCallback(async (fieldName, value, allData = formData) => {
    const rules = CustomerValidationRules[fieldName];
    if (!rules) return null;

    const fieldErrors = [];

    // Required validation
    if (rules.required && !isRequired(value)) {
      fieldErrors.push(rules.errorMessages.required);
    }

    // Only validate other rules if field has value
    if (isRequired(value)) {
      // Email validation
      if (rules.email && !isValidEmail(value)) {
        fieldErrors.push(rules.errorMessages.email);
      }

      // Phone validation  
      if (rules.phone && !isValidPhoneNumber(value)) {
        fieldErrors.push(rules.errorMessages.phone);
      }

      // Length validation
      if (rules.minLength && value.length < rules.minLength) {
        fieldErrors.push(rules.errorMessages.minLength);
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        fieldErrors.push(rules.errorMessages.maxLength);
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        fieldErrors.push(rules.errorMessages.pattern);
      }

      // Custom async validation (e.g., duplicate check)
      if (rules.asyncValidate) {
        try {
          const asyncResult = await rules.asyncValidate(value, allData);
          if (asyncResult !== true) {
            fieldErrors.push(asyncResult);
          }
        } catch (error) {
          fieldErrors.push('Validation failed. Please try again.');
        }
      }
    }

    return fieldErrors.length > 0 ? fieldErrors : null;
  }, [formData]);

  // Validate all fields
  const validateForm = useCallback(async (data = formData) => {
    setIsValidating(true);
    const newErrors = {};
    
    for (const fieldName of Object.keys(CustomerValidationRules)) {
      const fieldErrors = await validateField(fieldName, data[fieldName], data);
      if (fieldErrors) {
        newErrors[fieldName] = fieldErrors;
      }
    }
    
    setErrors(newErrors);
    const formIsValid = Object.keys(newErrors).length === 0;
    setIsValid(formIsValid);
    setIsValidating(false);
    
    return { isValid: formIsValid, errors: newErrors };
  }, [formData, validateField]);

  // Handle field change with real-time validation
  const handleFieldChange = useCallback(async (fieldName, value) => {
    // Update form data
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);

    // Mark field as touched
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    // Validate field if it's been touched
    if (touched[fieldName] || value !== '') {
      const fieldErrors = await validateField(fieldName, value, newFormData);
      setErrors(prev => ({
        ...prev,
        [fieldName]: fieldErrors
      }));
    }
  }, [formData, touched, validateField]);

  // Handle field blur (mark as touched and validate)
  const handleFieldBlur = useCallback(async (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const fieldErrors = await validateField(fieldName, formData[fieldName]);
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldErrors
    }));
  }, [formData, validateField]);

  // Reset form
  const resetForm = useCallback((newData = {}) => {
    setFormData(newData);
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, []);

  // Get field error message
  const getFieldError = useCallback((fieldName) => {
    const fieldErrors = errors[fieldName];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null;
  }, [errors]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName) => {
    return Boolean(errors[fieldName] && errors[fieldName].length > 0);
  }, [errors]);

  // Update isValid when errors change
  useEffect(() => {
    const formIsValid = Object.keys(errors).length === 0 && 
                       Object.keys(touched).length > 0;
    setIsValid(formIsValid);
  }, [errors, touched]);

  return {
    formData,
    errors,
    touched,
    isValidating,
    isValid,
    validateForm,
    validateField,
    handleFieldChange,
    handleFieldBlur,
    resetForm,
    getFieldError,
    hasFieldError,
    setFormData
  };
};

// Input component with validation
export const ValidatedInput = ({ 
  name, 
  label, 
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  placeholder,
  disabled = false,
  className = ''
}) => {
  const baseInputClasses = `
    w-full px-3 py-2 border rounded-lg transition-colors duration-200
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
  `;
  
  const errorClasses = error && touched ? 
    'border-red-300 focus:ring-red-500 focus:border-red-500' : 
    'border-gray-300';

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur && onBlur(name)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${baseInputClasses} ${errorClasses} ${className}`}
        aria-invalid={error && touched ? 'true' : 'false'}
        aria-describedby={error && touched ? `${name}-error` : undefined}
      />
      
      {error && touched && (
        <p id={`${name}-error`} className="text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};