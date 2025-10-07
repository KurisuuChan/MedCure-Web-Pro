import React, { useState, useEffect, useCallback } from "react";
import { User, Users, CreditCard, AlertCircle } from "lucide-react";

const DiscountSelector = ({ onDiscountChange, subtotal = 0 }) => {
  const [discountType, setDiscountType] = useState("none");
  const [idNumber, setIdNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [errors, setErrors] = useState({});

  const discountOptions = [
    {
      value: "none",
      label: "No Discount",
      percentage: 0,
      icon: CreditCard,
      description: "Regular customer",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-700",
    },
    {
      value: "pwd",
      label: "PWD (20%)",
      percentage: 20,
      icon: User,
      description: "Person with Disability",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
    },
    {
      value: "senior",
      label: "Senior Citizen (20%)",
      percentage: 20,
      icon: Users,
      description: "60+ years old",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
    },
  ];

  // Calculate discount details
  const selectedOption = discountOptions.find(
    (opt) => opt.value === discountType
  );
  const discountAmount =
    discountType === "none" ? 0 : (subtotal * selectedOption.percentage) / 100;
  const finalTotal = subtotal - discountAmount;

  // Memoize the discount change handler to prevent infinite loops
  const handleDiscountUpdate = useCallback(() => {
    const newErrors = {};

    console.log("🔄 [DiscountSelector] Updating discount:", {
      discountType,
      subtotal,
      selectedOption: selectedOption?.label,
      percentage: selectedOption?.percentage,
      discountAmount,
      idNumber: idNumber.trim(),
      holderName: customerName.trim(),
    });

    if (discountType !== "none") {
      if (!idNumber.trim()) {
        newErrors.idNumber = `${selectedOption.label} ID is required`;
      } else if (idNumber.trim().length < 8) {
        newErrors.idNumber = "ID must be at least 8 characters";
      }

      if (!customerName.trim()) {
        newErrors.customerName = `${discountType === 'pwd' ? 'PWD holder' : 'Senior citizen'} name is required for discounts`;
      } else if (customerName.trim().length < 2) {
        newErrors.customerName = `${discountType === 'pwd' ? 'PWD holder' : 'Senior citizen'} name must be at least 2 characters`;
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    const discountData = {
      type: discountType,
      percentage: selectedOption.percentage,
      amount: discountAmount,
      subtotal: subtotal,
      finalTotal: finalTotal,
      idNumber: idNumber.trim(),
      holderName: customerName.trim(), // This is the PWD/Senior holder name (can be different from customer)
      customerName: customerName.trim(), // Keep for backward compatibility
      isValid:
        isValid &&
        (discountType === "none" || (idNumber.trim() && customerName.trim())),
      label: selectedOption.label,
      description: selectedOption.description,
    };

    console.log("📤 [DiscountSelector] Sending discount data:", discountData);
    console.log("🔍 [DiscountSelector] Holder name details:", {
      customerName_input: customerName,
      customerName_trimmed: customerName.trim(),
      holderName_in_data: discountData.holderName,
      idNumber: idNumber.trim(),
    });

    if (onDiscountChange) {
      onDiscountChange(discountData);
    }
  }, [
    discountType,
    idNumber,
    customerName,
    subtotal,
    selectedOption.percentage,
    selectedOption.label,
    selectedOption.description,
    discountAmount,
    finalTotal,
    onDiscountChange,
  ]);

  // Send discount data to parent component
  useEffect(() => {
    handleDiscountUpdate();
  }, [handleDiscountUpdate]);

  const handleDiscountTypeChange = (type) => {
    setDiscountType(type);
    if (type === "none") {
      setIdNumber("");
      setCustomerName("");
      setErrors({});
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-2 mb-4">
        <CreditCard className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Discount Options
        </h3>
      </div>

      {/* Discount Type Selection */}
      <div className="space-y-3 mb-4">
        {discountOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = discountType === option.value;

          return (
            <div
              key={option.value}
              className={`
                relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${
                  isSelected
                    ? `${option.bgColor} ${option.borderColor} ring-2 ring-blue-200`
                    : "bg-white border-gray-200 hover:border-gray-300"
                }
              `}
              onClick={() => handleDiscountTypeChange(option.value)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <IconComponent
                    className={`h-5 w-5 ${
                      isSelected ? option.textColor : "text-gray-500"
                    }`}
                  />
                  <div>
                    <div
                      className={`font-medium ${
                        isSelected ? option.textColor : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </div>

                {option.percentage > 0 && (
                  <div
                    className={`text-lg font-bold ${
                      isSelected ? option.textColor : "text-gray-600"
                    }`}
                  >
                    -{option.percentage}%
                  </div>
                )}

                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ID and Customer Information (shown when discount is selected) */}
      {discountType !== "none" && (
        <div
          className={`space-y-4 p-4 rounded-lg ${selectedOption.bgColor} border ${selectedOption.borderColor}`}
        >
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className={`h-4 w-4 ${selectedOption.textColor}`} />
            <span className={`text-sm font-medium ${selectedOption.textColor}`}>
              {selectedOption.label} Information Required
            </span>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {discountType === "pwd" ? "PWD Holder Name" : "Senior Citizen Name"} *
              <span className="text-xs text-gray-500 block">
                (Name of the person with {discountType === "pwd" ? "PWD" : "Senior Citizen"} ID)
              </span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={`Enter ${discountType === "pwd" ? "PWD holder's" : "senior citizen's"} full name`}
              className={`
                w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  errors.customerName
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }
              `}
            />
            {errors.customerName && (
              <p className="text-red-600 text-sm mt-1">{errors.customerName}</p>
            )}
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {discountType === "pwd"
                ? "PWD ID Number"
                : "Senior Citizen ID Number"}{" "}
              *
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
              placeholder={`Enter ${
                discountType === "pwd" ? "PWD" : "Senior Citizen"
              } ID number`}
              className={`
                w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  errors.idNumber
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }
              `}
            />
            {errors.idNumber && (
              <p className="text-red-600 text-sm mt-1">{errors.idNumber}</p>
            )}
          </div>

          {/* Legal Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Legal Requirement:</p>
                <p>
                  {discountType === "pwd"
                    ? "Valid PWD ID must be presented. 20% discount applies per RA 10754."
                    : "Valid Senior Citizen ID must be presented. 20% discount applies per RA 9994."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Summary */}
      {subtotal > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Order Summary</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₱{subtotal.toFixed(2)}</span>
            </div>

            {discountType !== "none" && (
              <div className="flex justify-between text-green-600">
                <span>{selectedOption.label} Discount:</span>
                <span className="font-medium">
                  -₱{discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total:</span>
                <span>₱{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {discountType !== "none" && (
              <div className="text-xs text-gray-500 text-center mt-2">
                You saved ₱{discountAmount.toFixed(2)} (
                {selectedOption.percentage}%)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountSelector;
