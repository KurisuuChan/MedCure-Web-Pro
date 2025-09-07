import { useState, useMemo, useEffect } from "react";
import { inventoryService } from "../../../services/inventoryService";

export function useInventory() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "All Categories",
    brand: "All Brands",
    stockStatus: "All",
    expiryStatus: "All",
  });
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.brand.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (filters.category !== "All Categories") {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    }

    // Apply brand filter
    if (filters.brand !== "All Brands") {
      filtered = filtered.filter((product) => product.brand === filters.brand);
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

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, filters, sortBy, sortOrder]);

  // Analytics
  const analytics = useMemo(() => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(
      (p) => p.stock_in_pieces > 0 && p.stock_in_pieces <= p.reorder_level
    ).length;
    const outOfStockProducts = products.filter(
      (p) => p.stock_in_pieces <= 0
    ).length;

    const today = new Date();
    const expiringProducts = products.filter((p) => {
      if (!p.expiry_date) return false;
      const expiry = new Date(p.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiry - today) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length;

    const expiredProducts = products.filter((p) => {
      if (!p.expiry_date) return false;
      const expiry = new Date(p.expiry_date);
      return expiry < today;
    }).length;

    const totalValue = products.reduce(
      (sum, p) => sum + p.price_per_piece * p.stock_in_pieces,
      0
    );

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
    handleSearch,
    handleFilter,
    handleSort,
  };
}
