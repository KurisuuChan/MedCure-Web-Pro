          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div 
              onClick={() => navigate('/inventory')}
              className="flex items-center justify-between mb-6 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/inventory')}
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
                <p className="text-sm text-gray-600">Products running low</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              {dashboardData.getCriticalAlerts && dashboardData.getCriticalAlerts().lowStock?.length > 0 ? (
                dashboardData.getCriticalAlerts().lowStock.slice(0, 4).map((alert, index) => (
                  <div 
                    key={alert.product?.id || index}
                    onClick={() => navigate('/inventory', { state: { searchQuery: alert.product?.generic_name } })}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-red-50 cursor-pointer transition-colors border border-red-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {alert.product?.brand_name || alert.product?.generic_name || 'Unknown Product'}
                        </div>
                        <div className="text-xs text-red-600 font-medium">
                          {alert.product?.stock_in_pieces || 0} units remaining
                        </div>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      LOW
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-300" />
                  <p className="text-sm">All products well stocked</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {dashboardData.lowStockCount || 0} products need attention
                </div>
                <div 
                  onClick={() => navigate('/inventory?filter=lowStock')}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center space-x-1 cursor-pointer"
                >
                  <span>Manage stock</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>