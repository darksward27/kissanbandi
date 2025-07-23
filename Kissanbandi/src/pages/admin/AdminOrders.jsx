import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ordersApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  Download, 
  Filter, 
  RefreshCcw, 
  Loader, 
  AlertCircle, 
  Search,
  Eye,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Phone,
  MapPin,
  Mail,
  Edit3,
  Save,
  MessageSquare,
  AlertTriangle,
  Plus,
  StickyNote
} from 'lucide-react';
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
  
  // Admin notes state
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  
  // New features state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const loadOrders = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching orders with filters:', { startDate, endDate, filterStatus, page, searchTerm, sortField, sortOrder });
      
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        status: filterStatus,
        search: searchTerm,
        sortField,
        sortOrder,
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
  }, [startDate, endDate, filterStatus, searchTerm, sortField, sortOrder]);

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
  }, [startDate, endDate, filterStatus, searchTerm, sortField, sortOrder]);

  // Admin note functions
  const handleEditNote = (orderId, currentNote = '') => {
    setEditingNote(orderId);
    setNoteText(currentNote);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setNoteText('');
  };

  const handleSaveNote = async (orderId) => {
    try {
      setSavingNote(true);
      
      // API call to save admin note
      const response = await ordersApi.updateAdminNote(orderId, {
        adminNote: noteText.trim()
      });

      if (response.success) {
        // Update the order in local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, adminNote: noteText.trim() }
              : order
          )
        );

        toast.success('Admin note saved successfully');
        setEditingNote(null);
        setNoteText('');
      } else {
        throw new Error(response.message || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving admin note:', error);
      toast.error('Failed to save admin note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const toggleNoteExpansion = (orderId) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedNotes(newExpanded);
  };

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

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrders.size === 0) {
      toast.error('No orders selected');
      return;
    }

    try {
      setBulkActionLoading(true);
      const orderIds = Array.from(selectedOrders);
      
      // Update orders one by one (in a real app, you'd have a bulk API)
      for (const orderId of orderIds) {
        await ordersApi.updateOrderStatus(orderId, newStatus);
      }
      
      toast.success(`${orderIds.length} orders updated successfully`);
      setSelectedOrders(new Set());
      await loadOrders(currentPage);
      await loadOrderStats();
    } catch (err) {
      console.error('Error updating orders:', err);
      toast.error('Failed to update selected orders');
    } finally {
      setBulkActionLoading(false);
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
        ...(filterStatus && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm })
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
    setSearchTerm('');
    setSortField('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
    setSelectedOrders(new Set());
    loadOrders(1);
    loadOrderStats();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleOrderSelection = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(order => order._id)));
    }
  };

  const getStatusBadgeClass = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <TrendingUp className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getNoteTypeConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'cancelled':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          icon: <AlertTriangle className="w-4 h-4" />,
          title: 'Cancellation Note',
          placeholder: 'Add cancellation reason...'
        };
      case 'processing':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
          icon: <Clock className="w-4 h-4" />,
          title: 'Processing Note',
          placeholder: 'Add processing details...'
        };
      case 'shipped':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          icon: <TrendingUp className="w-4 h-4" />,
          title: 'Shipping Note',
          placeholder: 'Add shipping details...'
        };
      case 'delivered':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          icon: <Package className="w-4 h-4" />,
          title: 'Delivery Note',
          placeholder: 'Add delivery details...'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          buttonColor: 'bg-gray-600 hover:bg-gray-700',
          icon: <StickyNote className="w-4 h-4" />,
          title: 'Admin Note',
          placeholder: 'Add admin note...'
        };
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <SortAsc className="w-4 h-4 opacity-30" />;
    return sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  const renderAdminNote = (order) => {
    const isExpanded = expandedNotes.has(order._id);
    const isEditing = editingNote === order._id;
    const noteConfig = getNoteTypeConfig(order.status);

    return (
      <div className={`mt-2 p-3 ${noteConfig.bgColor} border ${noteConfig.borderColor} rounded-lg`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={noteConfig.iconColor}>{noteConfig.icon}</span>
            <span className={`text-sm font-medium ${noteConfig.textColor}`}>{noteConfig.title}</span>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => handleEditNote(order._id, order.adminNote)}
                className={`${noteConfig.iconColor} hover:opacity-80 transition-colors`}
                title="Edit note"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {order.adminNote && (
              <button
                onClick={() => toggleNoteExpansion(order._id)}
                className={`${noteConfig.iconColor} hover:opacity-80 transition-colors`}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={noteConfig.placeholder}
              className={`w-full p-2 text-sm border ${noteConfig.borderColor} rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none`}
              rows="3"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSaveNote(order._id)}
                disabled={savingNote}
                className={`px-3 py-1 text-xs text-white rounded ${noteConfig.buttonColor} transition-colors flex items-center space-x-1 disabled:opacity-50`}
              >
                {savingNote ? (
                  <Loader className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                <span>{savingNote ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={`text-sm ${noteConfig.textColor}`}>
            {order.adminNote ? (
              <div>
                <p className={isExpanded ? '' : 'line-clamp-2'}>
                  {order.adminNote}
                </p>
                {!isExpanded && order.adminNote.length > 100 && (
                  <button
                    onClick={() => toggleNoteExpansion(order._id)}
                    className={`${noteConfig.iconColor} hover:opacity-80 text-xs mt-1`}
                  >
                    Show more...
                  </button>
                )}
              </div>
            ) : (
              <div className={`flex items-center space-x-2 ${noteConfig.iconColor}`}>
                <MessageSquare className="w-4 h-4" />
                <span className="italic">No {noteConfig.title.toLowerCase()} added yet</span>
                <button
                  onClick={() => handleEditNote(order._id, '')}
                  className={`${noteConfig.iconColor} hover:opacity-80`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= Math.min(5, totalPages); i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 px-4 sm:px-6 py-3 bg-amber-50 border-t border-amber-100">
        <div className="text-sm text-gray-700 mb-2 sm:mb-0">
          Showing page {currentPage} of {totalPages} ({orders.length} orders)
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => loadOrders(1)}
            disabled={currentPage === 1 || loading}
            className="px-2 py-1 text-sm rounded bg-white text-gray-700 hover:bg-amber-50 disabled:bg-gray-100 disabled:text-gray-400 border border-amber-200"
          >
            First
          </button>
          <button
            onClick={() => loadOrders(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-amber-50 disabled:bg-gray-100 disabled:text-gray-400 border border-amber-200"
          >
            Previous
          </button>
          {pages.map(page => (
            <button
              key={page}
              onClick={() => loadOrders(page)}
              className={`px-3 py-1 text-sm rounded border ${
                currentPage === page 
                  ? 'bg-amber-600 text-white border-amber-600' 
                  : 'bg-white text-gray-700 hover:bg-amber-50 border-amber-200'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => loadOrders(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-amber-50 disabled:bg-gray-100 disabled:text-gray-400 border border-amber-200"
          >
            Next
          </button>
          <button
            onClick={() => loadOrders(totalPages)}
            disabled={currentPage === totalPages || loading}
            className="px-2 py-1 text-sm rounded bg-white text-gray-700 hover:bg-amber-50 disabled:bg-gray-100 disabled:text-gray-400 border border-amber-200"
          >
            Last
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

  const renderCardView = () => {
    if (!Array.isArray(orders)) {
      return null;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow-md border border-amber-100 hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order._id)}
                    onChange={() => toggleOrderSelection(order._id)}
                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <h3 className="font-medium text-gray-900 text-sm">#{order._id.slice(-8)}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusBadgeClass(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="capitalize">{order.status || 'pending'}</span>
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{order.user?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">₹{(order.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                {order.user?.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{order.user.phone}</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Items ({order.items?.length || 0})</div>
                <div className="text-sm text-gray-700 max-h-16 overflow-y-auto">
                  {order.items?.slice(0, 2).map((item, index) => (
                    <div key={index} className="truncate">
                      {item.product?.name || 'Unknown Product'} × {item.quantity}
                    </div>
                  ))}
                  {order.items?.length > 2 && (
                    <div className="text-xs text-gray-500">+{order.items.length - 2} more items</div>
                  )}
                </div>
              </div>

              {/* Admin Note in Card View - Now for all orders */}
              {renderAdminNote(order)}

              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => handleViewDetails(order)}
                  className="flex-1 px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                <select
                  value={order.status || 'pending'}
                  onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                  disabled={updatingStatus === order._id}
                  className="px-2 py-2 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableView = () => {
    if (!Array.isArray(orders)) {
      return null;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-amber-200">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedOrders.size === orders.length && orders.length > 0}
                  onChange={toggleAllOrders}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
              </th>
              <th 
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider cursor-pointer hover:bg-amber-100"
                onClick={() => handleSort('_id')}
              >
                <div className="flex items-center space-x-1">
                  <span>Order ID</span>
                  <SortIcon field="_id" />
                </div>
              </th>
              <th 
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider cursor-pointer hover:bg-amber-100 hidden sm:table-cell"
                onClick={() => handleSort('user.name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Customer</span>
                  <SortIcon field="user.name" />
                </div>
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider hidden md:table-cell">Items</th>
              <th 
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider cursor-pointer hover:bg-amber-100"
                onClick={() => handleSort('totalAmount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Total</span>
                  <SortIcon field="totalAmount" />
                </div>
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Status</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider hidden lg:table-cell">Contact</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-100">
            {orders.map((order) => (
              <React.Fragment key={order._id}>
                <tr className="hover:bg-amber-50 transition-colors">
                  <td className="px-3 sm:px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order._id)}
                      onChange={() => toggleOrderSelection(order._id)}
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">#{order._id.slice(-8)}</div>
                    <div className="text-xs text-gray-500 sm:hidden">
                      {order.user?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                    <div className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {order.items?.slice(0, 2).map((item, index) => (
                        <div key={index} className="truncate">
                          {item.product?.name || 'Unknown Product'} × {item.quantity}
                        </div>
                      ))}
                      {order.items?.length > 2 && (
                        <div className="text-xs text-gray-500">+{order.items.length - 2} more</div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                    ₹{(order.totalAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    {updatingStatus === order._id ? (
                      <div className="flex items-center">
                        <Loader className="w-4 h-4 animate-spin mr-2 text-amber-600" />
                        <span className="text-sm text-gray-500">Updating...</span>
                      </div>
                    ) : (
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(order.status)} focus:ring-2 focus:ring-amber-500`}
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
                  <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                    <div className="text-sm text-gray-900">{order.user?.phone || 'N/A'}</div>
                    <div className="text-sm text-gray-500">
                      {order.shippingAddress ? (
                        `${order.shippingAddress.city || 'N/A'}, ${order.shippingAddress.state || 'N/A'}`
                      ) : (
                        'Address not available'
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-amber-600 hover:text-amber-900 text-sm font-medium flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={() => handleEditNote(order._id, order.adminNote)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                        title="Add/Edit Note"
                      >
                        <StickyNote className="w-4 h-4" />
                        <span className="hidden sm:inline">Note</span>
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Admin Note Row for All Orders */}
                <tr className={`${getNoteTypeConfig(order.status).bgColor} border-t ${getNoteTypeConfig(order.status).borderColor}`}>
                  <td colSpan="8" className="px-3 sm:px-6 py-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <span className={getNoteTypeConfig(order.status).iconColor}>
                          {getNoteTypeConfig(order.status).icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`text-sm font-medium ${getNoteTypeConfig(order.status).textColor}`}>
                            {getNoteTypeConfig(order.status).title}
                          </h4>
                          {editingNote !== order._id && (
                            <button
                              onClick={() => handleEditNote(order._id, order.adminNote)}
                              className={`${getNoteTypeConfig(order.status).iconColor} hover:opacity-80 transition-colors flex items-center space-x-1`}
                              title={`Edit ${getNoteTypeConfig(order.status).title.toLowerCase()}`}
                            >
                              <Edit3 className="w-4 h-4" />
                              <span className="text-xs hidden sm:inline">Edit Note</span>
                            </button>
                          )}
                        </div>
                        
                        {editingNote === order._id ? (
                          <div className="space-y-3">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder={getNoteTypeConfig(order.status).placeholder}
                              className={`w-full p-3 text-sm border ${getNoteTypeConfig(order.status).borderColor} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none`}
                              rows="3"
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleSaveNote(order._id)}
                                disabled={savingNote}
                                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
                              >
                                {savingNote ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                                <span>{savingNote ? 'Saving...' : 'Save Note'}</span>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-1"
                              >
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/60 p-3 rounded-lg border border-gray-200">
                            {order.adminNote ? (
                              <div className="text-sm text-black">
                                <div className="flex items-start space-x-2">
                                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="leading-relaxed">{order.adminNote}</p>
                                    <p className="text-xs text-gray-600 mt-1 opacity-75">
                                      Added by admin
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className={`flex items-center space-x-2 ${getNoteTypeConfig(order.status).iconColor}`}>
                                  <MessageSquare className="w-4 h-4" />
                                  <span className="text-sm italic">No {getNoteTypeConfig(order.status).title.toLowerCase()} added yet</span>
                                </div>
                                <button
                                  onClick={() => handleEditNote(order._id, '')}
                                  className={`px-3 py-1 text-xs text-white rounded hover:opacity-80 transition-colors flex items-center space-x-1 ${getNoteTypeConfig(order.status).buttonColor}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Note</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading && !orders.length) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-amber-50">
        <div className="flex flex-col items-center bg-white p-8 rounded-lg shadow-lg">
          <Loader className="w-8 h-8 animate-spin text-amber-600 mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && !orders.length) {
    return (
      <div className="p-4 sm:p-6 bg-amber-50 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 shadow-lg border border-red-200">
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
    <div className="min-h-screen bg-amber-50">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2 sm:mb-0">Orders Management</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
              >
                {viewMode === 'table' ? <Grid className="w-5 h-5" /> : <List className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors sm:hidden"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className={`space-y-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders by ID, customer name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
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
                className="w-full sm:w-auto px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-amber-600 hover:text-amber-800 hover:bg-amber-100 flex items-center space-x-2 rounded-lg transition-colors border border-amber-300"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleExportOrders}
                  disabled={exportLoading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exportLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden mt-4 w-full py-2 text-center text-amber-600 hover:bg-amber-100 rounded-lg transition-colors border border-amber-300"
          >
            {showFilters ? (
              <div className="flex items-center justify-center space-x-2">
                <ChevronUp className="w-4 h-4" />
                <span>Hide Filters</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <ChevronDown className="w-4 h-4" />
                <span>Show Filters</span>
              </div>
            )}
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="mb-6 p-4 bg-amber-100 rounded-lg border border-amber-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-amber-800">
                {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status}
                    onClick={() => handleBulkStatusUpdate(status)}
                    disabled={bulkActionLoading}
                    className="px-3 py-1 text-xs bg-white text-amber-700 rounded-lg hover:bg-amber-50 border border-amber-300 disabled:opacity-50 transition-colors"
                  >
                    {bulkActionLoading ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      `Mark as ${status.charAt(0).toUpperCase() + status.slice(1)}`
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedOrders(new Set())}
                  className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-300 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Statistics */}
        {orderStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md border border-amber-100 relative">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                  <Loader className="w-4 h-4 animate-spin text-amber-600" />
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Total Orders</h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{orderStats.totalOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md border border-amber-100 relative">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                  <Loader className="w-4 h-4 animate-spin text-amber-600" />
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Total Revenue</h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{orderStats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md border border-amber-100 relative">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                  <Loader className="w-4 h-4 animate-spin text-amber-600" />
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Avg. Order Value</h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{orderStats.averageOrderValue.toFixed(0)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md border border-amber-100 relative col-span-2 lg:col-span-1">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                  <Loader className="w-4 h-4 animate-spin text-amber-600" />
                </div>
              )}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm text-gray-500 mb-2">Status Breakdown</h3>
                  <div className="space-y-1">
                    {Object.entries(orderStats.statusBreakdown).slice(0, 3).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center text-xs">
                        <span className="capitalize text-gray-600">{status}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Display */}
        <div className="bg-white rounded-lg shadow-md border border-amber-100 overflow-hidden">
          <div className="p-4 bg-amber-50 border-b border-amber-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-amber-900">
                Orders ({orders.length})
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  className="px-3 py-1 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="totalAmount-desc">Highest Amount</option>
                  <option value="totalAmount-asc">Lowest Amount</option>
                  <option value="user.name-asc">Customer A-Z</option>
                  <option value="user.name-desc">Customer Z-A</option>
                </select>
              </div>
            </div>
          </div>

          <div className="relative">
            {loading && orders.length > 0 && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                  <Loader className="w-6 h-6 animate-spin text-amber-600" />
                  <span className="text-gray-600">Updating orders...</span>
                </div>
              </div>
            )}

            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="p-0">
                {viewMode === 'table' ? (
                  <div className="overflow-hidden">
                    {renderTableView()}
                  </div>
                ) : (
                  <div className="p-4">
                    {renderCardView()}
                  </div>
                )}
              </div>
            )}
          </div>

          {orders.length > 0 && renderPagination()}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={handleCloseModal}
          />
        )}
      </div>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AdminOrders;