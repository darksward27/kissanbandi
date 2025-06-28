import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../checkout/AuthProvider';
import { toast } from 'react-hot-toast';
import { Package, Clock, MapPin, IndianRupee, Loader, Search, AlertCircle, RefreshCw, Filter, Calendar, CheckCircle } from 'lucide-react';
import api from '../../services/api';

// Constants
const STATUS_COLORS = {
    pending: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200',
    processing: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200',
    shipped: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200',
    delivered: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200',
    cancelled: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200',
    default: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
};

const FALLBACK_IMAGE = '/images/product-placeholder.jpg';

const Orders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [refreshKey, setRefreshKey] = useState(0);
    const [ordersLoaded, setOrdersLoaded] = useState(false);

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
            setTimeout(() => setOrdersLoaded(true), 100);
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
        setOrdersLoaded(false);
        toast.success('Refreshing orders...');
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = FALLBACK_IMAGE;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                <div className="container mx-auto px-4 py-8 pt-32">
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-green-100 p-12 text-center">
                            <div className="relative">
                                <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-6" />
                                <div className="absolute inset-0 w-12 h-12 border-4 border-green-200 rounded-full animate-pulse mx-auto"></div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Loading Orders</h3>
                            <p className="text-gray-600">Please wait while we fetch your orders...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                <div className="container mx-auto px-4 py-8 pt-32">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 backdrop-blur-sm rounded-3xl shadow-xl border border-red-200 p-8">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-red-800">Error Loading Orders</h2>
                                    <p className="text-red-600 mt-1">{error}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="group bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-xl font-medium hover:from-red-700 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 flex items-center"
                            >
                                <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            <div className="container mx-auto px-4 py-8 pt-32">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-green-100 p-8 hover:shadow-2xl transition-all duration-500">
                        {/* Header Section */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
                            <div className="text-center lg:text-left">
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                                    My Orders
                                </h1>
                                <p className="text-gray-600 text-lg">View and track your orders</p>
                                <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full mt-2 mx-auto lg:mx-0"></div>
                            </div>
                            
                            {/* Controls */}
                            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Search orders..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-12 pr-4 py-3 border-2 border-green-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-green-200"
                                    />
                                    <Search className="w-5 h-5 text-green-400 absolute left-4 top-4 group-focus-within:text-green-600 transition-colors" />
                                </div>
                                
                                <div className="relative">
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="appearance-none pl-10 pr-8 py-3 border-2 border-green-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-green-200"
                                    >
                                        <option value="all">All Orders</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <Filter className="w-5 h-5 text-green-400 absolute left-3 top-4 pointer-events-none" />
                                </div>
                                
                                <button
                                    onClick={handleRefresh}
                                    className="group p-3 text-green-600 hover:text-white hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 transition-all duration-300 rounded-xl border-2 border-green-100 hover:border-green-600 transform hover:scale-105"
                                    title="Refresh orders"
                                >
                                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                </button>
                            </div>
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-12 border border-green-100 max-w-md mx-auto">
                                    <div className="text-green-300 mb-6">
                                        <Package className="w-20 h-20 mx-auto animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-3">No orders found</h3>
                                    <p className="text-gray-600 text-lg">
                                        {searchQuery || filter !== 'all'
                                            ? 'Try adjusting your search or filter'
                                            : 'You haven\'t placed any orders yet'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {filteredOrders.map((order, index) => (
                                    <div 
                                        key={order._id} 
                                        className={`group bg-gradient-to-r from-white to-green-50/30 border-2 border-green-100 rounded-2xl p-6 hover:border-green-300 hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] ${ordersLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        {/* Order Header */}
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                                                        <Package className="w-6 h-6 text-green-600" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                                                        Order #{order._id}
                                                    </h3>
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="flex items-center text-gray-600 bg-white/60 px-3 py-2 rounded-lg">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        <span className="text-sm font-medium">{formatDate(order.createdAt)}</span>
                                                    </div>
                                                    <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getStatusColor(order.status)} transform hover:scale-105 transition-all duration-200`}>
                                                        <CheckCircle className="w-4 h-4 inline mr-2" />
                                                        {order.status || 'Processing'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 lg:mt-0 text-center lg:text-right">
                                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                    <div className="flex items-center justify-center lg:justify-end text-2xl font-bold">
                                                        <IndianRupee className="w-6 h-6 mr-1 text-green-600" />
                                                        {order.totalAmount?.toFixed(2) || '0.00'}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1 bg-green-50 px-3 py-1 rounded-full inline-block">
                                                    {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'items'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Details */}
                                        <div className="border-t-2 border-green-100 pt-6">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Items Section */}
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                                        <Package className="w-5 h-5 text-green-600 mr-2" />
                                                        Order Items
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {(order.items || []).map((item, itemIndex) => (
                                                            <div key={`${order._id}-item-${itemIndex}`} className="group flex items-center space-x-4 bg-white/60 p-4 rounded-xl hover:bg-white transition-all duration-300 hover:shadow-md">
                                                                <div className="relative w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl overflow-hidden">
                                                                    <img
                                                                        src={item?.product?.image || FALLBACK_IMAGE}
                                                                        alt={item?.product?.name || 'Product'}
                                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                                        onError={handleImageError}
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                                                                        {item?.product?.name || 'Product Name Not Available'}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                                            {item?.quantity || 0} × ₹{item?.price?.toFixed(2) || '0.00'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Address Section */}
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                                        <MapPin className="w-5 h-5 text-green-600 mr-2" />
                                                        Delivery Address
                                                    </h4>
                                                    <div className="bg-white/60 p-4 rounded-xl">
                                                        <div className="flex items-start space-x-3">
                                                            <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex-shrink-0 mt-1">
                                                                <MapPin className="w-4 h-4 text-green-600" />
                                                            </div>
                                                            <div className="text-gray-700 leading-relaxed">
                                                                {formatAddress(order.shippingAddress)}
                                                            </div>
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

            <style jsx>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Orders;