import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  icon: Icon,
  iconPosition = "left",
  fullWidth = false,
  ...props
}) {
  const baseClasses = `
    inline-flex items-center justify-center font-medium
    rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 text-white hover:bg-blue-700 
      focus:ring-blue-500 border border-transparent
    `,
    secondary: `
      bg-gray-600 text-white hover:bg-gray-700 
      focus:ring-gray-500 border border-transparent
    `,
    outline: `
      bg-transparent text-gray-700 border border-gray-300 
      hover:bg-gray-50 focus:ring-gray-500
    `,
    ghost: `
      bg-transparent text-gray-700 border border-transparent 
      hover:bg-gray-100 focus:ring-gray-500
    `,
    danger: `
      bg-red-600 text-white hover:bg-red-700 
      focus:ring-red-500 border border-transparent
    `,
    success: `
      bg-green-600 text-white hover:bg-green-700 
      focus:ring-green-500 border border-transparent
    `,
    warning: `
      bg-yellow-600 text-white hover:bg-yellow-700 
      focus:ring-yellow-500 border border-transparent
    `,
  };

  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  const iconSizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
  };

  const combinedClassName = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? "w-full" : ""}
    ${className}
  `.trim();

  const iconClass = iconSizeClasses[size];
  const showIcon = Icon && !loading;
  const showSpinner = loading;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={combinedClassName}
      {...props}
    >
      {/* Loading Spinner */}
      {showSpinner && (
        <svg
          className={`animate-spin ${iconClass} ${
            iconPosition === "left" ? "mr-2" : "ml-2"
          }`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left Icon */}
      {showIcon && iconPosition === "left" && (
        <Icon className={`${iconClass} mr-2`} />
      )}

      {/* Button Text */}
      <span>{children}</span>

      {/* Right Icon */}
      {showIcon && iconPosition === "right" && (
        <Icon className={`${iconClass} ml-2`} />
      )}
    </button>
  );
}

// Specialized button variants as separate components
export function PrimaryButton(props) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props) {
  return <Button variant="secondary" {...props} />;
}

export function OutlineButton(props) {
  return <Button variant="outline" {...props} />;
}

export function GhostButton(props) {
  return <Button variant="ghost" {...props} />;
}

export function DangerButton(props) {
  return <Button variant="danger" {...props} />;
}

export function SuccessButton(props) {
  return <Button variant="success" {...props} />;
}

export function WarningButton(props) {
  return <Button variant="warning" {...props} />;
}
