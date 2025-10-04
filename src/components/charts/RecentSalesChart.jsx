import React from 'react';
import { DollarSign, TrendingUp, Clock } from 'lucide-react';

const RecentSalesChart = ({ data, title = "Recent Sales", maxItems = 5 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No recent sales</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map(sale => sale.amount || 0));

  return (
    <div className="space-y-4">
      {data.slice(0, maxItems).map((sale, index) => {
        const percentage = maxAmount > 0 ? (sale.amount / maxAmount) * 100 : 0;
        
        return (
          <div key={sale.id || index} className="group">
            {/* Sale Info Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{sale.customer || 'Walk-in Customer'}</div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{sale.time ? new Date(sale.time).toLocaleTimeString() : 'Recent'}</span>
                    {sale.items && <span>• {sale.items} items</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  ₱{(sale.amount || 0).toLocaleString()}
                </div>
                {sale.id && (
                  <div className="text-xs text-gray-500">
                    #{sale.id.toString().slice(-6).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Amount Bar */}
            <div className="relative">
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {Math.round(percentage)}% of largest sale
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total from {data.length} recent sales</span>
          <span className="font-semibold text-green-600">
            ₱{data.reduce((sum, sale) => sum + (sale.amount || 0), 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecentSalesChart;