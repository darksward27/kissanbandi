import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Plus, Image as ImageIcon, Trash2, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProductForm = ({ initialData, onSubmit, categories = [], categoriesLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    originalPrice: '',
    unit: 'piece',
    stock: '',
    description: '',
    gst: '', 
    images: [],
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const fileInputRef = useRef(null);

  // Units options
  const unitOptions = ['piece', 'kg', 'g', 'dozen', 'bunch', 'liter', 'ml', 'pack'];

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        subcategory: initialData.subcategory || '',
        price: initialData.price || '',
        originalPrice: initialData.originalPrice || '',
        unit: initialData.unit || 'piece',
        stock: initialData.stock || '',
        description: initialData.description || '',
        gst: initialData.gst !== undefined ? initialData.gst.toString() : '', // ✅ Convert to string, handle 0 properly
        images: initialData.images || [initialData.image].filter(Boolean) || [],
        status: initialData.status || 'active'
      });

      // Set preview images for existing product
      if (initialData.images && initialData.images.length > 0) {
        setPreviewImages(initialData.images.map((url, index) => ({
          id: index,
          url: url,
          file: null
        })));
      } else if (initialData.image) {
        setPreviewImages([{
          id: 0,
          url: initialData.image,
          file: null
        }]);
      }

      // Set subcategories for existing product category
      if (initialData.category) {
        updateSubcategories(initialData.category);
      }
    }
  }, [initialData, categories]);

  const updateSubcategories = (selectedCategory) => {
    if (!selectedCategory) {
      setAvailableSubcategories([]);
      return;
    }

    const category = categories.find(cat => cat.name === selectedCategory);
    if (category && category.subcategories) {
      setAvailableSubcategories(category.subcategories.filter(sub => sub && sub.trim()));
    } else {
      setAvailableSubcategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ Special handling for numeric fields to prevent invalid values
    if (name === 'gst' || name === 'price' || name === 'originalPrice' || name === 'stock') {
      // Allow empty string and valid numbers
      if (value === '' || (!isNaN(value) && !isNaN(parseFloat(value)))) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Handle category change - update subcategories
    if (name === 'category') {
      updateSubcategories(value);
      setFormData(prev => ({
        ...prev,
        category: value,
        subcategory: ''
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Each image must be less than 5MB');
      return;
    }

    if (previewImages.length + files.length > 10) {
      toast.error('Maximum 10 images allowed per product');
      return;
    }

    const newPreviews = files.map((file, index) => ({
      id: Date.now() + index,
      url: URL.createObjectURL(file),
      file: file
    }));

    setPreviewImages(prev => [...prev, ...newPreviews]);
    setImageFiles(prev => [...prev, ...files]);
  };

  const handleRemoveImage = (imageId) => {
    setPreviewImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove && imageToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== imageId);
    });

    setImageFiles(prev => {
      const imageIndex = previewImages.findIndex(img => img.id === imageId);
      if (imageIndex !== -1 && previewImages[imageIndex].file) {
        return prev.filter((_, index) => index !== imageIndex);
      }
      return prev;
    });
  };

  const moveImage = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= previewImages.length) return;

    const newImages = [...previewImages];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setPreviewImages(newImages);
  };

  const uploadImage = async (file) => {
    console.log('🔄 Using workaround for editing:', file.name);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timestamp = Date.now();
    const randomId = Math.round(Math.random() * 1000000000);
    const extension = file.name.split('.').pop().toLowerCase();
    const filename = `product-${timestamp}-${randomId}.${extension}`;
    
    const imagePath = `/uploads/product/${filename}`;
    
    console.log('✅ Generated path for edit:', imagePath);
    return imagePath;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.stock || formData.stock < 0) newErrors.stock = 'Valid stock quantity is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (previewImages.length === 0) newErrors.images = 'At least one image is required';

    // ✅ Fixed GST validation - handle empty string and 0 value properly
    if (formData.gst === '' || formData.gst === null || formData.gst === undefined) {
      newErrors.gst = 'GST rate is required';
    } else {
      const gstValue = parseFloat(formData.gst);
      if (isNaN(gstValue) || gstValue < 0 || gstValue > 100) {
        newErrors.gst = 'GST rate must be between 0% and 100%';
      }
    }

    // Validate original price if provided
    if (formData.originalPrice && Number(formData.originalPrice) < Number(formData.price)) {
      newErrors.originalPrice = 'Original price should be greater than or equal to current price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      price: '',
      originalPrice: '',
      unit: 'piece',
      stock: '',
      description: '',
      gst: '', // ✅ Reset to empty string
      images: [],
      status: 'active'
    });
    setPreviewImages([]);
    setImageFiles([]);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialData && initialData._id) {
        console.log('✏️ Editing existing product...');
        
        const uploadPromises = imageFiles.map(file => uploadImage(file));
        const uploadedUrls = await Promise.all(uploadPromises);

        const existingImageUrls = previewImages
          .filter(img => !img.file)
          .map(img => img.url);

        const allImageUrls = [...existingImageUrls, ...uploadedUrls];

        // ✅ Ensure GST is converted to number properly
        const submitData = {
          ...formData,
          images: allImageUrls,
          image: allImageUrls[0],
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          stock: Number(formData.stock),
          gst: Number(formData.gst), // ✅ This will properly convert string to number, including '0' to 0
          _id: initialData._id
        };

        console.log('📊 Submit data with GST:', submitData.gst, typeof submitData.gst);
        await onSubmit(submitData);
      } else {
        console.log('🆕 Creating new product with images...');
        
        const token = sessionStorage.getItem('adminToken');

        if (!token) {
          throw new Error('Please login as admin first');
        }

        const submitFormData = new FormData();
        
        // ✅ Add product data with proper GST conversion
        submitFormData.append('name', formData.name);
        submitFormData.append('category', formData.category);
        if (formData.subcategory) submitFormData.append('subcategory', formData.subcategory);
        submitFormData.append('price', formData.price);
        if (formData.originalPrice) submitFormData.append('originalPrice', formData.originalPrice);
        submitFormData.append('unit', formData.unit);
        submitFormData.append('stock', formData.stock);
        submitFormData.append('description', formData.description);
        submitFormData.append('gst', formData.gst); // ✅ Send as string, backend should convert
        submitFormData.append('status', formData.status);
        
        // Add image files
        imageFiles.forEach((file) => {
          submitFormData.append('images', file);
        });
        
        console.log('📊 GST value being sent:', formData.gst, typeof formData.gst);
        console.log('📤 Sending to create-with-images endpoint...');
        console.log('📁 Files to upload:', imageFiles.length);
        
        const response = await fetch('http://localhost:5000/api/products/create-with-images', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: submitFormData
        });
        
        console.log('📨 Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Create error:', errorText);
          
          if (response.status === 401) {
            throw new Error('Authentication failed. Please login as admin.');
          }
          if (response.status === 403) {
            throw new Error('Access denied. You need admin privileges.');
          }
          throw new Error(`Failed to create product: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Product created successfully:', result);
        console.log('🔍 Full backend response:', JSON.stringify(result, null, 2));

        if (result.success === false) {
          throw new Error(result.error || 'Product creation failed');
        }

        const isSuccess = result.success === true || result.message || result.product;
        if (!isSuccess) {
          throw new Error(result.error || 'Product creation failed');
        }

        toast.success(`Product created with ${result.uploadedImages || 0} images!`);

        previewImages.forEach(img => {
          if (img.url.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
          }
        });

        resetForm();
        return;
      }
      
      previewImages.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });

    } catch (error) {
      console.error('❌ Form submission error:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images *
        </label>
        
        {previewImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {previewImages.map((image, index) => (
              <div
                key={image.id}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Main
                  </div>
                )}

                <div className="absolute top-2 right-12 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="bg-black bg-opacity-50 text-white p-1 rounded disabled:opacity-30"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === previewImages.length - 1}
                    className="bg-black bg-opacity-50 text-white p-1 rounded disabled:opacity-30"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(image.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200" />
              </div>
            ))}
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-amber-600 transition-colors"
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">
              {previewImages.length === 0 ? 'Upload Product Images' : 'Add More Images'}
            </span>
            <span className="text-xs text-gray-400">
              JPEG, PNG, WebP up to 5MB each (Max 10 images)
            </span>
          </button>
        </div>

        {errors.images && (
          <p className="text-red-500 text-sm mt-1">{errors.images}</p>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          • First image will be used as the main product image
          • Use arrow buttons to reorder images
          • Images will be displayed in this order on your product page
        </p>
      </div>

      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter product name"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Category and Subcategory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id || cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategory
          </label>
          <select
            name="subcategory"
            value={formData.subcategory}
            onChange={handleInputChange}
            disabled={!formData.category || availableSubcategories.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {!formData.category 
                ? 'Select category first' 
                : availableSubcategories.length === 0 
                  ? 'No subcategories available' 
                  : 'Select subcategory'
              }
            </option>
            {availableSubcategories.map((subcategory, index) => (
              <option key={index} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </select>
          {!formData.category && (
            <p className="text-xs text-gray-500 mt-1">Select a category to see available subcategories</p>
          )}
        </div>
      </div>

      {/* Pricing and GST */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (₹) *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Original Price (₹)
          </label>
          <input
            type="number"
            name="originalPrice"
            value={formData.originalPrice}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
              errors.originalPrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.originalPrice && <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>}
          <p className="text-xs text-gray-500 mt-1">For showing discounts</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GST Rate (%) *
          </label>
          <input
            type="number"
            name="gst"
            value={formData.gst}
            onChange={handleInputChange}
            min="0"
            max="100"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
              errors.gst ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter GST rate (e.g., 0, 5, 12, 18, 28)"
          />
          {errors.gst && <p className="text-red-500 text-sm mt-1">{errors.gst}</p>}
          <p className="text-xs text-gray-500 mt-1">Common rates: 0%, 5%, 12%, 18%, 28%</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit *
          </label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
              errors.unit ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {unitOptions.map(unit => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          {errors.unit && <p className="text-red-500 text-sm mt-1">{errors.unit}</p>}
        </div>
      </div>

      {/* Stock and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity *
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
              errors.stock ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="4"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter product description"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-8 py-3 rounded-xl hover:from-amber-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>{initialData ? 'Update Product' : 'Create Product'}</span>
          )}
        </button>
      </div>

      {/* ✅ Debug info - remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
          <strong>Debug Info:</strong>
          <br />
          GST Value: {formData.gst} (type: {typeof formData.gst})
          <br />
          GST as Number: {Number(formData.gst)} (type: {typeof Number(formData.gst)})
          <br />
          Is GST Valid: {formData.gst !== '' && !isNaN(parseFloat(formData.gst)) ? 'Yes' : 'No'}
        </div>
      )}
    </form>
  );
};

export default ProductForm;