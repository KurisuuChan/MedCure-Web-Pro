import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Calendar, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { AnalyticsService } from '../../services/domains/analytics/analyticsService';
import LoadingSpinner from '../ui/LoadingSpinner';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SalesChart = () => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [error, setError] = useState(null);

  const periodOptions = [
    { value: '7days', label: 'Last 7 Days', icon: Calendar },
    { value: '30days', label: 'Last 30 Days', icon: Calendar },
    { value: '90days', label: 'Last 3 Months', icon: BarChart3 },
    { value: '365days', label: 'Last Year', icon: TrendingUp }
  ];

  const loadSalesData = async (period) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`📊 [SalesChart] Loading sales data for period: ${period}`);

      const salesTrends = await AnalyticsService.getSalesTrends(period);
      console.log('📊 [SalesChart] Sales trends data:', salesTrends);

      if (!salesTrends || salesTrends.length === 0) {
        setChartData({
          labels: [],
          datasets: [{
            label: 'Daily Sales',
            data: [],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
          }]
        });
        return;
      }

      // Format data for Chart.js
      const labels = salesTrends.map(item => {
        const date = new Date(item.date);
        if (period === '7days' || period === '30days') {
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        } else {
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            year: '2-digit' 
          });
        }
      });

      const salesData = salesTrends.map(item => item.revenue || 0);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Daily Sales (₱)',
            data: salesData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        ]
      });

    } catch (err) {
      console.error('❌ [SalesChart] Error loading sales data:', err);
      setError('Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSalesData(selectedPeriod);
  }, [selectedPeriod]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Sales: ₱${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          },
          callback: function(value) {
            return '₱' + value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverBackgroundColor: 'rgb(59, 130, 246)',
        hoverBorderColor: 'white'
      }
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chart Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadSalesData(selectedPeriod)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
            <p className="text-gray-500 text-sm">Track your daily sales performance</p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          {periodOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedPeriod === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : chartData && chartData.labels.length > 0 ? (
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No sales data available</p>
              <p className="text-gray-400 text-sm">
                Start making sales to see your performance chart
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {chartData && chartData.datasets[0].data.length > 0 && !isLoading && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-900">
                ₱{chartData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">Total Sales</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-900">
                ₱{Math.round(chartData.datasets[0].data.reduce((a, b) => a + b, 0) / chartData.datasets[0].data.length).toLocaleString()}
              </div>
              <div className="text-sm text-green-600">Average Daily</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-900">
                ₱{Math.max(...chartData.datasets[0].data).toLocaleString()}
              </div>
              <div className="text-sm text-purple-600">Peak Day</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesChart;