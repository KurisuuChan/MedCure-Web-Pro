import React, { useState, useContext } from "react";
import { X, Package, Calendar, AlertCircle } from "lucide-react";
import StandardizedProductDisplay from "../ui/StandardizedProductDisplay";
import { useToast } from "../ui/Toast";
import { UnifiedSpinner } from "../ui/loading/UnifiedSpinner";
import { AuthContext } from "../../contexts/AuthContext";
import NotificationService from "../../services/notifications/NotificationService";

const AddStockModal = ({ isOpen, onClose, product, onSuccess }) => {
  const { success: showSuccess } = useToast();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    quantity: "",
    expiryDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        quantity: "",
        expiryDate: "",
      });
      setError("");
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (!formData.expiryDate) {
      setError("Please select an expiry date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { ProductService } = await import(
        "../../services/domains/inventory/productService"
      );

      const batchData = {
        productId: product.id,
        quantity: parseInt(formData.quantity),
        expiryDate: formData.expiryDate,
        costPerUnit: 0,
        supplierName: null,
      };

      const result = await ProductService.addProductBatch(batchData);
      const resultData = Array.isArray(result) ? result[0] : result;

      if (resultData && resultData.success) {
        const productName =
          product?.brand_name || product?.generic_name || "product";

        // ✅ Show success toast notification
        showSuccess(
          `Successfully added ${formData.quantity} units to ${productName}!`,
          {
            duration: 4000,
            action: {
              label: "View Batches",
              onClick: () => {},
            },
          }
        );

        // 📬 Send notification about stock added and batch received
        if (user?.id) {
          try {
            const batchNumber =
              resultData.batch_number || resultData.batch_id || "N/A";

            // Get updated stock level from product or calculate
            const newStockLevel =
              (product?.stock_in_pieces || 0) + parseInt(formData.quantity);

            // Notify about stock added
            await NotificationService.notifyStockAdded(
              product.id,
              productName,
              parseInt(formData.quantity),
              batchNumber,
              newStockLevel,
              user.id
            );

            // Notify about batch received
            await NotificationService.notifyBatchReceived(
              batchNumber,
              productName,
              parseInt(formData.quantity),
              formData.expiryDate,
              user.id
            );
          } catch (notifyError) {
            console.error("⚠️ Failed to send notification:", notifyError);
            // Don't block the success flow if notification fails
          }
        }

        onSuccess &&
          onSuccess({
            success: true,
            batchId: resultData.batch_id,
            data: batchData,
            result: resultData,
          });
        onClose();
      } else if (resultData && resultData.message) {
        throw new Error(resultData.message);
      } else {
        throw new Error("Failed to add batch - invalid response");
      }
    } catch (error) {
      console.error("Error adding batch:", error);

      if (
        error.message?.includes("function") ||
        error.message?.includes("does not exist")
      ) {
        setError(
          "Batch tracking functions not found in database. Please run the SQL setup in Supabase first."
        );
      } else if (error.message?.includes("structure of query does not match")) {
        setError(
          "Database schema mismatch. Please ensure your RPC functions are up to date."
        );
      } else {
        setError(error.message || "Failed to add stock. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Add Stock
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {product && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wider">
                  Product Summary
                </h3>
                <StandardizedProductDisplay
                  product={product}
                  size="default"
                  showStock={true}
                  showPrice={false}
                  isReadOnly={true}
                  className="border border-blue-200 bg-blue-50"
                />

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-green-800">
                      Automated Batch Number
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    A unique batch number will be automatically generated when
                    you save this stock entry.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Format: BT + Date (MMDDYY) + Incremental ID (e.g.,
                    BT100625-001)
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wider">
                Stock Details
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 text-sm font-medium">Error</p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quantity to Add *
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="Enter quantity"
                      min="1"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="expiryDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Expiry Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      id="expiryDate"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading || !formData.quantity || !formData.expiryDate
                    }
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-lg text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <UnifiedSpinner
                          variant="dots"
                          size="xs"
                          color="white"
                        />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4" />
                        Add Stock
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-xs font-medium mb-1">
                  🤖 Automated Batch Tracking
                </p>
                <p className="text-blue-700 text-xs">
                  This will create a new batch record with an automatically
                  generated batch number and update your inventory.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStockModal;
