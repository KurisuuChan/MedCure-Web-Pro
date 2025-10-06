import React, { useState, useEffect } from "react";
import {
  Package,
  Pill,
  Building2,
  Shield,
  Thermometer,
  FileText,
  Save,
  X,
  AlertTriangle,
  Check,
  Info,
} from "lucide-react";

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Ointment",
  "Drops",
  "Inhaler",
];

const DRUG_CLASSIFICATIONS = [
  "Prescription (Rx)",
  "Over-the-Counter (OTC)",
  "Controlled Substance",
];

export default function EnhancedProductForm({
  product = null,
  onSave,
  onCancel,
  isOpen = false,
  categories = [],
  suppliers = [],
}) {
  const [formData, setFormData] = useState({
    // Basic Information
    generic_name: "",
    brand_name: "",
    category: "",
    description: "",

    // Medicine-Specific Details
    dosage_strength: "",
    dosage_form: "",
    drug_classification: "",
    pharmacologic_category: "",
    manufacturer: "",
    storage_conditions: "",
    registration_number: "",

    // Pricing and Stock
    price_per_piece: "",
    cost_price: "",
    pieces_per_sheet: 1,
    sheets_per_box: 1,
    reorder_level: 0,

    // Supplier Information
    supplier: "",
    supplier_lead_time_days: 7,

    // Additional Fields
    is_critical_medicine: false,
    sku: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing product data
  useEffect(() => {
    if (product) {
      setFormData({
        generic_name: product.generic_name || product.name || "",
        brand_name: product.brand_name || product.brand || "",
        category: product.category || "",
        description: product.description || "",
        dosage_strength: product.dosage_strength || "",
        dosage_form: product.dosage_form || "",
        drug_classification: product.drug_classification || "",
        pharmacologic_category: product.pharmacologic_category || "",
        manufacturer: product.manufacturer || "",
        storage_conditions: product.storage_conditions || "",
        registration_number: product.registration_number || "",
        price_per_piece: product.price_per_piece || "",
        cost_price: product.cost_price || "",
        pieces_per_sheet: product.pieces_per_sheet || 1,
        sheets_per_box: product.sheets_per_box || 1,
        reorder_level: product.reorder_level || 0,
        supplier: product.supplier || "",
        supplier_lead_time_days: product.supplier_lead_time_days || 7,
        is_critical_medicine: product.is_critical_medicine || false,
        sku: product.sku || "",
      });
    } else {
      // Reset form for new product
      setFormData({
        generic_name: "",
        brand_name: "",
        category: "",
        description: "",
        dosage_strength: "",
        dosage_form: "",
        drug_classification: "",
        pharmacologic_category: "",
        manufacturer: "",
        storage_conditions: "",
        registration_number: "",
        price_per_piece: "",
        cost_price: "",
        pieces_per_sheet: 1,
        sheets_per_box: 1,
        reorder_level: 0,
        supplier: "",
        supplier_lead_time_days: 7,
        is_critical_medicine: false,
        sku: "",
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.generic_name.trim()) {
      newErrors.generic_name = "Generic name is required";
    }
    if (!formData.brand_name.trim()) {
      newErrors.brand_name = "Brand name is required";
    }
    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }
    if (
      !formData.price_per_piece ||
      parseFloat(formData.price_per_piece) <= 0
    ) {
      newErrors.price_per_piece = "Valid price per piece is required";
    }
    if (!formData.dosage_form) {
      newErrors.dosage_form = "Dosage form is required";
    }
    if (!formData.drug_classification) {
      newErrors.drug_classification = "Drug classification is required";
    }

    // Registration number format validation (basic)
    if (
      formData.registration_number &&
      !/^[A-Z0-9-]+$/i.test(formData.registration_number)
    ) {
      newErrors.registration_number =
        "Registration number should contain only letters, numbers, and hyphens";
    }

    // Pricing validation
    if (formData.cost_price && formData.price_per_piece) {
      const cost = parseFloat(formData.cost_price);
      const price = parseFloat(formData.price_per_piece);
      if (cost > price) {
        newErrors.cost_price = "Cost price should not exceed selling price";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving product:", error);
      setErrors({ submit: "Failed to save product. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6" />
              <h2 className="text-xl font-bold">
                {product ? "Edit Product" : "Add New Product"}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(90vh-120px)] overflow-y-auto"
        >
          <div className="p-6 space-y-6">
            {/* Basic Product Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generic Name *
                  </label>
                  <input
                    type="text"
                    value={formData.generic_name}
                    onChange={(e) =>
                      handleInputChange("generic_name", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.generic_name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g., Paracetamol"
                  />
                  {errors.generic_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.generic_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    value={formData.brand_name}
                    onChange={(e) =>
                      handleInputChange("brand_name", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.brand_name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g., Tylenol"
                  />
                  {errors.brand_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.brand_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.category ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Product SKU"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Product description..."
                  />
                </div>
              </div>
            </div>

            {/* Medicine-Specific Details */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Pill className="h-5 w-5 text-blue-600" />
                Medicine Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage Strength
                  </label>
                  <input
                    type="text"
                    value={formData.dosage_strength}
                    onChange={(e) =>
                      handleInputChange("dosage_strength", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 500mg, 10mg/5ml"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage Form *
                  </label>
                  <select
                    value={formData.dosage_form}
                    onChange={(e) =>
                      handleInputChange("dosage_form", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.dosage_form ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Dosage Form</option>
                    {DOSAGE_FORMS.map((form) => (
                      <option key={form} value={form}>
                        {form}
                      </option>
                    ))}
                  </select>
                  {errors.dosage_form && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.dosage_form}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drug Classification *
                  </label>
                  <select
                    value={formData.drug_classification}
                    onChange={(e) =>
                      handleInputChange("drug_classification", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.drug_classification
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Classification</option>
                    {DRUG_CLASSIFICATIONS.map((classification) => (
                      <option key={classification} value={classification}>
                        {classification}
                      </option>
                    ))}
                  </select>
                  {errors.drug_classification && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.drug_classification}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pharmacologic Category
                  </label>
                  <input
                    type="text"
                    value={formData.pharmacologic_category}
                    onChange={(e) =>
                      handleInputChange(
                        "pharmacologic_category",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Antibiotic, Analgesic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={(e) =>
                      handleInputChange("registration_number", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.registration_number
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="e.g., FDA-RX-2024-001234"
                  />
                  {errors.registration_number && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.registration_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <span>Critical Medicine</span>
                      <input
                        type="checkbox"
                        checked={formData.is_critical_medicine}
                        onChange={(e) =>
                          handleInputChange(
                            "is_critical_medicine",
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Manufacturer & Storage */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Manufacturer & Storage
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      handleInputChange("manufacturer", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., GlaxoSmithKline"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <select
                    value={formData.supplier}
                    onChange={(e) =>
                      handleInputChange("supplier", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier} value={supplier}>
                        {supplier}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Conditions
                  </label>
                  <textarea
                    value={formData.storage_conditions}
                    onChange={(e) =>
                      handleInputChange("storage_conditions", e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Store at room temperature below 25°C"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-yellow-600" />
                Pricing & Stock Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) =>
                      handleInputChange("cost_price", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.cost_price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                  {errors.cost_price && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.cost_price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Piece *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_per_piece}
                    onChange={(e) =>
                      handleInputChange("price_per_piece", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.price_per_piece
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                  {errors.price_per_piece && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.price_per_piece}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      handleInputChange(
                        "reorder_level",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    Pieces per Sheet
                    <span className="text-xs text-gray-500 font-normal">
                      (e.g., 10 for blister pack)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.pieces_per_sheet}
                    onChange={(e) =>
                      handleInputChange(
                        "pieces_per_sheet",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many pieces in one sheet/blister
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    Sheets per Box
                    <span className="text-xs text-gray-500 font-normal">
                      (Set to 1 for retail)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sheets_per_box}
                    onChange={(e) =>
                      handleInputChange(
                        "sheets_per_box",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set to 1 to hide box option in POS
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.supplier_lead_time_days}
                    onChange={(e) =>
                      handleInputChange(
                        "supplier_lead_time_days",
                        parseInt(e.target.value) || 7
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-700">{errors.submit}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{product ? "Update Product" : "Create Product"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
