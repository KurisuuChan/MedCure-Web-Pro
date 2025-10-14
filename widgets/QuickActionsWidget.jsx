          {/* Quick Actions Center */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-600">Common pharmacy tasks</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { 
                  icon: ShoppingCart, 
                  label: 'New Sale', 
                  path: '/pos', 
                  color: 'purple',
                  stats: `${dashboardData.todayMetrics?.transactions || 0} today`
                },
                { 
                  icon: Package, 
                  label: 'Add Stock', 
                  path: '/inventory', 
                  color: 'blue',
                  stats: `${dashboardData.totalProducts || 0} products`
                },
                { 
                  icon: Users, 
                  label: 'Customers', 
                  path: '/customers', 
                  color: 'green',
                  stats: `${dashboardData.todayMetrics?.customers || 0} active`
                },
                { 
                  icon: BarChart3, 
                  label: 'Reports', 
                  path: '/analytics', 
                  color: 'orange',
                  stats: 'View insights'
                }
              ].map((action, index) => {
                const colorClasses = {
                  purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
                  blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
                  green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
                  orange: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                };
                
                return (
                  <div
                    key={index}
                    onClick={() => navigate(action.path)}
                    className={`${colorClasses[action.color]} border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <action.icon className="h-6 w-6" />
                      <div className="font-medium text-sm">{action.label}</div>
                      <div className="text-xs opacity-75">{action.stats}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">System Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">All Systems Online</span>
                </div>
              </div>
            </div>
          </div>