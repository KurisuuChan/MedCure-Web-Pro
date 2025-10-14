import React, { useState, useEffect } from "react";
import { Tag, RefreshCw, Plus, Edit2, Trash2, Package, X } from "lucide-react";
import { UnifiedCategoryService } from "../../../services/domains/inventory/unifiedCategoryService";
import { supabase } from "../../../config/supabase";

/**
 * Category Management Component
 * Professional UI for managing product categories with CRUD operations
 */
export default function CategoryManagement({ onClose, onCategoriesChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log("🏷️ [CategoryManagement] Loading categories");

      const result = await UnifiedCategoryService.getAllCategories({
        activeOnly: true,
      });

      if (result.success) {
        console.log(
          `📦 [CategoryManagement] Fetched ${
            result.data?.length || 0
          } categories`
        );

        // Fetch product counts for each category
        const categoriesWithCounts = await Promise.all(
          (result.data || []).map(async (category) => {
            try {
              console.log(
                `🔍 [CategoryManagement] Counting products for "${category.name}"`
              );

              // Query products table to count products in this category
              // Use case-insensitive matching with ilike
              const { count, error } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .ilike("category", category.name)
                .eq("is_archived", false);

              if (error) {
                console.error(
                  `❌ Error counting products for category "${category.name}":`,
                  error
                );
                return { ...category, product_count: 0 };
              }

              console.log(
                `📊 Category "${category.name}" has ${count || 0} products`
              );

              // Also try to fetch a sample product to verify the match if count is 0
              if (count === 0) {
                console.warn(
                  `⚠️ Category "${category.name}" has 0 products - checking for similar matches`
                );

                const { data: sampleProducts, error: sampleError } =
                  await supabase
                    .from("products")
                    .select("category")
                    .eq("is_archived", false)
                    .limit(100);

                if (sampleError) {
                  console.error(
                    `❌ Error fetching sample products:`,
                    sampleError
                  );
                } else if (sampleProducts && sampleProducts.length > 0) {
                  // Check if there are products with similar category names
                  const similarProducts = sampleProducts.filter(
                    (p) =>
                      p.category &&
                      (p.category
                        .toLowerCase()
                        .includes(category.name.toLowerCase()) ||
                        category.name
                          .toLowerCase()
                          .includes(p.category.toLowerCase()))
                  );

                  if (similarProducts.length > 0) {
                    console.warn(
                      `⚠️ Category "${category.name}" has 0 exact matches but ${similarProducts.length} similar matches.`,
                      `Sample product categories:`,
                      similarProducts.slice(0, 5).map((p) => p.category)
                    );
                  } else {
                    console.log(
                      `ℹ️ No similar category names found. Available categories in products:`,
                      [
                        ...new Set(
                          sampleProducts.map((p) => p.category).filter(Boolean)
                        ),
                      ].slice(0, 10)
                    );
                  }
                }
              }

              return { ...category, product_count: count || 0 };
            } catch (err) {
              console.error(`❌ Error for category "${category.name}":`, err);
              return { ...category, product_count: 0 };
            }
          })
        );

        setCategories(categoriesWithCounts);
        console.log(
          `✅ [CategoryManagement] Loaded ${categoriesWithCounts.length} categories with product counts`,
          categoriesWithCounts.map((c) => ({
            name: c.name,
            count: c.product_count,
          }))
        );
      } else {
        console.error(
          "❌ [CategoryManagement] Error loading categories:",
          result.error
        );
        setCategories([]);
      }
    } catch (error) {
      console.error("❌ [CategoryManagement] Error loading categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      console.log("➕ [CategoryManagement] Creating category");

      const result = await UnifiedCategoryService.createCategory(categoryData, {
        userId: "current-user",
        source: "category_management",
        description: "Category created from Inventory Management",
      });

      if (result.success) {
        if (result.action === "existing") {
          alert(`Info: ${result.message}`);
        } else if (result.action === "similar_found") {
          const useExisting = window.confirm(
            `${result.message}\n\nDo you want to use the existing category "${result.existingCategory.name}" instead?`
          );

          if (!useExisting) {
            const newName = window.prompt(
              `Please enter a different name for the category:`,
              result.proposedCategory.name + " (New)"
            );

            if (newName && newName.trim()) {
              const retryResult = await UnifiedCategoryService.createCategory(
                {
                  ...categoryData,
                  name: newName.trim(),
                },
                {
                  userId: "current-user",
                  source: "category_management",
                }
              );

              if (retryResult.success && retryResult.action === "created") {
                setCategories([...categories, retryResult.data]);
                setShowCreateModal(false);
              }
            }
            return;
          }
        } else if (result.action === "created") {
          setCategories([...categories, result.data]);
          setShowCreateModal(false);
          alert(`Success: Category "${result.data.name}" created!`);
        }

        loadCategories(); // Refresh list
      } else {
        alert(`Failed to create category: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error("❌ [CategoryManagement] Error creating category:", error);
      alert("Failed to create category");
    }
  };

  const handleUpdateCategory = async (categoryId, updates) => {
    try {
      console.log(`✏️ [CategoryManagement] Updating category ${categoryId}`);

      const result = await UnifiedCategoryService.updateCategory(
        categoryId,
        updates,
        {
          userId: "current-user",
        }
      );

      if (result.success) {
        setEditingCategory(null);
        alert("Category updated successfully!");
        loadCategories(); // Refresh list with updated counts
      } else {
        alert(`Failed to update category: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ [CategoryManagement] Error updating category:", error);
      alert("Failed to update category");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    )
      return;

    try {
      console.log(`🗑️ [CategoryManagement] Deleting category ${categoryId}`);

      const result = await UnifiedCategoryService.deleteCategory(categoryId, {
        userId: "current-user",
      });

      if (result.success) {
        alert("Category deleted successfully!");
        loadCategories(); // Refresh list with updated counts
      } else {
        alert(`Failed to delete category: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ [CategoryManagement] Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-gray-600">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden">
      {/* Modal Header - Sticky */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Tag className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Category Management
            </h3>
            <p className="text-sm text-gray-600">
              Organize your inventory with custom categories
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
        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span className="font-medium">Add Category</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total Categories
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {categories.length}
                </p>
              </div>
              <div className="bg-blue-200 p-3 rounded-xl">
                <Tag className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Categories with Products
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {categories.filter((cat) => cat.product_count > 0).length}
                </p>
              </div>
              <button
                onClick={loadCategories}
                className="bg-green-200 p-3 rounded-xl hover:bg-green-300 transition-colors"
                title="Refresh Categories"
              >
                <RefreshCw className="h-6 w-6 text-green-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No categories yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Start organizing your inventory by creating your first category
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Create First Category</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
                      style={{ backgroundColor: category.color + "20" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {category.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">Category</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Edit category"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {category.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Products:{" "}
                    <span className="font-medium text-gray-700">
                      {category.product_count || 0}
                    </span>
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: category.color + "20",
                      color: category.color,
                    }}
                  >
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CategoryModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateCategory}
            title="Create New Category"
          />
        )}

        {editingCategory && (
          <CategoryModal
            category={editingCategory}
            onClose={() => setEditingCategory(null)}
            onSubmit={(data) => handleUpdateCategory(editingCategory.id, data)}
            title="Edit Category"
          />
        )}
      </div>
    </div>
  );
}

// Category Modal Component
function CategoryModal({ category, onClose, onSubmit, title }) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    color: category?.color || "#3B82F6",
    icon: category?.icon || "Package",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const colorPresets = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Pink", value: "#EC4899" },
    { name: "Orange", value: "#F59E0B" },
    { name: "Red", value: "#EF4444" },
    { name: "Indigo", value: "#6366F1" },
    { name: "Teal", value: "#14B8A6" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              <span>{title}</span>
            </h3>
            <button
              onClick={onClose}
              className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <X className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label
              htmlFor="categoryName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Category Name *
            </label>
            <input
              id="categoryName"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Antibiotics, Vitamins"
            />
          </div>

          <div>
            <label
              htmlFor="categoryDescription"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="categoryDescription"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder="Brief description of this category..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Color
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, color: preset.value })
                  }
                  className={`h-10 rounded-lg border-2 transition-all ${
                    formData.color === preset.value
                      ? "border-gray-900 scale-105 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
            <input
              type="color"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              {category ? "Update" : "Create"} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
