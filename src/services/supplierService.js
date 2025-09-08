// Supplier Management Service for MedCure-Pro
// Comprehensive supplier and purchase order management system

import { supabase } from "../config/supabase";

class SupplierService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // ==================== SUPPLIER MANAGEMENT ====================

  /**
   * Get all suppliers with optional filtering and pagination
   */
  async getAllSuppliers(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search = "",
        status = null,
        category = null,
        sortBy = "name",
        sortOrder = "asc",
      } = options;

      let query = supabase.from("suppliers").select(`
          *,
          supplier_contacts(*),
          purchase_orders(id, status, total_amount, created_at),
          supplier_performance_metrics(*)
        `);

      // Apply filters
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        );
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (category) {
        query = query.contains("categories", [category]);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Calculate derived metrics for each supplier
      const enrichedSuppliers = data.map((supplier) => ({
        ...supplier,
        totalOrders: supplier.purchase_orders?.length || 0,
        totalSpent:
          supplier.purchase_orders?.reduce(
            (sum, order) => sum + (order.total_amount || 0),
            0
          ) || 0,
        activeOrders:
          supplier.purchase_orders?.filter((order) =>
            ["pending", "confirmed", "shipped"].includes(order.status)
          ).length || 0,
        lastOrderDate:
          supplier.purchase_orders?.length > 0
            ? new Date(
                Math.max(
                  ...supplier.purchase_orders.map(
                    (order) => new Date(order.created_at)
                  )
                )
              )
            : null,
        performanceScore:
          supplier.supplier_performance_metrics?.[0]?.overall_score || 0,
      }));

      return {
        suppliers: enrichedSuppliers,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }
  }

  /**
   * Get supplier by ID with detailed information
   */
  async getSupplierById(supplierId) {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select(
          `
          *,
          supplier_contacts(*),
          supplier_products(*),
          purchase_orders(*),
          supplier_performance_metrics(*),
          supplier_documents(*)
        `
        )
        .eq("id", supplierId)
        .single();

      if (error) throw error;

      // Calculate performance metrics
      const performanceData = await this.calculateSupplierPerformance(
        supplierId
      );

      return {
        ...data,
        performance: performanceData,
      };
    } catch (error) {
      console.error("Error fetching supplier:", error);
      throw new Error(`Failed to fetch supplier: ${error.message}`);
    }
  }

  /**
   * Create new supplier
   */
  async createSupplier(supplierData) {
    try {
      const {
        name,
        email,
        phone,
        address,
        categories = [],
        paymentTerms = "net_30",
        creditLimit = 0,
        taxId,
        website,
        notes,
        contacts = [],
        bankDetails = {},
      } = supplierData;

      // Validate required fields
      if (!name || !email) {
        throw new Error("Name and email are required");
      }

      // Create supplier record
      const { data: supplier, error: supplierError } = await supabase
        .from("suppliers")
        .insert({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone,
          address,
          categories,
          payment_terms: paymentTerms,
          credit_limit: creditLimit,
          tax_id: taxId,
          website,
          notes,
          bank_details: bankDetails,
          status: "active",
          rating: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (supplierError) throw supplierError;

      // Create contact records if provided
      if (contacts.length > 0) {
        const contactRecords = contacts.map((contact) => ({
          supplier_id: supplier.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          role: contact.role || "primary",
          is_primary: contact.isPrimary || false,
        }));

        const { error: contactsError } = await supabase
          .from("supplier_contacts")
          .insert(contactRecords);

        if (contactsError) {
          console.warn("Error creating supplier contacts:", contactsError);
        }
      }

      // Initialize performance metrics
      await this.initializeSupplierMetrics(supplier.id);

      // Log activity
      await this.logSupplierActivity(
        supplier.id,
        "SUPPLIER_CREATED",
        "New supplier registered in system"
      );

      return await this.getSupplierById(supplier.id);
    } catch (error) {
      console.error("Error creating supplier:", error);
      throw new Error(`Failed to create supplier: ${error.message}`);
    }
  }

  /**
   * Update supplier information
   */
  async updateSupplier(supplierId, updateData) {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", supplierId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logSupplierActivity(
        supplierId,
        "SUPPLIER_UPDATED",
        "Supplier information updated"
      );

      // Clear cache
      this.clearSupplierCache(supplierId);

      return data;
    } catch (error) {
      console.error("Error updating supplier:", error);
      throw new Error(`Failed to update supplier: ${error.message}`);
    }
  }

  /**
   * Delete supplier (soft delete)
   */
  async deleteSupplier(supplierId) {
    try {
      // Check for active purchase orders
      const { data: activeOrders } = await supabase
        .from("purchase_orders")
        .select("id")
        .eq("supplier_id", supplierId)
        .in("status", ["pending", "confirmed", "shipped"]);

      if (activeOrders && activeOrders.length > 0) {
        throw new Error("Cannot delete supplier with active purchase orders");
      }

      // Soft delete
      const { data, error } = await supabase
        .from("suppliers")
        .update({
          status: "deleted",
          deleted_at: new Date().toISOString(),
        })
        .eq("id", supplierId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logSupplierActivity(
        supplierId,
        "SUPPLIER_DELETED",
        "Supplier removed from system"
      );

      return data;
    } catch (error) {
      console.error("Error deleting supplier:", error);
      throw new Error(`Failed to delete supplier: ${error.message}`);
    }
  }

  // ==================== PURCHASE ORDER MANAGEMENT ====================

  /**
   * Create new purchase order
   */
  async createPurchaseOrder(orderData) {
    try {
      const {
        supplierId,
        items = [],
        deliveryDate,
        notes,
        shippingAddress,
        billToAddress,
      } = orderData;

      // Validate items
      if (!items.length) {
        throw new Error("Purchase order must contain at least one item");
      }

      // Calculate totals
      const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const tax = subtotal * 0.1; // 10% tax rate
      const shipping = 0; // Calculate shipping if needed
      const total = subtotal + tax + shipping;

      // Generate PO number
      const poNumber = await this.generatePONumber();

      // Create purchase order
      const { data: purchaseOrder, error: orderError } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: poNumber,
          supplier_id: supplierId,
          status: "draft",
          subtotal,
          tax_amount: tax,
          shipping_amount: shipping,
          total_amount: total,
          delivery_date: deliveryDate,
          notes,
          shipping_address: shippingAddress,
          bill_to_address: billToAddress,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        purchase_order_id: purchaseOrder.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
        specifications: item.specifications || {},
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Log activity
      await this.logSupplierActivity(
        supplierId,
        "PURCHASE_ORDER_CREATED",
        `Purchase order ${poNumber} created`
      );

      return await this.getPurchaseOrderById(purchaseOrder.id);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      throw new Error(`Failed to create purchase order: ${error.message}`);
    }
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrderById(orderId) {
    try {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(
          `
          *,
          suppliers(name, email, phone),
          purchase_order_items(*,
            products(name, sku, unit_of_measure)
          )
        `
        )
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      throw new Error(`Failed to fetch purchase order: ${error.message}`);
    }
  }

  /**
   * Update purchase order status
   */
  async updatePurchaseOrderStatus(orderId, status, notes = "") {
    try {
      const validStatuses = [
        "draft",
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        throw new Error("Invalid purchase order status");
      }

      const updateData = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Add status-specific fields
      if (status === "confirmed") {
        updateData.confirmed_at = new Date().toISOString();
      } else if (status === "shipped") {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = notes;
      }

      const { data, error } = await supabase
        .from("purchase_orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      // Update supplier performance metrics if delivered
      if (status === "delivered") {
        await this.updateSupplierPerformanceOnDelivery(
          data.supplier_id,
          orderId
        );
      }

      // Log activity
      await this.logPurchaseOrderActivity(
        orderId,
        `ORDER_${status.toUpperCase()}`,
        `Purchase order status changed to ${status}`
      );

      return data;
    } catch (error) {
      console.error("Error updating purchase order status:", error);
      throw new Error(
        `Failed to update purchase order status: ${error.message}`
      );
    }
  }

  // ==================== SUPPLIER PERFORMANCE TRACKING ====================

  /**
   * Calculate supplier performance metrics
   */
  async calculateSupplierPerformance(supplierId) {
    try {
      const { data: orders, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("supplier_id", supplierId)
        .eq("status", "delivered");

      if (error) throw error;

      if (!orders.length) {
        return {
          overallScore: 0,
          deliveryPerformance: 0,
          qualityScore: 0,
          totalOrders: 0,
          onTimeDeliveries: 0,
          averageDeliveryTime: 0,
        };
      }

      // Calculate delivery performance
      const onTimeDeliveries = orders.filter((order) => {
        if (!order.delivery_date || !order.delivered_at) return false;
        return new Date(order.delivered_at) <= new Date(order.delivery_date);
      }).length;

      const deliveryPerformance = (onTimeDeliveries / orders.length) * 100;

      // Calculate average delivery time
      const deliveryTimes = orders
        .filter((order) => order.created_at && order.delivered_at)
        .map((order) => {
          const created = new Date(order.created_at);
          const delivered = new Date(order.delivered_at);
          return Math.ceil((delivered - created) / (1000 * 60 * 60 * 24)); // days
        });

      const averageDeliveryTime =
        deliveryTimes.length > 0
          ? deliveryTimes.reduce((sum, time) => sum + time, 0) /
            deliveryTimes.length
          : 0;

      // Quality score (placeholder - would be based on returns, complaints, etc.)
      const qualityScore = 85; // This would be calculated based on actual quality metrics

      // Overall score calculation
      const overallScore = deliveryPerformance * 0.4 + qualityScore * 0.6;

      return {
        overallScore: Math.round(overallScore),
        deliveryPerformance: Math.round(deliveryPerformance),
        qualityScore,
        totalOrders: orders.length,
        onTimeDeliveries,
        averageDeliveryTime: Math.round(averageDeliveryTime),
      };
    } catch (error) {
      console.error("Error calculating supplier performance:", error);
      return {
        overallScore: 0,
        deliveryPerformance: 0,
        qualityScore: 0,
        totalOrders: 0,
        onTimeDeliveries: 0,
        averageDeliveryTime: 0,
      };
    }
  }

  /**
   * Update supplier performance metrics
   */
  async updateSupplierPerformanceOnDelivery(supplierId, orderId) {
    try {
      const performance = await this.calculateSupplierPerformance(supplierId);

      // Update or create performance record
      const { error } = await supabase
        .from("supplier_performance_metrics")
        .upsert({
          supplier_id: supplierId,
          overall_score: performance.overallScore,
          delivery_performance: performance.deliveryPerformance,
          quality_score: performance.qualityScore,
          total_orders: performance.totalOrders,
          on_time_deliveries: performance.onTimeDeliveries,
          average_delivery_time: performance.averageDeliveryTime,
          last_updated: new Date().toISOString(),
        });

      if (error) throw error;

      // Update supplier rating
      await supabase
        .from("suppliers")
        .update({ rating: performance.overallScore })
        .eq("id", supplierId);

      // Log the performance update with order reference
      await this.logSupplierActivity(
        supplierId,
        "PERFORMANCE_UPDATED",
        `Performance metrics updated after order ${orderId} delivery`
      );
    } catch (error) {
      console.error("Error updating supplier performance:", error);
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Generate unique PO number
   */
  async generatePONumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    const { data, error } = await supabase
      .from("purchase_orders")
      .select("po_number")
      .like("po_number", `PO-${year}${month}%`)
      .order("po_number", { ascending: false })
      .limit(1);

    if (error) {
      console.warn("Error generating PO number:", error);
      return `PO-${year}${month}-001`;
    }

    if (!data.length) {
      return `PO-${year}${month}-001`;
    }

    const lastNumber = parseInt(data[0].po_number.split("-")[2]) || 0;
    const nextNumber = String(lastNumber + 1).padStart(3, "0");
    return `PO-${year}${month}-${nextNumber}`;
  }

  /**
   * Initialize supplier performance metrics
   */
  async initializeSupplierMetrics(supplierId) {
    try {
      await supabase.from("supplier_performance_metrics").insert({
        supplier_id: supplierId,
        overall_score: 0,
        delivery_performance: 0,
        quality_score: 0,
        total_orders: 0,
        on_time_deliveries: 0,
        average_delivery_time: 0,
        last_updated: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error initializing supplier metrics:", error);
    }
  }

  /**
   * Log supplier activity
   */
  async logSupplierActivity(
    supplierId,
    activityType,
    description,
    metadata = {}
  ) {
    try {
      await supabase.from("supplier_activity_logs").insert({
        supplier_id: supplierId,
        activity_type: activityType,
        description,
        metadata,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error logging supplier activity:", error);
    }
  }

  /**
   * Log purchase order activity
   */
  async logPurchaseOrderActivity(
    orderId,
    activityType,
    description,
    metadata = {}
  ) {
    try {
      await supabase.from("purchase_order_activity_logs").insert({
        purchase_order_id: orderId,
        activity_type: activityType,
        description,
        metadata,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error logging purchase order activity:", error);
    }
  }

  /**
   * Clear supplier cache
   */
  clearSupplierCache(supplierId = null) {
    if (supplierId) {
      this.cache.delete(`supplier_${supplierId}`);
    } else {
      this.cache.clear();
    }
  }

  // ==================== SUPPLIER ANALYTICS ====================

  /**
   * Get supplier analytics dashboard data
   */
  async getSupplierAnalytics(timeRange = "30d") {
    try {
      const dateThreshold = new Date();

      switch (timeRange) {
        case "7d":
          dateThreshold.setDate(dateThreshold.getDate() - 7);
          break;
        case "30d":
          dateThreshold.setDate(dateThreshold.getDate() - 30);
          break;
        case "90d":
          dateThreshold.setDate(dateThreshold.getDate() - 90);
          break;
        case "1y":
          dateThreshold.setFullYear(dateThreshold.getFullYear() - 1);
          break;
        default:
          dateThreshold.setDate(dateThreshold.getDate() - 30);
      }

      // Get supplier metrics
      const { data: suppliers } = await supabase
        .from("suppliers")
        .select("*")
        .eq("status", "active");

      // Get purchase order metrics
      const { data: orders } = await supabase
        .from("purchase_orders")
        .select("*")
        .gte("created_at", dateThreshold.toISOString());

      // Calculate analytics
      const totalSuppliers = suppliers?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalSpent =
        orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Top suppliers by order value
      const supplierOrderTotals = {};
      orders?.forEach((order) => {
        if (order.supplier_id) {
          supplierOrderTotals[order.supplier_id] =
            (supplierOrderTotals[order.supplier_id] || 0) +
            (order.total_amount || 0);
        }
      });

      const topSuppliers = Object.entries(supplierOrderTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([supplierId, total]) => {
          const supplier = suppliers?.find((s) => s.id === supplierId);
          return {
            id: supplierId,
            name: supplier?.name || "Unknown",
            totalSpent: total,
            orderCount:
              orders?.filter((o) => o.supplier_id === supplierId).length || 0,
          };
        });

      // Order status distribution
      const statusCounts =
        orders?.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {}) || {};

      return {
        overview: {
          totalSuppliers,
          totalOrders,
          totalSpent,
          avgOrderValue,
        },
        topSuppliers,
        orderStatusDistribution: statusCounts,
        timeRange,
      };
    } catch (error) {
      console.error("Error fetching supplier analytics:", error);
      throw new Error(`Failed to fetch supplier analytics: ${error.message}`);
    }
  }
}

export default new SupplierService();
