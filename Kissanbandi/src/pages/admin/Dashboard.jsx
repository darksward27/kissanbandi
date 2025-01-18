import React, { useState, useEffect } from 'react';
import { productsApi, ordersApi, usersApi } from '../../services/api';
import { ShoppingBag, Users, Package, IndianRupee } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Fetching dashboard stats...');
      
      // Fetch orders
      const ordersResponse = await ordersApi.getAllOrders();
      const orders = Array.isArray(ordersResponse) ? ordersResponse : [];
      console.log('Orders fetched:', orders);
      
      // Fetch customers
      const customersResponse = await usersApi.getAllCustomers();
      const customers = Array.isArray(customersResponse) ? customersResponse : [];
      console.log('Customers fetched:', customers);
      
      // Fetch products
      const productsResponse = await productsApi.getAllProducts();
      const products = Array.isArray(productsResponse) ? productsResponse : [];
      console.log('Products fetched:', products);

      // Calculate total revenue safely
      const totalRevenue = orders.reduce((sum, order) => {
        const amount = Number(order?.totalAmount || order?.total || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      console.log('Total revenue calculated:', totalRevenue);

      setStats({
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        totalRevenue,
        loading: false,
        error: null
      });
      
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
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">
          <p>{stats.error}</p>
          <button 
            onClick={loadDashboardStats}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add more dashboard sections like recent orders, top products, etc. */}
    </div>
  );
};

export default Dashboard; 