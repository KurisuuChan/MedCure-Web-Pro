import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Tag,
  Archive,
} from "lucide-react";

export default function ProductSearch({
  onSearch,
  onFilter,
  filterOptions = { drugClassifications: [], categories: [] },
  currentFilters = {},
  searchTerm: initialSearchTerm = "",
  className = "",
  setShowCategoriesModal,
  setShowArchivedModal,
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filters, setFilters] = useState({
    category: "All Categories",
    stockStatus: "All",
    expiryStatus: "All",
    drugClassification: "All",
    dosageStrength: "All",
    dosageForm: "All",
    ...currentFilters,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  // Apply filters
  useEffect(() => {
    onFilter(filters);
  }, [filters, onFilter]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: "All Categories",
      stockStatus: "All",
      expiryStatus: "All",
      drugClassification: "All",
      dosageStrength: "All",
      dosageForm: "All",
    };
    setFilters(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== "All Categories" && value !== "All" && value !== ""
  );

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
    >
      {/* Main Search Bar */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by brand name, generic name, category, dosage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Categories Button - Icon Only with Tooltip */}
        {setShowCategoriesModal && (
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="group flex items-center justify-center w-10 h-10 bg-white border border-gray-300 text-purple-600 rounded-lg hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 shadow-sm hover:shadow"
            title="Manage Categories"
            aria-label="Manage Categories"
          >
            <Tag className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          </button>
        )}

        {/* Filters Button */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all duration-200 shadow-sm font-medium ${
            showAdvancedFilters || hasActiveFilters
              ? "border-blue-500 bg-blue-50 text-blue-700 shadow"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-1 font-semibold">
              {
                Object.values(filters).filter(
                  (value) => value !== "All Categories" && value !== "All"
                ).length
              }
            </span>
          )}
        </button>

        {/* Archived Button - Icon Only with Tooltip */}
        {setShowArchivedModal && (
          <button
            onClick={() => setShowArchivedModal(true)}
            className="group flex items-center justify-center w-10 h-10 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-all duration-200 shadow-sm hover:shadow"
            title="View Archived Products"
            aria-label="View Archived Products"
          >
            <Archive className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All Categories">All Categories</option>
                {filterOptions.categories?.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Status
              </label>
              <select
                value={filters.stockStatus}
                onChange={(e) =>
                  handleFilterChange("stockStatus", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Stock Levels</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Expiry Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Status
              </label>
              <select
                value={filters.expiryStatus}
                onChange={(e) =>
                  handleFilterChange("expiryStatus", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Products</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="good">Good Condition</option>
              </select>
            </div>

            {/* Drug Classification Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drug Classification
              </label>
              <select
                value={filters.drugClassification}
                onChange={(e) =>
                  handleFilterChange("drugClassification", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Classifications</option>
                {filterOptions.drugClassifications.map((classification) => (
                  <option key={classification} value={classification}>
                    {classification}
                  </option>
                ))}
              </select>
            </div>

            {/* Dosage Strength Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosage Strength
              </label>
              <select
                value={filters.dosageStrength}
                onChange={(e) =>
                  handleFilterChange("dosageStrength", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Strengths</option>
                {filterOptions.dosageStrengths?.map((strength) => (
                  <option key={strength} value={strength}>
                    {strength}
                  </option>
                ))}
              </select>
            </div>

            {/* Dosage Form Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosage Form
              </label>
              <select
                value={filters.dosageForm}
                onChange={(e) =>
                  handleFilterChange("dosageForm", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Forms</option>
                {filterOptions.dosageForms?.map((form) => (
                  <option key={form} value={form}>
                    {form}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="h-3 w-3" />
                <span>Clear all filters</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && !showAdvancedFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(filters).map(([key, value]) => {
            if (value === "All Categories" || value === "All") return null;

            return (
              <span
                key={key}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                <span>{value}</span>
                <button
                  onClick={() =>
                    handleFilterChange(
                      key,
                      key === "category" ? "All Categories" : "All"
                    )
                  }
                  className="hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
