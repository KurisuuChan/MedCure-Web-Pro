import { useState, useMemo, useEffect } from "react";
import { inventoryService } from "../../../services/domains/inventory/inventoryService";
import { ProductService } from "../../../services/domains/inventory/productService";

export function useInventory() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "All Categories",
    brand: "All Brands",
    stockStatus: "All",
    expiryStatus: "All",
    drugClassification: "All",
    manufacturer: "All"
  });
  const [filterOptions, setFilterOptions] = useState({
    manufacturers: [],
    drugClassifications: [],
    categories: []
  });
  const [sortBy, setSortBy] = useState("generic_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(false);

  // Load products and filter options on mount
  useEffect(() => {
    loadProducts();
    loadFilterOptions();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // Use enhanced search if search term exists, otherwise get all products
      let data;
      if (searchTerm || filters.drugClassification !== "All" || filters.manufacturer !== "All") {
        data = await ProductService.searchProductsFiltered({
          searchTerm: searchTerm,
          drugClassification: filters.drugClassification === "All" ? "" : filters.drugClassification,
          manufacturer: filters.manufacturer === "All" ? "" : filters.manufacturer,
          category: filters.category === "All Categories" ? "" : filters.category,
          limit: 200
        });
      } else {
        data = await inventoryService.getProducts();
      }

      // Debug logging for development
      if (import.meta.env.DEV) {
        console.log("🗃️ Loaded Products:", {
          count: data.length,
          sampleProduct: data.length > 0 ? {
            id: data[0].id,
            generic_name: data[0].generic_name,
            brand_name: data[0].brand_name,
            dosage_form: data[0].dosage_form,
            dosage_strength: data[0].dosage_strength,
            manufacturer: data[0].manufacturer,
            drug_classification: data[0].drug_classification
          } : null,
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
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const options = await ProductService.getFilterOptions();
      setFilterOptions(options);
      console.log('✅ Loaded filter options:', options);
    } catch (error) {
      console.error('❌ Error loading filter options:', error);
    }
  };

  // Trigger search when search term or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters.drugClassification, filters.manufacturer, filters.category]);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter out archived products by default
    filtered = filtered.filter((product) => !product.is_archived);

    // Apply search filter - enhanced for medicine schema
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          // Primary medicine fields (new schema)
          (product.generic_name && product.generic_name.toLowerCase().includes(term)) ||
          (product.brand_name && product.brand_name.toLowerCase().includes(term)) ||
          (product.manufacturer && product.manufacturer.toLowerCase().includes(term)) ||
          (product.dosage_strength && product.dosage_strength.toLowerCase().includes(term)) ||
          (product.pharmacologic_category && product.pharmacologic_category.toLowerCase().includes(term)) ||
          (product.registration_number && product.registration_number.toLowerCase().includes(term)) ||
          // Fallback to legacy fields for backward compatibility
          (product.name && product.name.toLowerCase().includes(term)) ||
          (product.brand && product.brand.toLowerCase().includes(term)) ||
          // Standard fields
          (product.category && product.category.toLowerCase().includes(term)) ||
          (product.description && product.description.toLowerCase().includes(term)) ||
          (product.sku && product.sku.toLowerCase().includes(term))
      );
    }

    // Apply category filter
    if (filters.category !== "All Categories") {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    }

    // Apply brand filter - updated for new schema
    if (filters.brand !== "All Brands") {
      filtered = filtered.filter((product) => 
        (product.brand_name === filters.brand) || 
        (product.brand === filters.brand) // Fallback for backward compatibility
      );
    }

    // Apply stock status filter
    if (filters.stockStatus !== "All") {
      filtered = filtered.filter((product) => {
        if (filters.stockStatus === "in_stock") {
          return product.stock_in_pieces > product.reorder_level;
        } else if (filters.stockStatus === "low_stock") {
          return (
            product.stock_in_pieces > 0 &&
            product.stock_in_pieces <= product.reorder_level
          );
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
      filtered = filtered.filter((product) => 
        product.drug_classification === filters.drugClassification
      );
    }

    // Apply manufacturer filter (NEW)  
    if (filters.manufacturer !== "All") {
      filtered = filtered.filter((product) =>
        product.manufacturer === filters.manufacturer
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
    const lowStockProducts = activeProducts.filter(
      (p) => p.stock_in_pieces > 0 && p.stock_in_pieces <= p.reorder_level
    ).length;
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
