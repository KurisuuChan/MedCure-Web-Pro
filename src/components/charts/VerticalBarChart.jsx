import React from 'react';

const VerticalBarChart = ({ data, title, maxHeight = 120, colors = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
          📊
        </div>
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-4 text-center">{title}</h4>
      )}
      
      <div className="flex items-end justify-center space-x-3 px-4" style={{ height: maxHeight + 20 }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * maxHeight : 0;
          const color = colors[index % colors.length];
          
          return (
            <div key={index} className="flex flex-col justify-end items-center space-y-2 min-w-0 flex-1" style={{ height: '100%' }}>
              {/* Value label on top */}
              <div className="text-xs font-semibold text-gray-700 mb-1">
                {item.value > 0 ? (item.formattedValue || `₱${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : ''}
              </div>
              
              {/* Bar - absolutely positioned to bottom */}
              <div className="relative flex-1 w-full flex items-end">
                <div 
                  className="w-full rounded-t-lg transition-all duration-500 ease-out shadow-sm relative group"
                  style={{ 
                    height: barHeight + 'px',
                    backgroundColor: color,
                    minHeight: item.value > 0 ? '8px' : '0px'
                  }}
                >
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-t-lg bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
              </div>
              
              {/* Category label */}
              <div className="text-xs text-gray-600 text-center leading-tight max-w-full mt-2">
                <div className="truncate font-medium">{item.label}</div>
                {item.sublabel && (
                  <div className="truncate text-gray-500 text-[10px]">{item.sublabel}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerticalBarChart;