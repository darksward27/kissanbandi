import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ordersApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Calendar, Download, Filter, RefreshCcw, Loader, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import OrderDetailsModal from '../../components/modals/OrderDetailsModal';

// Constants
const ITEMS_PER_PAGE = 10;
const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [orderStats, setOrderStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching orders with filters:', { startDate, endDate, filterStatus, page });
      
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        status: filterStatus,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() })
      };

      const response = await ordersApi.getAllOrders(params);
      console.log('Orders response:', response);

      if (!response || !response.orders) {
        throw new Error('Invalid response format');
      }

      setOrders(response.orders);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterStatus]);

  const loadOrderStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setError(null);
      console.log('Fetching order stats with date range:', { startDate, endDate });

      const params = {
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() })
      };

      const response = await ordersApi.getOrderStats(params);
      console.log('Order stats response:', response);

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from stats API');
      }

      setOrderStats({
        totalOrders: response.totalOrders || 0,
        totalRevenue: response.totalRevenue || 0,
        averageOrderValue: response.averageOrderValue || 0,
        statusBreakdown: response.statusBreakdown || {},
        dailyStats: Array.isArray(response.dailyStats) ? response.dailyStats : []
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load order statistics';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Set minimal stats to prevent UI breaks
      setOrderStats({
        totalOrders: orders.length,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusBreakdown: {},
        dailyStats: []
      });
    } finally {
      setStatsLoading(false);
    }
  }, [startDate, endDate, orders.length]);

  useEffect(() => {
    loadOrders(1); // Reset to first page when filters change
    loadOrderStats();
  }, [startDate, endDate, filterStatus]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      await ordersApi.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      await loadOrders(currentPage);
      await loadOrderStats();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(err.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleExportOrders = async () => {
    try {
      setExportLoading(true);
      setError(null);
      console.log('Exporting orders with filters:', { startDate, endDate, filterStatus });

      const params = {
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
        ...(filterStatus && { status: filterStatus })
      };

      const response = await ordersApi.exportOrders(params);
      console.log('Export response type:', response?.type);
      
      if (!response) {
        throw new Error('No response received from export API');
      }

      // Create and trigger download
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Orders exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to export orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  const resetFilters = () => {
    setDateRange([null, null]);
    setFilterStatus('');
    setCurrentPage(1);
    loadOrders(1);
    loadOrderStats();
  };

  const getStatusBadgeClass = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const renderPagination = () => {
    return (
      <div className="flex justify-between items-center mt-4 px-6 py-3 bg-gray-50">
        <div className="text-sm text-gray-700">
          Showing page {currentPage} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => loadOrders(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className={`px-3 py-1 rounded ${
              currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => loadOrders(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const renderOrders = () => {
    if (!Array.isArray(orders)) {
      console.warn('Orders is not an array:', orders);
      return null;
    }

    return orders.map((order) => (
      <tr key={order._id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order._id}</td>
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
        </td>
        <td className="px-6 py-4">
          <ul className="text-sm text-gray-900">
            {order.items?.map((item, index) => (
              <li key={index} className="mb-1">
                {item.product?.name || 'Unknown Product'} × {item.quantity}
              </li>
            ))}
          </ul>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">₹{(order.totalAmount || 0).toLocaleString()}</td>
        <td className="px-6 py-4">
          {updatingStatus === order._id ? (
            <div className="flex items-center">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Updating...</span>
            </div>
          ) : (
            <select
              value={order.status || 'pending'}
              onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)}`}
              disabled={updatingStatus === order._id}
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">{order.user?.phone || 'N/A'}</div>
          <div className="text-sm text-gray-500">
            {order.shippingAddress ? (
              `${order.shippingAddress.city || 'N/A'}, ${order.shippingAddress.state || 'N/A'}`
            ) : (
              'Address not available'
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => handleViewDetails(order)}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            View Details
          </button>
        </td>
      </tr>
    ));
  };

  if (loading && !orders.length) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader className="w-8 h-8 animate-spin text-green-600 mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto bg-red-50 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-medium text-red-800">Error Loading Orders</h2>
          </div>
          <p className="mt-2 text-red-600">{error}</p>
          <button 
            onClick={() => loadOrders(1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <div className="mt-4 flex flex-wrap gap-4 items-center">
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              setDateRange(update);
              setCurrentPage(1);
            }}
            isClearable={true}
            placeholderText="Select date range"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Reset Filters
          </button>
          <button
            onClick={handleExportOrders}
            disabled={exportLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
          >
            {exportLoading ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export Orders
          </button>
        </div>
      </div>

      {/* Order Statistics */}
      {orderStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow relative">
            {statsLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin text-green-600" />
              </div>
            )}
            <h3 className="text-sm text-gray-500">Total Orders</h3>
            <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow relative">
            {statsLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin text-green-600" />
              </div>
            )}
            <h3 className="text-sm text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold">₹{orderStats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow relative">
            {statsLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin text-green-600" />
              </div>
            )}
            <h3 className="text-sm text-gray-500">Average Order Value</h3>
            <p className="text-2xl font-bold">₹{orderStats.averageOrderValue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow relative">
            {statsLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin text-green-600" />
              </div>
            )}
            <h3 className="text-sm text-gray-500">Status Breakdown</h3>
            <div className="text-sm">
              {Object.entries(orderStats.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex justify-between mt-1">
                  <span className="capitalize">{status}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto relative">
          {loading && orders.length > 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <Loader className="w-8 h-8 animate-spin text-green-600" />
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderOrders()}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AdminOrders; 