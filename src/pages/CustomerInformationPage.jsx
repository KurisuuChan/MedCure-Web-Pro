import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";
import {
  Users,
  Search,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  TrendingUp,
  User,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  History,
  FileText,
  BarChart3,
  RefreshCw,
  Copy,
  Receipt,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useCustomers } from "../hooks/useCustomers";
import unifiedTransactionService from "../services/domains/sales/transactionService";
import "../debug/customerStatisticsValidator.js";
import { formatCurrency, formatDate } from "../utils/formatting";
import SimpleReceipt from "../components/ui/SimpleReceipt";
import FixedCustomerService from "../services/FixedCustomerService";
import PhoneValidator from "../utils/phoneValidator";
import CustomerDeleteModal from "../components/CustomerDeleteModal";
import { useToast } from "../components/ui/Toast";
import { supabase } from "../config/supabase";

const CustomerInformationPage = () => {
  const navigate = useNavigate();
  const {
    customers,
    fetchCustomers,
    forceRefresh,
    deleteCustomer,
    updateCustomer,
    createCustomer,
  } = useCustomers();

  // Toast notifications
  const { success: showSuccess, error: showError, info: showInfo } = useToast();

  // Professional error handling (inline implementation)
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Debug: Log customer statistics whenever customers change
  useEffect(() => {
    if (customers && customers.length > 0) {
      console.log("🔍 CUSTOMER STATISTICS DEBUG:", {
        totalCustomers: customers.length,
        customersWithOrders: customers.filter(
          (c) => (c.purchase_count || 0) > 0
        ).length,
        customersWithZeroOrders: customers.filter(
          (c) => (c.purchase_count || 0) === 0
        ).length,
        sampleCustomers: customers.slice(0, 3).map((c) => ({
          name: c.customer_name,
          orders: c.purchase_count || 0,
          total: c.total_purchases || 0,
          lastPurchase: c.last_purchase_date,
        })),
      });

      // Check if ALL customers have zero statistics
      const allZero = customers.every(
        (c) => (c.purchase_count || 0) === 0 && (c.total_purchases || 0) === 0
      );
      if (allZero) {
        console.warn(
          "⚠️ ALL CUSTOMERS HAVE ZERO STATISTICS - This suggests a matching issue!"
        );
        console.log(
          '🔧 Suggestion: Click "Refresh" button to clear cache and reload data'
        );
      }
    }
  }, [customers]);

  // Basic validation function
  const validateCustomer = useCallback((customerData) => {
    const errors = [];

    if (!customerData.customer_name?.trim()) {
      errors.push("Customer name is required");
    }

    if (
      customerData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)
    ) {
      errors.push("Please enter a valid email address");
    }

    if (customerData.phone && !/^[\d\s\-\+\(\)\.]+$/.test(customerData.phone)) {
      errors.push("Please enter a valid phone number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce customer search
  const [sortConfig, setSortConfig] = useState({
    key: "customer_name",
    direction: "asc",
  });
  const searchInputRef = useRef(null);

  // Component state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const debouncedTransactionSearch = useDebounce(transactionSearchTerm, 300); // Debounce transaction search
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Professional notification system
  const showNotification = useCallback(
    (type, title, message, action = null) => {
      setNotification({
        id: Date.now(),
        type,
        title,
        message,
        action,
      });
    },
    []
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Professional error handling methods
  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const handleOperationError = useCallback(
    (error, operation) => {
      console.error(`Error during ${operation}:`, error);

      let title = "Operation Failed";
      let message = "Something went wrong. Please try again.";

      if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        title = "Network Error";
        message = "Please check your connection and try again.";
      } else if (error.message?.includes("validation")) {
        title = "Invalid Information";
        message = "Please correct the highlighted fields and try again.";
      }

      setError({ title, message, retryable: true });
      showNotification("error", title, message, {
        label: "Try Again",
        onClick: () => {
          clearError();
          clearNotification();
        },
      });
    },
    [showNotification, clearError, clearNotification]
  );

  const getCustomerBadge = (customer) => {
    const totalSpent = customer.total_purchases || 0;
    const purchaseCount = customer.purchase_count || 0;

    if (totalSpent > 10000 || purchaseCount > 20) {
      return { label: "Premium", color: "bg-purple-100 text-purple-800" };
    } else if (totalSpent > 3000 || purchaseCount > 5) {
      return { label: "Regular", color: "bg-blue-100 text-blue-800" };
    } else {
      return { label: "New", color: "bg-green-100 text-green-800" };
    }
  };

  // Basic search handler
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // Basic sort handler
  const handleSort = (field) => {
    setSortConfig((prev) => ({
      key: field,
      direction:
        prev.key === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (field) => {
    if (sortConfig.key !== field) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // Filter and sort customers (basic implementation)
  const displayCustomers = useMemo(() => {
    let filtered = customers;

    // Search filter - using debounced search term
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = customers.filter(
        (customer) =>
          customer.customer_name?.toLowerCase().includes(searchLower) ||
          customer.phone?.includes(debouncedSearchTerm) ||
          customer.email?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";

        if (sortConfig.direction === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return filtered;
  }, [customers, debouncedSearchTerm, sortConfig]);

  // Basic metrics
  const metrics = useMemo(
    () => ({
      totalCustomers: customers.length,
      filteredCustomers: displayCustomers.length,
      displayedCustomers: displayCustomers.length,
      cacheSize: 0,
    }),
    [customers.length, displayCustomers.length]
  );

  const handleDeleteCustomer = async (customerId) => {
    setIsUpdating(true);
    try {
      console.log("🗑️ Permanently deleting customer:", customerId);

      // Call anonymization function from Supabase
      const { data: result, error } = await supabase
        .rpc('anonymize_customer_data', { customer_uuid: customerId });

      if (error) {
        console.warn("⚠️ Anonymization function failed, trying fallback:", error.message);
        
        // Fallback to direct update if function doesn't exist
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            customer_name: '[DELETED CUSTOMER]',
            phone: null,
            email: null,
            address: null,
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId);

        if (updateError) {
          throw new Error(`Delete failed: ${updateError.message}`);
        }

        console.log("✅ Customer deleted using fallback method");
      } else if (result && result.success) {
        console.log("✅ Customer deleted using stored function:", result);
      } else {
        throw new Error(result?.error || 'Delete function returned failure');
      }

      // Refresh customer data
      await fetchCustomers();

      // Show success toast for deletion
      showSuccess(
        "🗑️ Customer deleted successfully and all data anonymized for privacy protection.",
        {
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => {
              showInfo("Undo functionality requires database backup restoration.", { duration: 4000 });
            }
          }
        }
      );

      // Success is handled by the modal
      closeAllModals();
      
    } catch (error) {
      console.error("❌ Delete customer error:", error);
      handleOperationError(error, "delete");
      throw error; // Re-throw so modal can handle it
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      customer_name: customer.customer_name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setShowEditModal(true);
    clearError(); // Clear any previous errors
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    // Professional validation
    const validationResult = validateCustomer(editForm);
    if (!validationResult.isValid) {
      showError(
        `Please fix the following: ${validationResult.errors.join(", ")}`,
        { duration: 5000 }
      );
      return;
    }

    setIsUpdating(true);
    try {
      // Use database updateCustomer method
      await updateCustomer(selectedCustomer.id, editForm);

      // Success notification with beautiful toast
      showSuccess(
        `✅ Customer "${editForm.customer_name}" updated successfully!`,
        {
          duration: 4000,
          action: {
            label: "View Customer",
            onClick: () => {
              setSelectedCustomer({ ...selectedCustomer, ...editForm });
              setShowCustomerModal(true);
            }
          }
        }
      );

      // Close modal and refresh
      closeAllModals();
      await fetchCustomers();
    } catch (error) {
      handleOperationError(error, "update");
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchCustomerTransactions = async (customer) => {
    setLoadingTransactions(true);
    try {
      console.log("🔍 Fetching transactions for customer:", customer);

      // Get all transactions with extended date range
      const allTransactions = await unifiedTransactionService.getTransactions({
        limit: 2000, // Increased limit
        offset: 0,
        sortBy: "created_at",
        sortOrder: "desc",
        // Try to get transactions from last 90 days
        startDate: new Date(
          Date.now() - 90 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: new Date().toISOString(),
      });

      console.log("📊 All transactions fetched:", allTransactions);
      console.log("📊 Transaction count:", allTransactions?.length || 0);

      // Handle different response formats
      let transactionData = [];
      if (Array.isArray(allTransactions)) {
        transactionData = allTransactions;
      } else if (allTransactions?.data && Array.isArray(allTransactions.data)) {
        transactionData = allTransactions.data;
      } else if (
        allTransactions?.transactions &&
        Array.isArray(allTransactions.transactions)
      ) {
        transactionData = allTransactions.transactions;
      }

      console.log(
        "📋 Using transaction data:",
        transactionData.length,
        "transactions"
      );
      if (transactionData.length > 0) {
        console.log("📋 Sample transaction:", transactionData[0]);
      }

      // Enhanced filtering with multiple matching strategies
      const customerTxns = transactionData.filter((txn) => {
        if (!txn) return false;

        // Skip deleted customer transactions
        if (txn.customer_name === "[DELETED CUSTOMER]" || !txn.customer_name) {
          return false;
        }

        // Debug current transaction
        const debugMatch = {
          transaction_id: txn.id,
          txn_customer_name: txn.customer_name,
          txn_customer_phone: txn.customer_phone,
          txn_customer_id: txn.customer_id,
          target_customer_name: customer.customer_name,
          target_customer_phone: customer.phone,
          target_customer_id: customer.id,
          created_at: txn.created_at,
        };

        // Strategy 1: Customer ID match (most reliable if available)
        if (txn.customer_id && customer.id && txn.customer_id === customer.id) {
          console.log("✅ Customer ID match found!", debugMatch);
          return true;
        }

        // Strategy 2: Phone number match (normalize and compare)
        if (txn.customer_phone && customer.phone) {
          const normalizePhone = (phone) => {
            if (!phone) return "";
            return phone.toString().replace(/[^\d]/g, ""); // Remove all non-digits
          };

          const txnPhone = normalizePhone(txn.customer_phone);
          const customerPhone = normalizePhone(customer.phone);

          if (
            txnPhone &&
            customerPhone &&
            txnPhone.length >= 10 &&
            customerPhone.length >= 10
          ) {
            // Compare last 10 digits (handles country codes)
            const txnLast10 = txnPhone.slice(-10);
            const customerLast10 = customerPhone.slice(-10);

            if (txnLast10 === customerLast10) {
              console.log("✅ Phone match found!", {
                txnPhone: txnLast10,
                customerPhone: customerLast10,
                ...debugMatch,
              });
              return true;
            }
          }
        }

        // Strategy 3: Exact name match (case insensitive)
        if (txn.customer_name && customer.customer_name) {
          const txnName = txn.customer_name.toString().toLowerCase().trim();
          const customerName = customer.customer_name
            .toString()
            .toLowerCase()
            .trim();

          if (txnName === customerName) {
            console.log("✅ Name match found!", debugMatch);
            return true;
          }
        }

        // Strategy 4: Fuzzy name match (for slight variations)
        if (txn.customer_name && customer.customer_name) {
          const txnName = txn.customer_name.toString().toLowerCase().trim();
          const customerName = customer.customer_name
            .toString()
            .toLowerCase()
            .trim();

          // Check if names are similar (one contains the other)
          if (
            txnName.includes(customerName) ||
            customerName.includes(txnName)
          ) {
            // Only accept fuzzy match if phone is also empty or matches
            const txnPhone = txn.customer_phone
              ? txn.customer_phone.toString().trim()
              : "";
            const customerPhone = customer.phone
              ? customer.phone.toString().trim()
              : "";

            if (!txnPhone && !customerPhone) {
              console.log("✅ Fuzzy name match found (no phones)!", debugMatch);
              return true;
            }
          }
        }

        return false;
      });

      console.log(
        `\n✅ FINAL RESULT: Found ${customerTxns.length} transactions for ${customer.customer_name}`
      );

      // Enhanced debugging output
      if (customerTxns.length === 0 && transactionData.length > 0) {
        console.log(
          "\n🔍 DEBUG - No matches found! Let me show you what we have:"
        );
        console.log(`👤 Target Customer:`, {
          id: customer.id,
          name: customer.customer_name,
          phone: customer.phone,
          email: customer.email,
        });

        console.log(`\n📦 Available Transactions (first 10):`);
        transactionData.slice(0, 10).forEach((txn, index) => {
          console.log(
            `  ${index + 1}. ${txn.customer_name} | Phone: ${
              txn.customer_phone
            } | ID: ${txn.customer_id} | Amount: ₱${txn.total_amount}`
          );
        });

        // Check if there are any transactions with similar names
        const similarTransactions = transactionData.filter((txn) => {
          if (!txn.customer_name || !customer.customer_name) return false;
          const txnName = txn.customer_name.toLowerCase();
          const customerName = customer.customer_name.toLowerCase();
          return (
            txnName.includes(customerName.split(" ")[0]) ||
            customerName.includes(txnName.split(" ")[0])
          );
        });

        if (similarTransactions.length > 0) {
          console.log(
            `\n🤔 Found ${similarTransactions.length} transactions with similar names:`
          );
          similarTransactions.forEach((txn) => {
            console.log(
              `  - "${txn.customer_name}" vs "${customer.customer_name}"`
            );
          });
        }
      } else if (customerTxns.length > 0) {
        console.log(`\n🎉 Successfully matched transactions:`);
        customerTxns.forEach((txn, index) => {
          console.log(
            `  ${index + 1}. ₱${txn.total_amount} on ${new Date(
              txn.created_at
            ).toLocaleDateString()}`
          );
        });
      }

      // Calculate and log summary statistics
      if (customerTxns.length > 0) {
        const totalAmount = customerTxns.reduce(
          (sum, txn) => sum + (parseFloat(txn.total_amount) || 0),
          0
        );
        const avgAmount = totalAmount / customerTxns.length;
        console.log(`\n📊 Transaction Summary for ${customer.customer_name}:`);
        console.log(`   • Total Orders: ${customerTxns.length}`);
        console.log(
          `   • Total Spent: ₱${totalAmount.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
          })}`
        );
        console.log(
          `   • Average Order: ₱${avgAmount.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
          })}`
        );
      }

      setCustomerTransactions(customerTxns);
    } catch (error) {
      console.error("❌ Error fetching customer transactions:", error);
      setCustomerTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const openTransactionHistory = (customer) => {
    setSelectedCustomer(customer);
    setShowTransactionHistory(true);
    setTransactionSearchTerm("");
    fetchCustomerTransactions(customer);
  };

  const openReceiptModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const validateNewCustomer = useCallback(
    (customerData) => {
      const errors = [];

      // Required field validations
      if (!customerData.customer_name?.trim()) {
        errors.push("Customer name is required");
      } else if (customerData.customer_name.trim().length < 2) {
        errors.push("Customer name must be at least 2 characters long");
      } else if (customerData.customer_name.trim().length > 100) {
        errors.push("Customer name cannot exceed 100 characters");
      } else if (
        !/^[a-zA-Z\s\-\'\.]+$/.test(customerData.customer_name.trim())
      ) {
        errors.push(
          "Customer name can only contain letters, spaces, hyphens, and apostrophes"
        );
      }

      if (!customerData.phone?.trim()) {
        errors.push("Phone number is required");
      } else {
        // Enhanced phone number validation using PhoneValidator
        const validation = PhoneValidator.validatePhone(customerData.phone);
        if (!validation.isValid) {
          errors.push(validation.message);
        }

        // Check for duplicate phone number
        const cleanPhone = PhoneValidator.cleanPhone(customerData.phone);
        const existingCustomer = customers.find(
          (customer) =>
            customer.phone &&
            PhoneValidator.cleanPhone(customer.phone) === cleanPhone
        );
        if (existingCustomer) {
          errors.push(
            `Phone number already exists for customer: ${existingCustomer.customer_name}`
          );
        }
      }

      // Address validation (required)
      if (!customerData.address?.trim()) {
        errors.push("Address is required");
      } else if (customerData.address.trim().length < 5) {
        errors.push("Address must be at least 5 characters long");
      } else if (customerData.address.trim().length > 255) {
        errors.push("Address cannot exceed 255 characters");
      }

      // Email validation (optional but must be valid if provided)
      if (customerData.email?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerData.email.trim())) {
          errors.push("Please enter a valid email address");
        }

        // Check for duplicate email
        const existingEmailCustomer = customers.find(
          (customer) =>
            customer.email &&
            customer.email.toLowerCase() ===
              customerData.email.trim().toLowerCase()
        );
        if (existingEmailCustomer) {
          errors.push(
            `Email address already exists for customer: ${existingEmailCustomer.customer_name}`
          );
        }
      }

      // Check for potential duplicate names (warning, not error)
      const duplicateName = customers.find(
        (customer) =>
          customer.customer_name &&
          customer.customer_name.toLowerCase().trim() ===
            customerData.customer_name.toLowerCase().trim()
      );
      if (duplicateName) {
        errors.push(
          `A customer with similar name "${duplicateName.customer_name}" already exists. Please verify this is a different person.`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [customers]
  );

  const handleCreateNewCustomer = async () => {
    // Enhanced validation with duplicate checks
    const validationResult = validateNewCustomer(newCustomerForm);
    if (!validationResult.isValid) {
      showError(
        `Please fix the following issues: ${validationResult.errors.join(" • ")}`,
        { duration: 5000 }
      );
      return;
    }

    setIsUpdating(true);
    try {
      // Create customer using the same service as POS
      const savedCustomer = await createCustomer({
        customer_name: newCustomerForm.customer_name.trim(),
        phone: newCustomerForm.phone.trim(),
        email: newCustomerForm.email?.trim() || null,
        address: newCustomerForm.address?.trim() || null,
      });

      // Success notification with beautiful toast
      showSuccess(
        `🎉 Customer "${savedCustomer.customer_name}" created successfully and ready for transactions!`,
        {
          duration: 5000,
          action: {
            label: "View Customer",
            onClick: () => {
              setSelectedCustomer(savedCustomer);
              setShowCustomerModal(true);
            }
          }
        }
      );

      // Close modal and refresh data
      closeAllModals();
      await fetchCustomers(); // Refresh the customer list
    } catch (error) {
      console.error("❌ Error creating customer:", error);

      // Enhanced error handling for different scenarios
      let title = "Customer Creation Failed";
      let message = "Unable to create customer. Please try again.";

      if (
        error.message?.toLowerCase().includes("duplicate") ||
        error.message?.toLowerCase().includes("already exists")
      ) {
        title = "Duplicate Customer Information";
        message =
          "A customer with this phone number or email already exists. Please check your information and try again.";
      } else if (
        error.message?.toLowerCase().includes("network") ||
        error.message?.toLowerCase().includes("connection")
      ) {
        title = "Network Error";
        message =
          "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (error.message?.toLowerCase().includes("validation")) {
        title = "Invalid Customer Information";
        message =
          "The customer information provided is not valid. Please check all fields and try again.";
      } else if (
        error.message?.toLowerCase().includes("permission") ||
        error.message?.toLowerCase().includes("unauthorized")
      ) {
        title = "Permission Denied";
        message =
          "You do not have permission to create customers. Please contact your administrator.";
      } else if (
        error.message?.toLowerCase().includes("database") ||
        error.message?.toLowerCase().includes("server")
      ) {
        title = "Database Error";
        message =
          "There was a problem saving the customer information. Please try again in a moment.";
      }

      setError({ title, message, retryable: true });
      
      // Show error toast with retry option
      showError(
        `${title}: ${message}`,
        {
          duration: 6000,
          action: {
            label: "Try Again",
            onClick: () => {
              clearError();
              handleCreateNewCustomer();
            }
          }
        }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteConfirm(false);
    setShowTransactionHistory(false);
    setShowReceiptModal(false);
    setShowAddCustomerModal(false);
    setSelectedCustomer(null);
    setSelectedTransaction(null);
    setEditForm({ customer_name: "", phone: "", email: "", address: "" });
    setNewCustomerForm({
      customer_name: "",
      phone: "",
      email: "",
      address: "",
    });
    setCustomerTransactions([]);
    setTransactionSearchTerm("");
    clearError(); // Clear any errors when closing modals
    clearNotification(); // Clear any notifications when closing modals
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/pos")}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to POS"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Customer Information
                </h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Manage and view your customer database
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border">
              {displayCustomers.length} of {customers.length} customers
            </div>
            <button
              onClick={async () => {
                console.log(
                  "🔄 Refreshing customer data with transaction statistics..."
                );

                // Clear any localStorage cache first
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (
                    key &&
                    (key.toLowerCase().includes("medcure") ||
                      key.toLowerCase().includes("customer") ||
                      key.toLowerCase().includes("transaction"))
                  ) {
                    keysToRemove.push(key);
                  }
                }

                if (keysToRemove.length > 0) {
                  console.log("🗑️ Clearing cached data:", keysToRemove);
                  keysToRemove.forEach((key) => localStorage.removeItem(key));
                }

                // Refresh customer data
                await forceRefresh();

                console.log("✅ Customer data refreshed successfully!");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Professional Search & Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Professional Search with Performance Optimization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Customers ({metrics.filteredCustomers} found)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Professional Sort with Current Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By{" "}
              {sortConfig.key && `(${sortConfig.key} ${sortConfig.direction})`}
            </label>
            <select
              value={
                sortConfig.key
                  ? `${sortConfig.key}-${sortConfig.direction}`
                  : "name-asc"
              }
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                handleSort(field);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="customer_name-asc">Name (A-Z)</option>
              <option value="customer_name-desc">Name (Z-A)</option>
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="purchase_count-desc">Most Purchases</option>
              <option value="total_purchases-desc">Highest Spent</option>
            </select>
          </div>
        </div>

        {/* Performance Metrics Bar */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {metrics.totalCustomers}
              </div>
              <div className="text-xs text-gray-600">Total Customers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {metrics.filteredCustomers}
              </div>
              <div className="text-xs text-gray-600">Filtered Results</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {metrics.displayedCustomers}
              </div>
              <div className="text-xs text-gray-600">Displayed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {metrics.cacheSize}
              </div>
              <div className="text-xs text-gray-600">Cache Size</div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>Customer</span>
                    <span className="text-blue-600">{getSortIcon("name")}</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>Contact</span>
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined</span>
                    <span className="text-blue-600">{getSortIcon("date")}</span>
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("purchases")}
                >
                  <div className="flex items-center space-x-1">
                    <ShoppingBag className="h-4 w-4" />
                    <span>Purchases</span>
                    <span className="text-blue-600">
                      {getSortIcon("purchases")}
                    </span>
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Total Spent</span>
                    <span className="text-blue-600">
                      {getSortIcon("amount")}
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayCustomers.map((customer) => {
                const badge = getCustomerBadge(customer);
                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {customer.customer_name?.charAt(0)?.toUpperCase() ||
                              "C"}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {customer.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-3 w-3 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-3 w-3 mr-2 text-gray-400" />
                            <span className="truncate max-w-xs">
                              {customer.email}
                            </span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                            <span className="truncate max-w-xs">
                              {customer.address}
                            </span>
                          </div>
                        )}
                        {!customer.phone &&
                          !customer.email &&
                          !customer.address && (
                            <span className="text-sm text-gray-400 italic">
                              No contact info
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(customer.created_at).toLocaleDateString(
                          "en-PH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.ceil(
                          (new Date() - new Date(customer.created_at)) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days ago
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.purchase_count || 0} orders
                      </div>
                      {customer.last_purchase_date && (
                        <div className="text-sm text-gray-500">
                          Last:{" "}
                          {new Date(
                            customer.last_purchase_date
                          ).toLocaleDateString("en-PH")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₱
                        {(customer.total_purchases || 0).toLocaleString(
                          "en-PH",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </div>
                      {customer.purchase_count > 0 && (
                        <div className="text-sm text-gray-500">
                          Avg: ₱
                          {Math.round(
                            (customer.total_purchases || 0) /
                              customer.purchase_count
                          ).toLocaleString("en-PH")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="View Customer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openTransactionHistory(customer)}
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200"
                          title="Transaction History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(customer)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Professional Empty State */}
        {displayCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No customers found" : "No customers yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? `We couldn't find any customers matching "${searchTerm}". Try adjusting your search terms.`
                : "Customer information will appear here after purchases are made"}
            </p>
            {searchTerm && (
              <button
                onClick={() => handleSearch("")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Customer Modal */}
      {showViewModal && selectedCustomer && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative pointer-events-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Details
                </h3>
                <button
                  onClick={closeAllModals}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">
                    {selectedCustomer.customer_name?.charAt(0)?.toUpperCase() ||
                      "C"}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {selectedCustomer.customer_name}
                  </h4>
                  <p className="text-gray-500">
                    Customer ID: {selectedCustomer.id.slice(-8)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">
                    Contact Information
                  </h5>
                  <div className="space-y-2">
                    {selectedCustomer.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-3">
                    Purchase Statistics
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="font-medium">
                        {selectedCustomer.purchase_count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-medium">
                        ₱
                        {(selectedCustomer.total_purchases || 0).toLocaleString(
                          "en-PH",
                          { minimumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined:</span>
                      <span className="font-medium">
                        {new Date(
                          selectedCustomer.created_at
                        ).toLocaleDateString("en-PH")}
                      </span>
                    </div>
                    {selectedCustomer.last_purchase_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Purchase:</span>
                        <span className="font-medium">
                          {new Date(
                            selectedCustomer.last_purchase_date
                          ).toLocaleDateString("en-PH")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full relative pointer-events-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Customer
                </h3>
                <button
                  onClick={closeAllModals}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateCustomer();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.customer_name}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        customer_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => {
                      // Allow only numbers, spaces, dashes, parentheses, plus
                      const value = e.target.value.replace(/[^0-9\s\-\(\)\+\.]/g, '');
                      setEditForm({ ...editForm, phone: value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 09123456789"
                    maxLength={15}
                  />
                  {editForm.phone &&
                    (() => {
                      const cleanPhone = PhoneValidator.cleanPhone(editForm.phone);
                      const existingCustomer = customers.find(
                        (c) =>
                          c.phone &&
                          PhoneValidator.cleanPhone(c.phone) === cleanPhone &&
                          c.id !== selectedCustomer.id // Exclude current customer
                      );
                      const validation = PhoneValidator.validatePhone(editForm.phone);

                      if (existingCustomer) {
                        return (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <XCircle className="h-4 w-4 mr-1" />
                            Phone number already used by{" "}
                            {existingCustomer.customer_name}
                          </p>
                        );
                      } else if (validation.type === 'error') {
                        return (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {validation.message}
                          </p>
                        );
                      } else if (validation.type === 'warning') {
                        return (
                          <p className="mt-1 text-sm text-amber-600 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {validation.message}
                          </p>
                        );
                      } else if (validation.type === 'success') {
                        return (
                          <p className="mt-1 text-sm text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {validation.message}
                          </p>
                        );
                      }
                      return null;
                    })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter customer address"
                    rows={3}
                    required
                    maxLength={255}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAllModals}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Customer"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Modal */}
      <CustomerDeleteModal
        customer={selectedCustomer}
        isOpen={showDeleteConfirm}
        onClose={closeAllModals}
        onDelete={handleDeleteCustomer}
        isLoading={isUpdating}
      />

      {/* Customer Transaction History Modal */}
      {showTransactionHistory && selectedCustomer && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-6xl w-full max-h-[90vh] overflow-hidden relative pointer-events-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <History className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Transaction History
                    </h3>
                    <p className="text-gray-500">
                      {selectedCustomer.customer_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchCustomerTransactions(selectedCustomer)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    title="Refresh"
                    disabled={loadingTransactions}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        loadingTransactions ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={closeAllModals}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {/* Transaction Summary Cards */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">
                          Total Orders
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {customerTransactions.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">
                          Total Spent
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(
                            customerTransactions.reduce(
                              (sum, txn) =>
                                sum + (parseFloat(txn.total_amount) || 0),
                              0
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">
                          Avg. Order
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {customerTransactions.length > 0
                            ? formatCurrency(
                                customerTransactions.reduce(
                                  (sum, txn) =>
                                    sum + (parseFloat(txn.total_amount) || 0),
                                  0
                                ) / customerTransactions.length
                              )
                            : formatCurrency(0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">
                          Last Order
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {customerTransactions.length > 0
                            ? formatDate(
                                customerTransactions[0].created_at
                              ).split(" ")[0]
                            : "None"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar for Transactions */}
              {customerTransactions.length > 0 && (
                <div className="p-4 border-b border-gray-200">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={transactionSearchTerm}
                      onChange={(e) => setTransactionSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Transaction List */}
              <div
                className="flex-1 overflow-y-auto"
                style={{ maxHeight: "calc(90vh - 400px)" }}
              >
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading transactions...
                    </span>
                  </div>
                ) : customerTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No Transactions Found
                    </h4>
                    <p className="text-gray-600">
                      This customer hasn't made any purchases yet.
                    </p>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="space-y-4">
                      {customerTransactions
                        .filter((transaction) => {
                          if (!debouncedTransactionSearch) return true;
                          const searchLower =
                            debouncedTransactionSearch.toLowerCase();
                          return (
                            transaction.id
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            transaction.payment_method
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            (transaction.items &&
                              transaction.items.some(
                                (item) =>
                                  item.product_name
                                    ?.toLowerCase()
                                    .includes(searchLower) ||
                                  item.name?.toLowerCase().includes(searchLower)
                              ))
                          );
                        })
                        .map((transaction, index) => (
                          <div
                            key={transaction.id || index}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-purple-300"
                            onClick={() => openReceiptModal(transaction)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="bg-gray-100 p-3 rounded-lg">
                                  <Receipt className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-gray-900">
                                      Order #
                                      {transaction.id?.slice(-8) ||
                                        `${index + 1}`}
                                    </h4>
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        transaction.status === "completed"
                                          ? "bg-green-100 text-green-800"
                                          : transaction.status === "pending"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {transaction.status || "Completed"}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(transaction.created_at)}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatCurrency(
                                    parseFloat(transaction.total_amount) || 0
                                  )}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {transaction.payment_method || "Cash"}
                                </p>
                              </div>
                            </div>

                            {/* Transaction Items */}
                            {transaction.items &&
                              transaction.items.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="space-y-2">
                                    {transaction.items
                                      .slice(0, 3)
                                      .map((item, itemIndex) => (
                                        <div
                                          key={itemIndex}
                                          className="flex justify-between text-sm"
                                        >
                                          <span className="text-gray-600">
                                            {item.quantity}x{" "}
                                            {item.product_name || item.name}
                                          </span>
                                          <span className="font-medium text-gray-900">
                                            {formatCurrency(
                                              (parseFloat(item.price) || 0) *
                                                (parseInt(item.quantity) || 1)
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                    {transaction.items.length > 3 && (
                                      <p className="text-xs text-gray-500 italic">
                                        +{transaction.items.length - 3} more
                                        items
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Transaction Details */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>
                                  Subtotal:{" "}
                                  {formatCurrency(
                                    parseFloat(transaction.subtotal) ||
                                      parseFloat(transaction.total) ||
                                      0
                                  )}
                                </span>
                                <span>
                                  Tax:{" "}
                                  {formatCurrency(0)} {/* VAT EXEMPT */}
                                </span>
                                {transaction.discount &&
                                  parseFloat(transaction.discount) > 0 && (
                                    <span>
                                      Discount: -
                                      {formatCurrency(
                                        parseFloat(transaction.discount)
                                      )}
                                    </span>
                                  )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening receipt modal
                                  navigator.clipboard.writeText(
                                    transaction.id || `Order-${index + 1}`
                                  );
                                  alert("Transaction ID copied to clipboard!");
                                }}
                                className="text-xs px-3 py-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200 flex items-center space-x-1"
                              >
                                <Copy className="h-3 w-3" />
                                <span>Copy ID</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal using your existing SimpleReceipt component */}
      <SimpleReceipt
        transaction={selectedTransaction}
        isOpen={showReceiptModal}
        onClose={closeAllModals}
      />

      {/* Professional Notification System */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ease-in-out">
          <div
            className={`
              border rounded-lg shadow-lg p-4 animate-in slide-in-from-right duration-300
              ${
                notification.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : notification.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : notification.type === "warning"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5 mr-3">
                {notification.type === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {notification.type === "error" && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {notification.type === "warning" && (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                {notification.type === "info" && (
                  <Users className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <p className="text-sm mt-1 opacity-90">
                  {notification.message}
                </p>

                {notification.action && (
                  <div className="mt-3">
                    <button
                      onClick={notification.action.onClick}
                      className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {notification.action.label}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={clearNotification}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-red-800">
                  {error.title}
                </h4>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>

                <div className="mt-4 flex space-x-3">
                  {error.retryable && (
                    <button
                      onClick={() => {
                        clearError();
                        // Add retry logic here
                      }}
                      className="text-sm font-medium text-red-800 underline hover:no-underline"
                      disabled={isRetrying}
                    >
                      {isRetrying ? "Retrying..." : "Try Again"}
                    </button>
                  )}
                  <button
                    onClick={clearError}
                    className="text-sm font-medium text-red-800 underline hover:no-underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Customer
              </h3>
              <button
                onClick={closeAllModals}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer Error Display */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium">❌ {error.message}</span>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ×
                </button>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateNewCustomer();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Juan Dela Cruz"
                  value={newCustomerForm.customer_name}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
                      customer_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  maxLength={100}
                />
                {newCustomerForm.customer_name &&
                  customers.find(
                    (c) =>
                      c.customer_name?.toLowerCase().trim() ===
                      newCustomerForm.customer_name.toLowerCase().trim()
                  ) && (
                    <p className="mt-1 text-sm text-amber-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Similar customer name already exists
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g., 09123456789"
                  value={newCustomerForm.phone}
                  onChange={(e) => {
                    // Allow only numbers, spaces, dashes, parentheses, plus
                    const value = e.target.value.replace(/[^0-9\s\-\(\)\+\.]/g, '');
                    setNewCustomerForm({
                      ...newCustomerForm,
                      phone: value,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  maxLength={15}
                />
                {newCustomerForm.phone &&
                  (() => {
                    const cleanPhone = PhoneValidator.cleanPhone(newCustomerForm.phone);
                    const existingCustomer = customers.find(
                      (c) =>
                        c.phone &&
                        PhoneValidator.cleanPhone(c.phone) === cleanPhone
                    );
                    const validation = PhoneValidator.validatePhone(newCustomerForm.phone);

                    if (existingCustomer) {
                      return (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          Phone number already used by{" "}
                          {existingCustomer.customer_name}
                        </p>
                      );
                    } else if (validation.type === 'error') {
                      return (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {validation.message}
                        </p>
                      );
                    } else if (validation.type === 'warning') {
                      return (
                        <p className="mt-1 text-sm text-amber-600 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {validation.message}
                        </p>
                      );
                    } else if (validation.type === 'success') {
                      return (
                        <p className="mt-1 text-sm text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {validation.message}
                        </p>
                      );
                    }
                    return null;
                  })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g., juan@email.com"
                  value={newCustomerForm.email}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {newCustomerForm.email &&
                  (() => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    const existingEmailCustomer = customers.find(
                      (c) =>
                        c.email &&
                        c.email.toLowerCase() ===
                          newCustomerForm.email.toLowerCase().trim()
                    );

                    if (existingEmailCustomer) {
                      return (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          Email already used by{" "}
                          {existingEmailCustomer.customer_name}
                        </p>
                      );
                    } else if (!emailRegex.test(newCustomerForm.email.trim())) {
                      return (
                        <p className="mt-1 text-sm text-amber-600 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Please enter a valid email address
                        </p>
                      );
                    } else {
                      return (
                        <p className="mt-1 text-sm text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Valid email address
                        </p>
                      );
                    }
                  })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., 123 Main Street, Barangay, City, Province"
                  value={newCustomerForm.address}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  required
                  maxLength={255}
                />
                {newCustomerForm.address && (
                  <p className="mt-1 text-xs text-gray-500">
                    {newCustomerForm.address.length}/255 characters
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !newCustomerForm.customer_name ||
                    !newCustomerForm.phone ||
                    !newCustomerForm.address ||
                    !PhoneValidator.validatePhone(newCustomerForm.phone).isValid ||
                    isUpdating
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Create Customer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInformationPage;
