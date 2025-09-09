import React, { useState, useCallback } from "react";
import { Percent, User, UserCheck, AlertCircle } from "lucide-react";

const DiscountSelector = ({
  onDiscountChange,
  currentDiscount = { type: "none", percentage: 0, amount: 0, idNumber: "" },
  subtotal = 0,
  className = "",
}) => {
  const [discountType, setDiscountType] = useState(currentDiscount.type);
  const [idNumber, setIdNumber] = useState(currentDiscount.idNumber);
  const [customPercentage, setCustomPercentage] = useState(0);
  const [showIdInput, setShowIdInput] = useState(false);
  const [error, setError] = useState("");

  const discountOptions = [
    {
      value: "none",
      label: "No Discount",
      icon: X,
      percentage: 0,
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      description: "Regular pricing",
    },
    {
      value: "pwd",
      label: "PWD (20%)",
      icon: UserCheck,
      percentage: 20,
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
      description: "Person with Disability - 20% discount",
    },
    {
      value: "senior",
      label: "Senior (20%)",
      icon: User,
      percentage: 20,
      color: "bg-green-100 text-green-700 hover:bg-green-200",
      description: "Senior Citizen - 20% discount",
    },
    {
      value: "custom",
      label: "Custom",
      icon: Percent,
      percentage: 0,
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
      description: "Custom discount percentage",
    },
  ];

  // Calculate discount amount based on type and subtotal
  const calculateDiscount = useCallback(
    (type, percentage) => {
      if (type === "none") return { percentage: 0, amount: 0 };

      const discountPercentage =
        type === "custom"
          ? percentage
          : type === "pwd" || type === "senior"
          ? 20
          : 0;

      const discountAmount =
        Math.round(((subtotal * discountPercentage) / 100) * 100) / 100;

      return {
        percentage: discountPercentage,
        amount: discountAmount,
      };
    },
    [subtotal]
  );

  // Handle discount type change
  const handleDiscountTypeChange = (type) => {
    setDiscountType(type);
    setError("");

    // Show ID input for PWD/Senior discounts
    const needsId = type === "pwd" || type === "senior";
    setShowIdInput(needsId);

    // Calculate discount
    const discount = calculateDiscount(type, customPercentage);

    // For PWD/Senior, allow selection but require ID before final application
    if (needsId && !idNumber) {
      // Still update the discount type but with 0 amount until ID is provided
      const discountData = {
        type,
        percentage: 0,
        amount: 0,
        idNumber: "",
      };
      onDiscountChange(discountData);
      setError(`${type.toUpperCase()} ID number is required`);
      return;
    }

    // Apply discount normally
    const discountData = {
      type,
      percentage: discount.percentage,
      amount: discount.amount,
      idNumber: needsId ? idNumber : "",
    };

    onDiscountChange(discountData);
  };

  // Handle ID number change
  const handleIdNumberChange = (value) => {
    setIdNumber(value);
    setError("");

    // Apply discount immediately when ID is provided (minimum 3 characters)
    if (
      value.length >= 3 &&
      (discountType === "pwd" || discountType === "senior")
    ) {
      const discount = calculateDiscount(discountType, customPercentage);
      onDiscountChange({
        type: discountType,
        percentage: discount.percentage,
        amount: discount.amount,
        idNumber: value,
      });
    } else if (discountType === "pwd" || discountType === "senior") {
      // Reset discount if ID is invalid but keep the type selected
      onDiscountChange({
        type: discountType,
        percentage: 0,
        amount: 0,
        idNumber: value,
      });

      if (value.length > 0 && value.length < 3) {
        setError("ID number must be at least 3 characters");
      } else if (value.length === 0) {
        setError(`${discountType.toUpperCase()} ID number is required`);
      }
    }
  };

  // Handle custom percentage change
  const handleCustomPercentageChange = (value) => {
    const percentage = Math.min(Math.max(parseFloat(value) || 0, 0), 100);
    setCustomPercentage(percentage);

    // Update discount calculation immediately for custom percentage
    if (discountType === "custom") {
      const discount = calculateDiscount("custom", percentage);
      onDiscountChange({
        type: "custom",
        percentage: discount.percentage,
        amount: discount.amount,
        idNumber: "",
      });
    }
  };

  const currentDiscountData = calculateDiscount(discountType, customPercentage);

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Percent className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-800">Discount Options</h3>
      </div>

      {/* Discount Type Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {discountOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = discountType === option.value;

          return (
            <button
              key={option.value}
              onClick={() => handleDiscountTypeChange(option.value)}
              className={`
                p-3 rounded-lg border transition-all duration-200 text-left
                ${
                  isSelected
                    ? `${option.color} border-current ring-2 ring-current ring-opacity-20`
                    : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <IconComponent className="w-4 h-4" />
                <span className="font-medium text-sm">{option.label}</span>
              </div>
              <p className="text-xs opacity-75">{option.description}</p>
            </button>
          );
        })}
      </div>

      {/* ID Number Input for PWD/Senior */}
      {showIdInput && (discountType === "pwd" || discountType === "senior") && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {discountType === "pwd"
              ? "PWD ID Number"
              : "Senior Citizen ID Number"}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => handleIdNumberChange(e.target.value)}
            placeholder={`Enter ${
              discountType === "pwd" ? "PWD" : "Senior Citizen"
            } ID number`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Custom Percentage Input */}
      {discountType === "custom" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Percentage
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={customPercentage}
              onChange={(e) => handleCustomPercentageChange(e.target.value)}
              placeholder="0"
              min="0"
              max="100"
              step="0.1"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="text-gray-500 font-medium">%</span>
          </div>
        </div>
      )}

      {/* Discount Summary */}
      {discountType !== "none" && currentDiscountData.amount > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="font-medium">₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-green-600">
              Discount ({currentDiscountData.percentage}%):
            </span>
            <span className="font-medium text-green-600">
              -₱{currentDiscountData.amount.toFixed(2)}
            </span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">Final Total:</span>
              <span className="font-bold text-lg text-gray-800">
                ₱{(subtotal - currentDiscountData.amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legal Compliance Note */}
      {(discountType === "pwd" || discountType === "senior") && (
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Legal Compliance:</strong> 20% discount as mandated by
            Philippine law. Valid ID required for verification.
          </p>
        </div>
      )}
    </div>
  );
};

// Import the X icon
const X = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default DiscountSelector;
