import React, { useState, useEffect } from "react";
import {
  Archive,
  RefreshCw,
  RotateCcw,
  Search,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  Filter,
  X,
} from "lucide-react";
import { supabase } from "../../../config/supabase";
import { formatCurrency } from "../../../utils/formatting";

/**
 * Archived Products Management Component
 * Professional UI for viewing and restoring archived products
 */
export default function ArchivedProductsManagement({ onClose, onRestore }) {
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReason, setFilterReason] = useState("all");

  useEffect(() => {
    loadArchivedProducts();
  }, []);

  const loadArchivedProducts = async () => {
    try {
      setLoading(true);
      console.log("📦 [ArchivedProducts] Loading archived products");

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_archived", true)
        .order("archived_at", { ascending: false });

      if (error) throw error;

      setArchivedProducts(data || []);
      console.log(
        `✅ [ArchivedProducts] Loaded ${data?.length || 0} archived products`,
        data?.[0] // Log first product to see structure
      );
    } catch (error) {
      console.error("❌ [ArchivedProducts] Error loading:", error);
      setArchivedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProduct = async (product) => {
    const productName =
      product.name ||
      product.product_name ||
      product.generic_name ||
      "this product";
    if (!window.confirm(`Are you sure you want to restore "${productName}"?`))
      return;

    try {
      console.log(`🔄 [ArchivedProducts] Restoring product ${product.id}`);

      const { error } = await supabase
        .from("products")
        .update({
          is_archived: false,
          archived_at: null,
          archived_by: null,
          archive_reason: null,
        })
        .eq("id", product.id);

      if (error) throw error;

      setArchivedProducts(archivedProducts.filter((p) => p.id !== product.id));
      const productName =
        product.name ||
        product.product_name ||
        product.generic_name ||
        "Product";
      alert(`✅ Product "${productName}" has been restored successfully!`);

      // Call onRestore callback to refresh parent inventory
      if (onRestore) onRestore();
    } catch (error) {
      console.error("❌ [ArchivedProducts] Error restoring:", error);
      alert("Failed to restore product. Please try again.");
    }
  };

  const handleBulkRestore = async () => {
    if (filteredProducts.length === 0) {
      alert("No products to restore");
      return;
    }

    if (
      !window.confirm(
        `Restore all ${filteredProducts.length} filtered products?`
      )
    )
      return;

    try {
      const ids = filteredProducts.map((p) => p.id);

      const { error } = await supabase
        .from("products")
        .update({
          is_archived: false,
          archived_at: null,
          archived_by: null,
          archive_reason: null,
        })
        .in("id", ids);

      if (error) throw error;

      await loadArchivedProducts();
      alert(`✅ Successfully restored ${filteredProducts.length} products!`);
    } catch (error) {
      console.error("❌ [ArchivedProducts] Bulk restore error:", error);
      alert("Failed to restore products. Please try again.");
    }
  };

  // Filter products
  const filteredProducts = archivedProducts.filter((product) => {
    // If no search term, don't filter by search
    const productName =
      product.name || product.product_name || product.generic_name || "";
    const productBrand = product.brand || product.brand_name || "";
    const matchesSearch =
      !searchTerm ||
      productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productBrand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesReason =
      filterReason === "all" || product.archive_reason === filterReason;

    return matchesSearch && matchesReason;
  });

  // Get unique archive reasons
  const archiveReasons = [
    ...new Set(archivedProducts.map((p) => p.archive_reason).filter(Boolean)),
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-gray-600">Loading archived products...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden">
      {/* Modal Header - Sticky */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-xl">
            <Archive className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Archived Products
            </h3>
            <p className="text-sm text-gray-600">
              View and restore previously archived products
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
        >
          <X className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-6"
        style={{ maxHeight: "calc(90vh - 88px)" }}
      >
        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={loadArchivedProducts}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="font-medium">Refresh</span>
          </button>
          {filteredProducts.length > 0 && (
            <button
              onClick={handleBulkRestore}
              className="flex items-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="font-medium">
                Restore All ({filteredProducts.length})
              </span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Total Archived
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {archivedProducts.length}
                </p>
              </div>
              <div className="bg-gray-200 p-3 rounded-xl">
                <Archive className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Filtered Results
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {filteredProducts.length}
                </p>
              </div>
              <div className="bg-blue-200 p-3 rounded-xl">
                <Filter className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Can Restore
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {filteredProducts.length}
                </p>
              </div>
              <div className="bg-green-200 p-3 rounded-xl">
                <RotateCcw className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Archive Reasons</option>
                {archiveReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason || "No reason provided"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
            {archivedProducts.length === 0 ? (
              <>
                <Archive className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No archived products
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Products that are archived will appear here for easy
                  restoration
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Try adjusting your search or filter criteria
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archived Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archive Reason
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name ||
                                product.product_name ||
                                product.generic_name ||
                                "Unnamed Product"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.brand ||
                                product.brand_name ||
                                "No brand"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {product.archived_at
                              ? new Date(
                                  product.archived_at
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {product.archive_reason || "No reason provided"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRestoreProduct(product)}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span className="font-medium">Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Info */}
        {filteredProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Restoration Information</p>
                <p>
                  Restored products will be immediately available in your active
                  inventory. All product information, pricing, and stock levels
                  will be preserved.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
