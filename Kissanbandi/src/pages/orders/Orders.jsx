import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../checkout/AuthProvider';
import { toast } from 'react-hot-toast';
import { Package, Clock, MapPin, IndianRupee, Loader, Search, AlertCircle } from 'lucide-react';
import api from '../../services/api';

// Constants
const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800'
};

const FALLBACK_IMAGE = '/images/product-placeholder.jpg';

const Orders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [refreshKey, setRefreshKey] = useState(0); // For manual refresh

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.get('/orders/my-orders', {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                params: {
                    _t: new Date().getTime()
                }
            });
            
            console.log('Orders response:', response.data);
            
            // Handle different response formats
            const ordersData = Array.isArray(response.data) ? response.data :
                             Array.isArray(response.data?.orders) ? response.data.orders :
                             response.data?.data?.orders || [];
            
            if (!Array.isArray(ordersData)) {
                throw new Error('Invalid orders data format received');
            }
            
            setOrders(ordersData);
        } catch (err) {
            console.error('Error loading orders:', err);
            setError(err.response?.data?.error || err.message || 'Failed to load orders');
            toast.error('Failed to load orders. Please try again.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
    }, [loadOrders, refreshKey]);

    const getStatusColor = useCallback((status) => {
        if (!status) return STATUS_COLORS.default;
        return STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.default;
    }, []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'Date not available';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) throw new Error('Invalid date');
            
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    }, []);

    const formatAddress = useCallback((address) => {
        if (!address) return 'Address not available';
        
        const parts = [
            address.address,
            address.city,
            address.state,
            address.pincode && `PIN: ${address.pincode}`,
            address.phone && `Phone: ${address.phone}`
        ].filter(Boolean);
        
        return parts.join(', ') || 'Address details not available';
    }, []);

    const filteredOrders = useMemo(() => {
        if (!Array.isArray(orders)) return [];
        
        return orders.filter(order => {
            if (!order) return false;

            const searchString = searchQuery.toLowerCase();
            const matchesSearch = 
                (order._id || '').toLowerCase().includes(searchString) ||
                (order.items || []).some(item => 
                    item?.product?.name?.toLowerCase().includes(searchString)
                );

            if (filter === 'all') return matchesSearch;
            return matchesSearch && (order.status || '').toLowerCase() === filter;
        });
    }, [orders, searchQuery, filter]);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        toast.success('Refreshing orders...');
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = FALLBACK_IMAGE;
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 mt-32">
                <div className="flex flex-col items-center justify-center">
                    <Loader className="w-8 h-8 animate-spin text-green-600 mb-4" />
                    <p className="text-gray-600">Loading your orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 mt-32">
                <div className="max-w-5xl mx-auto bg-red-50 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <h2 className="text-lg font-medium text-red-800">Error Loading Orders</h2>
                    </div>
                    <p className="mt-2 text-red-600">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 mt-32">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                            <p className="text-gray-600">View and track your orders</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                            </div>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="all">All Orders</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                                onClick={handleRefresh}
                                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                                title="Refresh orders"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                            <p className="text-gray-600">
                                {searchQuery || filter !== 'all'
                                    ? 'Try adjusting your search or filter'
                                    : 'You haven\'t placed any orders yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredOrders.map((order) => (
                                <div key={order._id} className="border border-gray-200 rounded-lg p-6 hover:border-green-500 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">
                                                Order #{order._id}
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-2">
                                                <div className="flex items-center text-gray-600">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {formatDate(order.createdAt)}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                                    {order.status || 'Processing'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 md:mt-0">
                                            <div className="flex items-center text-lg font-medium text-gray-900">
                                                <IndianRupee className="w-5 h-5 mr-1" />
                                                {order.totalAmount?.toFixed(2) || '0.00'}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'items'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                                                <div className="space-y-2">
                                                    {(order.items || []).map((item, index) => (
                                                        <div key={`${order._id}-item-${index}`} className="flex items-center space-x-3">
                                                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                                                <img
                                                                    src={item?.product?.image || FALLBACK_IMAGE}
                                                                    alt={item?.product?.name || 'Product'}
                                                                    className="w-full h-full object-cover"
                                                                    onError={handleImageError}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {item?.product?.name || 'Product Name Not Available'}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    {item?.quantity || 0} × ₹{item?.price?.toFixed(2) || '0.00'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery Address</h4>
                                                <div className="text-sm text-gray-600">
                                                    <div className="flex items-start">
                                                        <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                                                        <div>{formatAddress(order.shippingAddress)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Orders; 