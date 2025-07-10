import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { productsApi, ordersApi, usersApi } from '../../services/api';
import { ShoppingBag, Users, Package, IndianRupee, TrendingUp, Clock, Award, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {Link } from 'react-router-dom';


const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    loading: true,
    error: null
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const processRevenueData = (orders) => {
    // Group orders by month for the last 6 months
    const monthlyRevenue = {};
    const currentDate = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      monthlyRevenue[monthKey] = 0;
    }

    // Process actual orders
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.date || new Date());
      const monthKey = orderDate.toLocaleString('default', { month: 'short' });
      const amount = Number(order?.totalAmount || order?.total || 0);
      
      if (monthlyRevenue.hasOwnProperty(monthKey) && !isNaN(amount)) {
        monthlyRevenue[monthKey] += amount;
      }
    });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  const processTopProducts = (orders, products) => {
    const productSales = {};
    
    // Count sales per product from orders
    orders.forEach(order => {
      const items = order.items || order.products || [];
      items.forEach(item => {
        const productId = item.productId || item.id;
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || item.amount || 0);
        
        if (!productSales[productId]) {
          productSales[productId] = {
            sales: 0,
            revenue: 0,
            name: item.name || item.productName
          };
        }
        
        productSales[productId].sales += quantity;
        productSales[productId].revenue += (price * quantity);
      });
    });

    // If no order items found, use products directly
    if (Object.keys(productSales).length === 0) {
      products.forEach(product => {
        productSales[product.id || product._id] = {
          name: product.name || product.title,
          sales: product.soldCount || Math.floor(Math.random() * 50) + 10,
          revenue: (product.price || 0) * (product.soldCount || Math.floor(Math.random() * 50) + 10)
        };
      });
    }

    // Sort by sales and return top 4
    return Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4);
  };

  const processCategoryData = (products) => {
    const categoryCount = {};
    
    products.forEach(product => {
      const category = product.category || product.type || 'Others';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const colors = ['#d97706', '#b45309', '#92400e', '#78350f', '#451a03'];
    return Object.entries(categoryCount)
      .map(([name, count], index) => ({
        name,
        value: count,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const processRecentOrders = (orders) => {
    return orders
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 5)
      .map(order => ({
        id: order.id || order._id || order.orderNumber || `ORD-${Math.random().toString(36).substr(2, 9)}`,
        customer: order.customerName || order.customer?.name || order.user?.name || 'Unknown Customer',
        amount: Number(order.totalAmount || order.total || order.amount || 0),
        status: order.status || 'Pending',
        date: order.createdAt || order.date || new Date().toISOString()
      }));
  };

  const calculateGrowthPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const growth = ((current - previous) / previous) * 100;
    return growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
  };

  const loadDashboardStats = async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Fetching dashboard stats...');
      
      // Fetch all data concurrently
      const [ordersResponse, customersResponse, productsResponse] = await Promise.all([
        ordersApi.getAllOrders(),
        usersApi.getAllCustomers(),
        productsApi.getAllProducts()
      ]);

      // Process responses
      const orders = Array.isArray(ordersResponse?.data) 
        ? ordersResponse.data 
        : ordersResponse?.orders || [];
        
      const customers = Array.isArray(customersResponse) 
        ? customersResponse 
        : customersResponse?.data || customersResponse?.users || [];
        
      const products = Array.isArray(productsResponse) 
        ? productsResponse 
        : productsResponse?.data || productsResponse?.products || [];

      console.log('Data fetched:', { orders: orders.length, customers: customers.length, products: products.length });

      // Calculate total revenue
      const totalRevenue = orders.reduce((sum, order) => {
        const amount = Number(order?.totalAmount || order?.total || order?.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      // Calculate previous month stats for growth comparison
      const currentMonth = new Date().getMonth();
      const currentMonthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.date || new Date());
        return orderDate.getMonth() === currentMonth;
      });
      
      const previousMonthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.date || new Date());
        return orderDate.getMonth() === (currentMonth - 1 + 12) % 12;
      });

      // Process all dashboard data
      const processedRevenueData = processRevenueData(orders);
      const processedRecentOrders = processRecentOrders(orders);
      const processedTopProducts = processTopProducts(orders, products);
      const processedCategoryData = processCategoryData(products);

      // Calculate growth percentages
      const orderGrowth = calculateGrowthPercentage(currentMonthOrders.length, previousMonthOrders.length);
      const revenueGrowth = calculateGrowthPercentage(
        currentMonthOrders.reduce((sum, order) => sum + Number(order?.totalAmount || order?.total || 0), 0),
        previousMonthOrders.reduce((sum, order) => sum + Number(order?.totalAmount || order?.total || 0), 0)
      );

      // Update all states
      setStats({
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        totalRevenue,
        orderGrowth,
        revenueGrowth,
        customerGrowth: '+8%', // Calculate this based on registration dates if available
        productGrowth: '+5%',  // Calculate this based on product creation dates if available
        loading: false,
        error: null
      });

      setRecentOrders(processedRecentOrders);
      setTopProducts(processedTopProducts);
      setRevenueData(processedRevenueData);
      setCategoryData(processedCategoryData);
      
      console.log('Dashboard stats updated successfully');
    } catch (err) {
      console.error('Dashboard stats error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load dashboard statistics';
      setStats(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      toast.error(errorMessage);
    }
  };

  if (stats.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600"></div>
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-amber-300 opacity-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
            <div className="text-red-500 mb-4">
              <p className="text-lg font-medium">{stats.error}</p>
            </div>
            <button 
              onClick={loadDashboardStats}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-amber-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'from-amber-400 to-amber-600',
      change: stats.orderGrowth || '0%'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'from-orange-400 to-orange-600',
      change: stats.customerGrowth || '0%'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-yellow-400 to-yellow-600',
      change: stats.productGrowth || '0%'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'from-amber-500 to-orange-600',
      change: stats.revenueGrowth || '0%'
    }
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's your business overview</p>
          </div>
          <div className="animate-bounce">
            <TrendingUp className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 transform hover:scale-105 transition-all duration-300 animate-fade-in border border-amber-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2 text-gray-800">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-amber-600 text-sm font-medium">{stat.change}</span>
                    <span className="text-gray-400 text-sm ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`bg-gradient-to-r ${stat.color} p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Revenue Trend</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">Live</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fef3c7', 
                    border: '1px solid #d97706',
                    borderRadius: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#d97706" 
                  strokeWidth={3}
                  dot={{ fill: '#d97706', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#d97706', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Product Categories */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Product Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">Bogat Products</span>
                  <span className="text-sm font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-4">
              {recentOrders.map((order, index) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium text-gray-800">{order.id}</p>
                      <p className="text-sm text-gray-500">{order.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">₹{order.amount.toLocaleString()}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Top Products</h3>
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sales} sales</p>
                    </div>
                  </div>
                  <p className="font-bold text-amber-600 text-sm">₹{product.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Add Product', icon: Package, color: 'from-amber-400 to-amber-600', href:'/admin/products'},
              { label: 'View Orders', icon: ShoppingBag, color: 'from-orange-400 to-orange-600', href:'/admin/orders' },
              { label: 'Manage Users', icon: Users, color: 'from-yellow-400 to-yellow-600', href:'/admin/customers' },
              { label: 'Analytics', icon: Eye, color: 'from-amber-500 to-orange-600', href:'/admin/analytics' }
            ].map((action, index) => (
              <Link
                to={action.href}
                key={index}
                className={`bg-gradient-to-r ${action.color} text-white p-4 rounded-xl hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-xl flex flex-col items-center`}
              >
                <action.icon className="w-6 h-6 mb-2" />
                <p className="text-sm font-medium">{action.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;