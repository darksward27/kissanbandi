import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Calendar, Download, Filter, RefreshCcw } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [orderStats, setOrderStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadOrders();
    loadOrderStats();
  }, [startDate, endDate, filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders with filters:', { startDate, endDate, filterStatus });
      
      let ordersData;
      if (startDate && endDate) {
        ordersData = await ordersApi.getOrdersByDateRange(startDate.toISOString(), endDate.toISOString());
      } else {
        ordersData = await ordersApi.getAllOrders();
      }

      console.log('Orders received:', {
        count: ordersData?.length,
        sample: ordersData?.[0]
      });
      
      // Filter by status if needed
      if (filterStatus) {
        ordersData = ordersData.filter(order => order.status === filterStatus);
        console.log('Orders after status filter:', {
          status: filterStatus,
          count: ordersData.length
        });
      }
      
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      console.error('Error loading orders:', {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      setOrders([]);
      setError(err.message || 'Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderStats = async () => {
    try {
      // Skip stats loading if no orders
      if (!orders.length) {
        setOrderStats({
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          statusBreakdown: {}
        });
        return;
      }

      // Calculate stats from orders if API fails
      const calculateStats = (ordersList) => {
        const total = ordersList.length;
        const revenue = ordersList.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const average = total ? revenue / total : 0;
        
        // Calculate status breakdown
        const breakdown = ordersList.reduce((acc, order) => {
          const status = order.status || 'pending';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        return {
          totalOrders: total,
          totalRevenue: revenue,
          averageOrderValue: average,
          statusBreakdown: breakdown
        };
      };

      try {
        console.log('Attempting to fetch order stats from API...');
        const stats = await ordersApi.getOrderStats(
          startDate?.toISOString(),
          endDate?.toISOString()
        );
        
        if (stats) {
          setOrderStats({
            totalOrders: stats.totalOrders || 0,
            totalRevenue: stats.totalRevenue || 0,
            averageOrderValue: stats.averageOrderValue || 0,
            statusBreakdown: stats.statusBreakdown || {}
          });
          return;
        }
      } catch (err) {
        console.log('Falling back to client-side stats calculation');
      }

      // Fallback: Calculate stats from available orders
      const calculatedStats = calculateStats(orders);
      console.log('Calculated stats from orders:', calculatedStats);
      setOrderStats(calculatedStats);
      
    } catch (err) {
      console.error('Error handling order stats:', err);
      // Set minimal stats to prevent UI breaks
      setOrderStats({
        totalOrders: orders.length,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusBreakdown: {}
      });
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await ordersApi.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      loadOrders();
      loadOrderStats();
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const handleExportOrders = async () => {
    try {
      const blob = await ordersApi.exportOrders({
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        status: filterStatus
      });
      
      // Create download link
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
      toast.error('Failed to export orders');
    }
  };

  const resetFilters = () => {
    setDateRange([null, null]);
    setFilterStatus('');
    loadOrders();
    loadOrderStats();
  };

  const renderOrders = () => {
    if (!Array.isArray(orders)) {
      console.warn('Orders is not an array:', orders);
      return null;
    }

    return orders.map((order) => (
      <tr key={order._id}>
        <td className="px-6 py-4 whitespace-nowrap">{order._id}</td>
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
        </td>
        <td className="px-6 py-4">
          <ul className="text-sm text-gray-900">
            {order.items?.map((item, index) => (
              <li key={index}>{item.product?.name || 'Unknown Product'} x {item.quantity}</li>
            ))}
          </ul>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">₹{(order.totalAmount || 0).toLocaleString()}</td>
        <td className="px-6 py-4">
          <select
            value={order.status || 'pending'}
            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              order.status === 'delivered' 
                ? 'bg-green-100 text-green-800' 
                : order.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">{order.user?.phone || 'N/A'}</div>
          <div className="text-sm text-gray-500">{`${order.shippingAddress?.city || 'N/A'}, ${order.shippingAddress?.state || 'N/A'}`}</div>
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => window.open(`/admin/orders/${order._id}`, '_blank')}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            View Details
          </button>
        </td>
      </tr>
    ));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <button 
            onClick={loadOrders}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
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

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Reset filters"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportOrders}
            className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Order Statistics */}
      {orderStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Total Orders</h3>
            <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold">₹{orderStats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Average Order Value</h3>
            <p className="text-2xl font-bold">₹{orderStats.averageOrderValue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderOrders()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders; 