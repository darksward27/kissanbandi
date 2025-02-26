import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ImageUpload from './ImageUpload';

const ProductForm = ({ initialData, onSubmit, categories }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    subcategory: '',
    price: '',
    unit: '',
    stock: '',
    description: '',
    image: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id || initialData._id
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.stock) newErrors.stock = 'Stock is required';
    if (!formData.description) newErrors.description = 'Description is required';
    
    // Only require image for new products
    if (!formData.image && !initialData) {
      newErrors.image = 'Product image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submissionData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        id: formData.id || formData._id
      };

      // Only include image in submission if it has changed
      if (!initialData || formData.image !== initialData.image) {
        submissionData.image = formData.image;
      }

      onSubmit(submissionData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (imageData) => {
    setFormData(prev => ({
      ...prev,
      image: imageData
    }));
    if (errors.image) {
      setErrors(prev => ({
        ...prev,
        image: ''
      }));
    }
  };

  const getSubcategories = () => {
    const category = categories.find(cat => cat.name.toLowerCase() === formData.category.toLowerCase());
    return category ? category.subcategories : [];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ImageUpload
        value={formData.image}
        onChange={handleImageChange}
        error={errors.image}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-lg border ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-lg border ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category.name} value={category.name.toLowerCase()}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Subcategory</label>
          <select
            name="subcategory"
            value={formData.subcategory}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Subcategory</option>
            {getSubcategories().map(sub => (
              <option key={sub} value={sub.toLowerCase()}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={`mt-1 block w-full rounded-lg border ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
          />
          {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Unit</label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-lg border ${
              errors.unit ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
          >
            <option value="">Select Unit</option>
            <option value="kg">Kilogram (kg)</option>
            <option value="g">Gram (g)</option>
            <option value="piece">Piece</option>
            <option value="dozen">Dozen</option>
            <option value="bundle">Bundle</option>
            <option value="packet">Packet</option>
            <option value="box">Box</option>
            <option value="liter">Liter (L)</option>
            <option value="ml">Milliliter (ml)</option>
          </select>
          {errors.unit && <p className="mt-1 text-sm text-red-500">{errors.unit}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Stock</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            className={`mt-1 block w-full rounded-lg border ${
              errors.stock ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
          />
          {errors.stock && <p className="mt-1 text-sm text-red-500">{errors.stock}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className={`mt-1 block w-full rounded-lg border ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
        />
        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition duration-300"
        >
          {initialData ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

ProductForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      subcategories: PropTypes.arrayOf(PropTypes.string)
    })
  ).isRequired
};

export default ProductForm; 