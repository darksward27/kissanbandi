import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react';
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

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products...');
      const productsData = await productsApi.getAllProducts();
      
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

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    console.log('Filtering products:', { products, searchQuery });
    if (!Array.isArray(products)) {
      console.warn('Products is not an array:', products);
      return [];
    }
    if (!searchQuery) return products;
    return products.filter(product => 
      product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product?.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]);

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

  const handleDeleteProduct = async (productId) => {
    if (!productId) {
      toast.error('Invalid product ID');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsApi.deleteProduct(productId);
        toast.success('Product deleted successfully!');
        await loadProducts(); // Reload products list
      } catch (err) {
        console.error('Error deleting product:', err);
        toast.error(err.response?.data?.message || 'Failed to delete product');
      }
    }
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
            onClick={loadProducts}
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
        <h1 className="text-2xl font-bold text-gray-800">Products Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {product.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {product.subcategory || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{product.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
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
  );
};

export default ProductsManagement; 