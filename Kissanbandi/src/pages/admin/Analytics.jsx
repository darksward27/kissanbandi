import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api/analyticsApi';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, Calendar, RefreshCcw } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [stats, setStats] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [startDate, endDate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getDashboardStats(
        startDate?.toISOString(),
        endDate?.toISOString()
      );
      setStats(data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format = 'csv') => {
    try {
      setExportLoading(true);
      const blob = await analyticsApi.exportData(
        type,
        startDate?.toISOString(),
        endDate?.toISOString(),
        format
      );
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`${type} exported successfully`);
    } catch (err) {
      toast.error(`Failed to export ${type}`);
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          {/* Date Range Picker */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              className="px-3 py-2 border border-gray-300 rounded-md"
              placeholderText="Select date range"
            />
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setDateRange([null, null]);
              loadStats();
            }}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Reset filters"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>

          {/* Export Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('orders')}
              disabled={exportLoading}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Download className="w-4 h-4" />
              <span>Export Orders</span>
            </button>
            <button
              onClick={() => handleExport('customers')}
              disabled={exportLoading}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              <Download className="w-4 h-4" />
              <span>Export Customers</span>
            </button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">Total Revenue</h3>
              <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            {Object.entries(stats.orderStats).map(([status, data]) => (
              <div key={status} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm text-gray-500 capitalize">{status} Orders</h3>
                <p className="text-2xl font-bold">{data.count}</p>
                <p className="text-sm text-gray-500">₹{data.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Daily Revenue</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Revenue" />
                  <Line type="monotone" dataKey="orders" stroke="#6366F1" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-4">Top Products</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product.name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalSold" fill="#10B981" name="Units Sold" />
                    <Bar dataKey="revenue" fill="#6366F1" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-4">Top Customers</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.topCustomers}
                      dataKey="totalSpent"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                    >
                      {stats.topCustomers.map((entry, index) => (
                        <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics; 