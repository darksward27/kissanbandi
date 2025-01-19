import React, { useState, useEffect } from 'react';
import { usersApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Search, ChevronDown, ChevronUp, ShoppingBag, IndianRupee, Calendar, Heart } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import CustomerDetailsModal from '../../components/modals/CustomerDetailsModal';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerAnalytics, setCustomerAnalytics] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAllCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerAnalytics = async (customerId) => {
    try {
      const analytics = await usersApi.getCustomerAnalytics(customerId);
      setCustomerAnalytics(analytics);
      setSelectedCustomer(customerId);
    } catch (err) {
      toast.error('Failed to load customer analytics');
    }
  };

  const handleCustomerExpand = async (customerId) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
      setCustomerAnalytics(null);
    } else {
      setExpandedCustomer(customerId);
      await loadCustomerAnalytics(customerId);
    }
  };

  const handleViewDetails = (customerId) => {
    setSelectedCustomer(customerId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedCustomer(null);
    setIsDetailsModalOpen(false);
  };

  const handleCustomerUpdate = () => {
    loadCustomers(); // Refresh the customers list after update
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

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
            onClick={loadCustomers}
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
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <React.Fragment key={customer._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {customer.address?.city}, {customer.address?.state}
                      </div>
                      <div className="text-sm text-gray-500">{customer.address?.pincode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleCustomerExpand(customer._id)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-900"
                      >
                        View Analytics
                        {expandedCustomer === customer._id ? (
                          <ChevronUp className="w-4 h-4 ml-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(customer._id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                  {expandedCustomer === customer._id && customerAnalytics && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
                            <ShoppingBag className="w-8 h-8 text-blue-500" />
                            <div>
                              <p className="text-sm text-gray-500">Total Orders</p>
                              <p className="text-xl font-bold">{customerAnalytics.totalOrders}</p>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
                            <IndianRupee className="w-8 h-8 text-green-500" />
                            <div>
                              <p className="text-sm text-gray-500">Total Spent</p>
                              <p className="text-xl font-bold">₹{customerAnalytics.totalSpent.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
                            <Calendar className="w-8 h-8 text-purple-500" />
                            <div>
                              <p className="text-sm text-gray-500">Last Order</p>
                              <p className="text-xl font-bold">
                                {customerAnalytics.lastOrderDate 
                                  ? new Date(customerAnalytics.lastOrderDate).toLocaleDateString()
                                  : 'Never'}
                              </p>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
                            <Heart className="w-8 h-8 text-red-500" />
                            <div>
                              <p className="text-sm text-gray-500">Wishlist Items</p>
                              <p className="text-xl font-bold">{customerAnalytics.wishlistCount}</p>
                            </div>
                          </div>
                        </div>

                        {/* Monthly Spending Chart */}
                        <div className="bg-white p-4 rounded-lg shadow mb-6">
                          <h3 className="text-lg font-medium mb-4">Monthly Spending</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={Object.entries(customerAnalytics.monthlySpending).map(([month, amount]) => ({
                                  month,
                                  amount
                                }))}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="amount" fill="#10B981" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-white p-4 rounded-lg shadow">
                          <h3 className="text-lg font-medium mb-4">Frequently Bought Products</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {customerAnalytics.topProducts.map((product) => (
                              <div key={product._id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div>
                                  <p className="text-sm font-medium">{product.name}</p>
                                  <p className="text-sm text-gray-500">
                                    Purchased {product.purchaseCount} times
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {isDetailsModalOpen && (
        <CustomerDetailsModal
          userId={selectedCustomer}
          onClose={handleCloseModal}
          onUpdate={handleCustomerUpdate}
        />
      )}
    </div>
  );
};

export default Customers; 