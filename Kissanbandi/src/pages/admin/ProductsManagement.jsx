import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, Filter, Grid, List, Eye, Package, TrendingUp, AlertCircle, CheckCircle, Slash,Circle } from 'lucide-react';
import { categories } from '../../data/products';
import ProductForm from '../../components/ProductForm';
import { toast } from 'react-hot-toast';
import { productsApi } from '../../services/api';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

useEffect(() => {
  products.forEach((p) => {
    if (p.stock === 0 && p.status !== 'inactive') {
      handleToggleProductStatus(p._id, 'inactive', {
        confirm: false,
        toast: false,
        reload: false,
      });
    }
  });
}, [products]);


  useEffect(() => {
    loadProducts();
  }, []);


  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products...');
      const productsData = await productsApi.getAllProducts();
      console.log("Received statuses:", productsData.map(p => p.status));
      console.log('Products received:', {
        data: productsData,
        isArray: Array.isArray(productsData),
        length: productsData?.length
      });
      
      // Ensure we're setting an array
      if (!Array.isArray(productsData)) {
        console.warn('Products data is not an array:', productsData);
        setProducts([]);
        setError('Invalid products data received');
        return;
      }
      
      setProducts(productsData);
      setError(null); // Clear any previous errors
      
      // Log the state update
      console.log('Products state updated:', {
        count: productsData.length,
        firstProduct: productsData[0]
      });
      
    } catch (err) {
      console.error('Error loading products:', {
        error: err,
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.message);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };


  // Filter and sort products
  const filteredProducts = useMemo(() => {
    console.log('Filtering products:', { products, searchQuery });
    if (!Array.isArray(products)) {
      console.warn('Products is not an array:', products);
      return [];
    }
    
    let filtered = products;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product?.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(product => 
        product?.category?.toLowerCase() === filterCategory.toLowerCase()
      );
    }

if (statusFilter !== 'all') {
  filtered = filtered.filter(product =>
    (product.status || 'active').toLowerCase() === statusFilter.toLowerCase()
  );
}
    
    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'stock':
          return (a.stock || 0) - (b.stock || 0);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [searchQuery, products, filterCategory, statusFilter, sortBy]);

  const handleAddProduct = async (productData) => {
    try {
      console.log('Creating new product:', productData);
      const result = await productsApi.createProduct(productData);
      console.log('Product created successfully:', result);
      
      // Force immediate reload of products
      await loadProducts();
      
      toast.success('Product added successfully!');
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error(err.response?.data?.message || 'Failed to add product');
    }
  };

  const handleEditProduct = async (productData) => {
    try {
      console.log('Updating product:', productData);
      const productId = productData.id || productData._id;
      
      if (!productId) {
        throw new Error('Product ID is missing');
      }
      
      await productsApi.updateProduct(productId, productData);
      console.log('Product updated successfully');
      
      toast.success('Product updated successfully!');
      setEditingProduct(null);
      await loadProducts(); // Reload products list
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error(err.response?.data?.message || 'Failed to update product');
    }
  };

const handleToggleProductStatus = async (
  productId,
  newStatus,
  options = { confirm: true, toast: true, reload: true }
) => {
  if (!productId) return toast.error('Invalid product ID');

  const action = newStatus === 'active' ? 'activate' : 'deactivate';

  if (!options.confirm || window.confirm(`Are you sure you want to ${action} this product?`)) {
    try {
      const updated = await productsApi.updateProduct(productId, { status: newStatus });

      if (options.toast) {
        toast.success(`Product marked as ${newStatus}`);
      }

      if (options.reload) {
        await loadProducts();
      } else {
        // 🔁 Update product locally
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? { ...p, status: updated.status } : p))
        );
      }
    } catch (err) {
      console.error(`Error changing product status:`, err);
      if (options.toast !== false) {
        toast.error(err.response?.data?.error || `Failed to ${action} product`);
      }
    }
  }
};



  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'out', color: 'text-red-600 bg-red-100', icon: AlertCircle };
    if (stock < 10) return { status: 'low', color: 'text-yellow-600 bg-yellow-100', icon: AlertCircle };
    return { status: 'good', color: 'text-green-600 bg-green-100', icon: CheckCircle };
  };

  const uniqueCategories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-green-300 opacity-20"></div>
            <Package className="absolute inset-0 m-auto w-6 h-6 text-green-600 animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadProducts}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Products Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your product inventory with ease</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              title: 'Total Products', 
              value: products.length, 
              icon: Package, 
              color: 'from-green-400 to-green-600',
              change: '+12%'
            },
            { 
              title: 'Low Stock', 
              value: products.filter(p => p.stock < 10).length, 
              icon: AlertCircle, 
              color: 'from-yellow-400 to-orange-500',
              change: '-5%'
            },
            { 
              title: 'Categories', 
              value: uniqueCategories.length, 
              icon: Grid, 
              color: 'from-emerald-400 to-emerald-600',
              change: '+2%'
            },
            { 
              title: 'Out of Stock', 
              value: products.filter(p => p.stock === 0).length, 
              icon: TrendingUp, 
              color: 'from-red-400 to-red-600',
              change: '-8%'
            }
          ].map((stat, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 transform hover:scale-105 transition-all duration-300 animate-fade-in border border-green-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2 text-gray-800">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
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

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {/* Status Filter */}
<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
>
  <option value="all">All Status</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="stock">Sort by Stock</option>
                <option value="category">Sort by Category</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'table' 
                      ? 'bg-green-500 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-green-500 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {viewMode === 'table' ? (
          // Table View
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      Subcategory
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      Stock Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
  Status
</th>
                    <th className="px-12 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product, index) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <tr 
                        key={product._id || product.id} 
                        className="hover:bg-green-50 transition-all duration-200 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="relative group">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded-xl object-cover shadow-md group-hover:scale-110 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-200"></div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900">
                                {product.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {product.subcategory || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">₹{product.price}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                              <stockStatus.icon className="w-3 h-3 mr-1" />
                              {product.stock}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
    {product.status}
  </span>
</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all duration-200"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id || product.id)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
{product.status === 'active' ? (
  <button
    onClick={() => handleToggleProductStatus(product._id, 'inactive')}
    className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-100 rounded-lg transition-all duration-200"
    title="Mark as Inactive"
  >
    <CheckCircle className="w-4 h-4 text-green-100 fill-green-600" />
  </button>
) : (
  <button
    onClick={() => handleToggleProductStatus(product._id, 'active')}
    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-all duration-200"
    title="Mark as Active"
  >
    <Circle className="w-4 h-4 text-red-400 fill-red-600" />
  </button>
)}

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => {
              const stockStatus = getStockStatus(product.stock);
              return (
                <div 
                  key={product._id || product.id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 transform hover:scale-105 transition-all duration-300 animate-fade-in border border-green-100"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative mb-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        <stockStatus.icon className="w-3 h-3 mr-1" />
                        {product.stock}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">₹{product.price}</span>
                      <span className="text-sm text-gray-500">per {product.unit}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all duration-200"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id || product.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
{product.status === 'active' ? (
  <button
    onClick={() => handleToggleProductStatus(product._id, 'inactive')}
    className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-100 rounded-lg transition-all duration-200"
    title="Mark as Inactive"
  >
    <CheckCircle className="w-4 h-4 text-green-100 fill-green-600" />
  </button>
) : (
  <button
    onClick={() => handleToggleProductStatus(product._id, 'active')}
    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-all duration-200"
    title="Mark as Active"
  >
    <Circle className="w-4 h-4 text-red-400 fill-red-600" />
  </button>
)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {(showAddModal || editingProduct) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-modal-enter">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <ProductForm
                initialData={editingProduct}
                onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
                categories={categories}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
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
        
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-modal-enter {
          animation: modal-enter 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProductsManagement;