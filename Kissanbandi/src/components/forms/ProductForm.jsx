import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { categories } from '../../data/products';

/**
 * Reusable product form component for adding/editing products
 */
const ProductForm = ({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  isEdit = false 
}) => {
  const [formData, setFormData] = React.useState({
    name: initialData.name || '',
    category: initialData.category || 'fruits',
    subcategory: initialData.subcategory || '',
    price: initialData.price || '',
    unit: initialData.unit || 'kg',
    description: initialData.description || '',
    stock: initialData.stock || '',
    image: initialData.image || '',
  });

  const [errors, setErrors] = React.useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.stock) newErrors.stock = 'Stock is required';
    if (!formData.description) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const selectedCategory = categories.find(cat => 
    cat.name.toLowerCase() === formData.category.toLowerCase()
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
              errors.name ? 'border-red-300' : ''
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            {categories.map(category => (
              <option key={category.name} value={category.name.toLowerCase()}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Subcategory
          </label>
          <select
            name="subcategory"
            value={formData.subcategory}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="">Select Subcategory</option>
            {selectedCategory?.subcategories.map(sub => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price (₹)
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
              errors.price ? 'border-red-300' : ''
            }`}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Unit
          </label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="kg">Kilogram (kg)</option>
            <option value="piece">Piece</option>
            <option value="dozen">Dozen</option>
            <option value="bunch">Bunch</option>
          </select>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
              errors.stock ? 'border-red-300' : ''
            }`}
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
          )}
        </div>

        {/* Image URL */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Description */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
              errors.description ? 'border-red-300' : ''
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {isEdit ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

ProductForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  isEdit: PropTypes.bool
};

export default ProductForm; 