import React, { forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      type = "text",
      size = "md",
      fullWidth = false,
      icon: Icon,
      iconPosition = "left",
      placeholder,
      className = "",
      containerClassName = "",
      required = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base",
    };

    const iconSizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    const baseInputClasses = `
    block border border-gray-300 rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-50 disabled:cursor-not-allowed
    transition-colors
    ${fullWidth ? "w-full" : ""}
    ${error ? "border-red-300 focus:ring-red-500" : ""}
    ${Icon && iconPosition === "left" ? "pl-10" : ""}
    ${Icon && iconPosition === "right" ? "pr-10" : ""}
    ${isPassword ? "pr-10" : ""}
    ${sizeClasses[size]}
    ${className}
  `;

    return (
      <div className={`${containerClassName}`}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {Icon && iconPosition === "left" && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className={`text-gray-400 ${iconSizeClasses[size]}`} />
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClasses}
            {...props}
          />

          {/* Right Icon */}
          {Icon && iconPosition === "right" && !isPassword && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Icon className={`text-gray-400 ${iconSizeClasses[size]}`} />
            </div>
          )}

          {/* Password Toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff
                  className={`text-gray-400 hover:text-gray-600 ${iconSizeClasses[size]}`}
                />
              ) : (
                <Eye
                  className={`text-gray-400 hover:text-gray-600 ${iconSizeClasses[size]}`}
                />
              )}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Textarea component
export const Textarea = forwardRef(
  (
    {
      label,
      error,
      helperText,
      rows = 3,
      fullWidth = false,
      placeholder,
      className = "",
      containerClassName = "",
      required = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
    block border border-gray-300 rounded-lg px-3 py-2 text-sm
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-50 disabled:cursor-not-allowed
    transition-colors resize-vertical
    ${fullWidth ? "w-full" : ""}
    ${error ? "border-red-300 focus:ring-red-500" : ""}
    ${className}
  `;

    return (
      <div className={containerClassName}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          className={baseClasses}
          {...props}
        />

        {/* Error Message */}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

// Select component
export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder = "Select an option",
      fullWidth = false,
      className = "",
      containerClassName = "",
      required = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
    block border border-gray-300 rounded-lg px-3 py-2 text-sm
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-50 disabled:cursor-not-allowed
    transition-colors
    ${fullWidth ? "w-full" : ""}
    ${error ? "border-red-300 focus:ring-red-500" : ""}
    ${className}
  `;

    return (
      <div className={containerClassName}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Select */}
        <select
          ref={ref}
          disabled={disabled}
          className={baseClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Error Message */}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Input;
