import { useState, useMemo, useEffect } from "react";
import { inventoryService } from "../../../services/domains/inventory/inventoryService";
import { ProductService } from "../../../services/domains/inventory/productService";

export function useInventory() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "All Categories",
    stockStatus: "All",
    expiryStatus: "All",
    drugClassification: "All",
    dosageStrength: "All",
    dosageForm: "All",
  });
  const [filterOptions, setFilterOptions] = useState({
    drugClassifications: [],
    categories: [],
    dosageStrengths: [],
    dosageForms: [],
  });
  const [sortBy, setSortBy] = useState("generic_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(false);

  // Load products and filter options on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // Always get all products and filter locally for better reliability
      const data = await inventoryService.getProducts();

      // Debug logging for development
      if (import.meta.env.DEV) {
        console.log("🗃️ Loaded Products:", {
          count: data.length,
          sampleProduct:
            data.length > 0
              ? {
                  id: data[0].id,
                  generic_name: data[0].generic_name,
                  brand_name: data[0].brand_name,
                  dosage_form: data[0].dosage_form,
                  dosage_strength: data[0].dosage_strength,
                  manufacturer: data[0].manufacturer,
                  drug_classification: data[0].drug_classification,
                }
              : null,
          hasNewSchema: data.length > 0 && data[0].generic_name !== undefined,
          searchTerm: searchTerm,
          filters: filters,
          firstFewProducts: data.slice(0, 3).map((p) => ({
            id: p.id,
            generic_name: p.generic_name,
            brand_name: p.brand_name,
            stock: p.stock_in_pieces,
            price: p.price_per_piece,
            reorder_level: p.reorder_level,
            expiry_date: p.expiry_date,
            manufacturer: p.manufacturer,
            drug_classification: p.drug_classification,
            is_archived: p.is_archived,
          })),
        });
      }

      setProducts(data);

      // Load filter options with the loaded data
      await loadFilterOptions(data);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async (productsData = products) => {
    try {
      const options = await ProductService.getFilterOptions();

      // Extract dosage strengths and forms from current products
      const dosageStrengths = [
        ...new Set(
          productsData
            .filter((p) => p.dosage_strength)
            .map((p) => p.dosage_strength)
        ),
      ].sort();

      const dosageForms = [
        ...new Set(
          productsData.filter((p) => p.dosage_form).map((p) => p.dosage_form)
        ),
      ].sort();

      const enhancedOptions = {
        ...options,
        dosageStrengths,
        dosageForms,
      };

      setFilterOptions(enhancedOptions);
      console.log("✅ Loaded filter options:", enhancedOptions);
    } catch (error) {
      console.error("❌ Error loading filter options:", error);
    }
  };

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter out archived products by default
    console.log("🔍 Before filtering archived:", filtered.length, "products");
    console.log("🔍 Sample products with archive status:", filtered.slice(0, 3).map(p => ({
      id: p.id,
      name: p.generic_name || p.name,
      is_archived: p.is_archived,
      is_active: p.is_active
    })));
    
    filtered = filtered.filter((product) => !product.is_archived);
    console.log("🔍 After filtering archived:", filtered.length, "products");

    // Apply search filter - enhanced for medicine schema
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      console.log("🔍 Searching for:", term, "in", products.length, "products");

      filtered = filtered.filter(
        (product) =>
          // Primary medicine fields - ensure brand and generic name are searchable
          (product.generic_name &&
            product.generic_name.toLowerCase().includes(term)) ||
          (product.brand_name &&
            product.brand_name.toLowerCase().includes(term)) ||
          (product.dosage_strength &&
            product.dosage_strength.toLowerCase().includes(term)) ||
          (product.drug_classification &&
            product.drug_classification.toLowerCase().includes(term)) ||
          // Standard fields
          (product.category && product.category.toLowerCase().includes(term)) ||
          (product.description &&
            product.description.toLowerCase().includes(term)) ||
          (product.sku && product.sku.toLowerCase().includes(term))
      );

      console.log("✅ Search results:", filtered.length, "products found");
    }

    // Apply category filter
    if (filters.category !== "All Categories") {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    }

    // Apply stock status filter
    if (filters.stockStatus !== "All") {
      filtered = filtered.filter((product) => {
        if (filters.stockStatus === "in_stock") {
          return product.stock_in_pieces > product.reorder_level;
        } else if (filters.stockStatus === "low_stock") {
          // ✅ FIXED: Match dashboard logic - include all items at or below reorder level
          const reorderLevel = product.reorder_level || 10;
          return product.stock_in_pieces <= reorderLevel;
        } else if (filters.stockStatus === "out_of_stock") {
          return product.stock_in_pieces <= 0;
        }
        return true;
      });
    }

    // Apply expiry status filter
    if (filters.expiryStatus !== "All") {
      const today = new Date();
      filtered = filtered.filter((product) => {
        if (!product.expiry_date) return filters.expiryStatus === "good";

        const expiry = new Date(product.expiry_date);
        const daysUntilExpiry = Math.ceil(
          (expiry - today) / (1000 * 60 * 60 * 24)
        );

        if (filters.expiryStatus === "expired") {
          return daysUntilExpiry < 0;
        } else if (filters.expiryStatus === "expiring_soon") {
          return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
        } else if (filters.expiryStatus === "good") {
          return daysUntilExpiry > 30;
        }
        return true;
      });
    }

    // Apply drug classification filter (NEW)
    if (filters.drugClassification !== "All") {
      filtered = filtered.filter(
        (product) => product.drug_classification === filters.drugClassification
      );
    }

    // Apply manufacturer filter (NEW)
    if (filters.manufacturer !== "All") {
      filtered = filtered.filter(
        (product) => product.manufacturer === filters.manufacturer
      );
    }

    // Apply dosage strength filter
    if (filters.dosageStrength !== "All") {
      filtered = filtered.filter(
        (product) => product.dosage_strength === filters.dosageStrength
      );
    }

    // Apply dosage form filter
    if (filters.dosageForm !== "All") {
      filtered = filtered.filter(
        (product) => product.dosage_form === filters.dosageForm
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle special cases for mock data properties
      if (sortBy === "stock") {
        aValue = a.stock_in_pieces;
        bValue = b.stock_in_pieces;
      } else if (sortBy === "price") {
        aValue = a.price_per_piece;
        bValue = b.price_per_piece;
      } else if (sortBy === "expiry") {
        aValue = a.expiry_date
          ? new Date(a.expiry_date)
          : new Date("9999-12-31");
        bValue = b.expiry_date
          ? new Date(b.expiry_date)
          : new Date("9999-12-31");
      }

      if (typeof aValue === "string" && aValue !== null) {
        aValue = aValue.toLowerCase();
        bValue =
          bValue && typeof bValue === "string" ? bValue.toLowerCase() : "";
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, filters, sortBy, sortOrder]);

  // Analytics
  const analytics = useMemo(() => {
    // Filter out archived products for analytics
    const activeProducts = products.filter((product) => !product.is_archived);

    // Debug logging for development
    if (import.meta.env.DEV) {
      console.log("📊 Analytics Debug:", {
        totalProductsInDB: products.length,
        archivedProducts: products.filter((p) => p.is_archived).length,
        activeProducts: activeProducts.length,
      });
    }

    const totalProducts = activeProducts.length;
    // ✅ FIXED: Use consistent low stock logic across the app
    const lowStockProducts = activeProducts.filter((p) => {
      const reorderLevel = p.reorder_level || 10;
      return p.stock_in_pieces <= reorderLevel;
    }).length;
    const outOfStockProducts = activeProducts.filter(
      (p) => p.stock_in_pieces <= 0
    ).length;

    const today = new Date();
    const expiringProducts = activeProducts.filter((p) => {
      if (!p.expiry_date) return false;
      const expiry = new Date(p.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiry - today) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length;

    const expiredProducts = activeProducts.filter((p) => {
      if (!p.expiry_date) return false;
      const expiry = new Date(p.expiry_date);
      return expiry < today;
    }).length;

    const totalValue = activeProducts.reduce(
      (sum, p) => sum + (p.price_per_piece || 0) * (p.stock_in_pieces || 0),
      0
    );

    // Debug logging for development
    if (import.meta.env.DEV) {
      console.log("📊 Analytics Results:", {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        expiringProducts,
        expiredProducts,
        totalValue: `₱${totalValue.toLocaleString()}`,
      });
    }

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      expiringProducts,
      expiredProducts,
      totalValue,
    };
  }, [products]);

  // CRUD Operations
  const addProduct = async (productData) => {
    setIsLoading(true);
    try {
      const newProduct = await inventoryService.addProduct(productData);
      setProducts((prev) => [...prev, newProduct]);
      return newProduct;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (id, productData) => {
    setIsLoading(true);
    try {
      const updatedProduct = await inventoryService.updateProduct(
        id,
        productData
      );
      setProducts((prev) =>
        prev.map((product) => (product.id === id ? updatedProduct : product))
      );
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    setIsLoading(true);
    try {
      await inventoryService.deleteProduct(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkUpdateStock = async (updates) => {
    setIsLoading(true);
    try {
      // For bulk updates, we'll need to call updateProduct for each item
      // In a real implementation, you might have a dedicated bulk endpoint
      for (const update of updates) {
        await inventoryService.updateProduct(update.id, {
          stock_in_pieces: update.stock,
        });
      }

      // Reload products to get fresh data
      await loadProducts();
    } catch (error) {
      console.error("Error bulk updating stock:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Search and filter handlers
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return {
    // Data
    products: filteredProducts,
    allProducts: products,
    analytics,
    filterOptions,

    // State
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    isLoading,

    // Actions
    addProduct,
    updateProduct,
    deleteProduct,
    bulkUpdateStock,
    loadProducts,
    loadFilterOptions,
    handleSearch,
    handleFilter,
    handleSort,
  };
}
