import React from "react";
import { Grid, List, RefreshCw, Package } from "lucide-react";
import ProductCard from "./ProductCard";
import ProductRow from "./ProductRow";

/**
 * Product List Section Component
 * Handles both grid and table view of products with pagination
 */
function ProductListSection({
  viewMode,
  setViewMode,
  paginatedProducts,
  filteredProducts,
  isLoading,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  transformProduct,
  handleViewProduct,
  handleEditProduct,
  handleArchiveProduct,
  loadProducts,
}) {
  const startIndex = (currentPage - 1) * itemsPerPage;

  const handleRefresh = () => {
    if (loadProducts) {
      loadProducts();
    }
  };

  return (
    <>
      {/* View Controls and Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of{" "}
          {filteredProducts.length} products
        </p>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`group flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              title="Grid View"
            >
              <Grid
                className={`h-4 w-4 ${
                  viewMode === "grid" ? "scale-110" : "group-hover:scale-110"
                } transition-transform duration-200`}
              />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`group flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                viewMode === "table"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              title="Table View"
            >
              <List
                className={`h-4 w-4 ${
                  viewMode === "table" ? "scale-110" : "group-hover:scale-110"
                } transition-transform duration-200`}
              />
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={transformProduct(product)}
              onEdit={handleEditProduct}
              onView={handleViewProduct}
              onDelete={handleArchiveProduct}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dosage Strength
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dosage Form
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Drug Classification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onView={() => handleViewProduct(product)}
                    onEdit={() => handleEditProduct(product)}
                    onDelete={() => handleArchiveProduct(product)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-6 py-4 border-2 border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              Page{" "}
              <span className="text-blue-600 font-semibold">{currentPage}</span>{" "}
              of{" "}
              <span className="text-blue-600 font-semibold">{totalPages}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="group flex items-center space-x-1 px-4 py-2 text-sm font-medium border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-500 transition-all duration-200"
              >
                <span>Previous</span>
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="group flex items-center space-x-1 px-4 py-2 text-sm font-medium border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-500 transition-all duration-200"
              >
                <span>Next</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductListSection;
