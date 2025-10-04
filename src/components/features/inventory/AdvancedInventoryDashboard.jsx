import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { Alert } from "../../ui/Alert";
import { Modal } from "../../ui/Modal";
import { Select } from "../../ui/Select";
import { Input } from "../../ui/Input";
import AdvancedInventoryService from "../../../services/domains/inventory/advancedInventoryService";

const AdvancedInventoryDashboard = () => {
  const [inventoryAnalysis, setInventoryAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [reorderAlgorithm, setReorderAlgorithm] = useState("moving_average");
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadInventoryData();
    checkExpirationAlerts();
  }, []);

  const loadInventoryData = async () => {
    setIsLoading(true);
    try {
      const analysis = await AdvancedInventoryService.getInventoryAnalysis();
      setInventoryAnalysis(analysis);
    } catch (error) {
      console.error("Error loading inventory data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExpirationAlerts = async () => {
    try {
      const expirationAlerts =
        await AdvancedInventoryService.checkExpirationAlerts();
      setAlerts(expirationAlerts);
    } catch (error) {
      console.error("Error checking expiration alerts:", error);
    }
  };

  const handleCreatePurchaseOrders = async () => {
    try {
      const orders = await AdvancedInventoryService.createPurchaseOrder(
        selectedSuggestions
      );
      if (orders.length > 0) {
        alert(`Created ${orders.length} purchase order(s) successfully!`);
        setShowReorderModal(false);
        setSelectedSuggestions([]);
        loadInventoryData(); // Refresh data
      }
    } catch (error) {
      console.error("Error creating purchase orders:", error);
      alert("Failed to create purchase orders");
    }
  };

  const handleSelectSuggestion = (suggestion, selected) => {
    if (selected) {
      setSelectedSuggestions([...selectedSuggestions, suggestion]);
    } else {
      setSelectedSuggestions(
        selectedSuggestions.filter((s) => s.productId !== suggestion.productId)
      );
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      in_stock: "green",
      low_stock: "yellow",
      out_of_stock: "red",
      overstocked: "blue",
      expiring_soon: "orange",
      expired: "red",
    };
    return colors[status] || "gray";
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: "red",
      high: "orange",
      medium: "yellow",
      low: "green",
    };
    return colors[urgency] || "gray";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading advanced inventory analysis...</div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {inventoryAnalysis.totalProducts}
            </div>
            <div className="text-sm text-gray-600">Total Products</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(inventoryAnalysis.totalValue)}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {inventoryAnalysis.lowStockItems.length}
            </div>
            <div className="text-sm text-gray-600">Low Stock Items</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {inventoryAnalysis.expiringSoon.length}
            </div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Critical Alerts</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert, index) => (
                <Alert
                  key={index}
                  variant={
                    alert.priority === "critical" ? "destructive" : "warning"
                  }
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{alert.productName}</span>
                      <div className="text-sm">{alert.message}</div>
                    </div>
                    <Badge color={getUrgencyColor(alert.priority)}>
                      {alert.priority.toUpperCase()}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Analysis */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Category Analysis</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Products</th>
                  <th className="text-left p-2">Total Value</th>
                  <th className="text-left p-2">Low Stock</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(inventoryAnalysis.categoryAnalysis).map(
                  ([category, data]) => (
                    <tr key={category} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{category}</td>
                      <td className="p-2">{data.count}</td>
                      <td className="p-2">{formatCurrency(data.totalValue)}</td>
                      <td className="p-2">
                        <Badge color={data.lowStockCount > 0 ? "red" : "green"}>
                          {data.lowStockCount}
                        </Badge>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStockLevels = () => (
    <div className="space-y-6">
      {/* Low Stock Items */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Low Stock Items</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Current Stock</th>
                  <th className="text-left p-2">Reorder Point</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Priority</th>
                </tr>
              </thead>
              <tbody>
                {inventoryAnalysis.lowStockItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{item.name}</td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2">{item.reorderPoint}</td>
                    <td className="p-2">
                      <Badge color={getStatusColor(item.status)}>
                        {item.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge color={getUrgencyColor(item.priority)}>
                        {item.priority.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Overstocked Items */}
      {inventoryAnalysis.overstockedItems.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Overstocked Items</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2">Current Stock</th>
                    <th className="text-left p-2">Excess Quantity</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryAnalysis.overstockedItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2">{item.excessQuantity}</td>
                      <td className="p-2">
                        <Badge color={getStatusColor(item.status)}>
                          {item.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderExpirations = () => (
    <div className="space-y-6">
      {/* Expired Items */}
      {inventoryAnalysis.expiredItems.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-red-600">
              Expired Items
            </h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2">Batch</th>
                    <th className="text-left p-2">Days Expired</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryAnalysis.expiredItems.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2">{item.batch.lot_number}</td>
                      <td className="p-2">{item.daysExpired}</td>
                      <td className="p-2">
                        <Badge color="red">EXPIRED</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Soon */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-orange-600">
            Expiring Soon
          </h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Batch</th>
                  <th className="text-left p-2">Days Until Expiry</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryAnalysis.expiringSoon.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{item.name}</td>
                    <td className="p-2">{item.batch.lot_number}</td>
                    <td className="p-2">{item.daysUntilExpiry}</td>
                    <td className="p-2">
                      <Badge
                        color={item.daysUntilExpiry <= 7 ? "red" : "orange"}
                      >
                        EXPIRING SOON
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReorderSuggestions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Reorder Suggestions</h3>
        <div className="flex gap-2">
          <Select
            value={reorderAlgorithm}
            onChange={(e) => setReorderAlgorithm(e.target.value)}
            className="w-48"
          >
            <option value="moving_average">Moving Average</option>
            <option value="seasonal">Seasonal Analysis</option>
            <option value="trend_analysis">Trend Analysis</option>
            <option value="safety_stock">Safety Stock</option>
          </Select>
          <Button
            onClick={() => setShowReorderModal(true)}
            disabled={inventoryAnalysis.reorderSuggestions.length === 0}
          >
            Create Purchase Orders
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Current Stock</th>
                  <th className="text-left p-2">Suggested Quantity</th>
                  <th className="text-left p-2">Estimated Cost</th>
                  <th className="text-left p-2">Urgency</th>
                  <th className="text-left p-2">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {inventoryAnalysis.reorderSuggestions.map((suggestion) => (
                  <tr
                    key={suggestion.productId}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-2 font-medium">
                      {suggestion.productName}
                    </td>
                    <td className="p-2">{suggestion.currentStock}</td>
                    <td className="p-2">{suggestion.suggestedQuantity}</td>
                    <td className="p-2">
                      {formatCurrency(suggestion.estimatedCost)}
                    </td>
                    <td className="p-2">
                      <Badge color={getUrgencyColor(suggestion.urgency)}>
                        {suggestion.urgency.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {suggestion.supplier?.name || "Default Supplier"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Advanced Inventory Management</h1>
        <Button onClick={loadInventoryData}>Refresh Analysis</Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b">
        {[
          { id: "overview", label: "Overview" },
          { id: "stock-levels", label: "Stock Levels" },
          { id: "expirations", label: "Expirations" },
          { id: "reorder", label: "Reorder Suggestions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "stock-levels" && renderStockLevels()}
      {activeTab === "expirations" && renderExpirations()}
      {activeTab === "reorder" && renderReorderSuggestions()}

      {/* Reorder Modal */}
      <Modal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
      >
        <div className="p-6 max-w-4xl">
          <h2 className="text-xl font-bold mb-4">Create Purchase Orders</h2>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {inventoryAnalysis.reorderSuggestions.map((suggestion) => (
              <div key={suggestion.productId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSuggestions.some(
                        (s) => s.productId === suggestion.productId
                      )}
                      onChange={(e) =>
                        handleSelectSuggestion(suggestion, e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium">
                        {suggestion.productName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Current: {suggestion.currentStock} | Suggested:{" "}
                        {suggestion.suggestedQuantity}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(suggestion.estimatedCost)}
                    </div>
                    <Badge color={getUrgencyColor(suggestion.urgency)}>
                      {suggestion.urgency.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Selected: {selectedSuggestions.length} items | Total Cost:{" "}
              {formatCurrency(
                selectedSuggestions.reduce((sum, s) => sum + s.estimatedCost, 0)
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreatePurchaseOrders}
                disabled={selectedSuggestions.length === 0}
              >
                Create Orders
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReorderModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdvancedInventoryDashboard;
