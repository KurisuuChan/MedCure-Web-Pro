          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div 
              onClick={() => navigate('/transactions')}
              className="flex items-center justify-between mb-6 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/transactions')}
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
                <p className="text-sm text-gray-600">Latest transactions today</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              {dashboardData.recentSales && dashboardData.recentSales.length > 0 ? (
                dashboardData.recentSales.map((sale, index) => (
                  <div 
                    key={sale.id || index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/transactions/${sale.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{sale.customer_name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(sale.created_at).toLocaleTimeString()} • {sale.items_count} items
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{formatCurrency(sale.total_amount)}</div>
                      <div className="text-xs text-gray-500">#{sale.id.slice(-6).toUpperCase()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent transactions</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div 
                onClick={() => navigate('/transactions')}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center space-x-1 cursor-pointer"
              >
                <span>View all transactions</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>