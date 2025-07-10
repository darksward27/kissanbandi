import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar, 
  User, 
  Tag,
  Save,
  X,
  Search,
  Filter,
  ImageIcon,
  Upload,
  Loader
} from 'lucide-react';

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    imageFile: null,
    tags: [],
    tagInput: '',
    author: 'Admin',
    status: 'draft' // Changed from isPublished to status
  });

  // API Base URL - Update this to match your backend
  const API_BASE_URL ='https://bogat.onrender.com/api';
  
  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  // Fetch blogs from database
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/blogs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.status === 401) {
        setError('Authentication failed. Please login again.');
        // Optionally redirect to login
        // window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch blogs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setBlogs(data.blogs || data || []); // Handle different response structures
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setError(error.message || 'Failed to fetch blogs. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Handle tags - now formData.tags is already an array
      const tagsArray = Array.isArray(formData.tags) ? formData.tags : [];
      
      // Prepare form data for submission
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('content', formData.content);
      submitData.append('tags', JSON.stringify(tagsArray));
      submitData.append('author', formData.author);
      submitData.append('status', formData.status);
      
      // Handle image upload
      if (formData.imageFile) {
        submitData.append('image', formData.imageFile);
      } else if (formData.image) {
        submitData.append('imageUrl', formData.image);
      }

      const url = editingBlog 
        ? `${API_BASE_URL}/blogs/${editingBlog._id}`
        : `${API_BASE_URL}/blogs`;
      
      const method = editingBlog ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          // Don't set Content-Type for FormData, let browser set it
          ...getAuthHeaders()
        },
        body: submitData
      });

      if (response.status === 401) {
        setError('Authentication failed. Please login again.');
        return;
      }

      if (response.status === 404) {
        setError('Blog not found. It may have been deleted.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update local state
      if (editingBlog) {
        setBlogs(blogs.map(blog => 
          blog._id === editingBlog._id ? (result.blog || result) : blog
        ));
      } else {
        setBlogs([(result.blog || result), ...blogs]);
      }

      resetForm();
      
    } catch (error) {
      console.error('Error saving blog:', error);
      setError(error.message || 'Failed to save blog. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      image: '',
      imageFile: null,
      tags: [],
      tagInput: '',
      author: 'Admin',
      status: 'draft'
    });
    setShowCreateForm(false);
    setEditingBlog(null);
    setError('');
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    
    // Handle tags properly - clean them when editing
    let tagsArray = [];
    if (blog.tags && Array.isArray(blog.tags)) {
      tagsArray = blog.tags.map(tag => cleanTagText(tag)).filter(tag => tag);
    }
    
    setFormData({
      title: blog.title,
      content: blog.content,
      image: blog.image || '',
      imageFile: null,
      tags: tagsArray,
      tagInput: '',
      author: blog.author,
      status: blog.status || 'draft'
    });
    
    setFormData({
      title: blog.title,
      content: blog.content,
      image: blog.image || '',
      imageFile: null,
      tags: tagsArray,
      tagInput: '',
      author: blog.author,
      status: blog.status || 'draft'
    });
    setShowCreateForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.status === 401) {
        setError('Authentication failed. Please login again.');
        return;
      }

      if (response.status === 404) {
        setError('Blog not found. It may have already been deleted.');
        // Remove from local state anyway
        setBlogs(blogs.filter(blog => blog._id !== id));
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }

      setBlogs(blogs.filter(blog => blog._id !== id));
    } catch (error) {
      console.error('Error deleting blog:', error);
      setError(error.message || 'Failed to delete blog. Please try again.');
    }
  };

  const togglePublish = async (id) => {
    try {
      const blog = blogs.find(b => b._id === id);
      if (!blog) {
        setError('Blog not found.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/blogs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.status === 401) {
        setError('Authentication failed. Please login again.');
        return;
      }

      if (response.status === 404) {
        setError('Blog not found. It may have been deleted.');
        // Remove from local state
        setBlogs(blogs.filter(blog => blog._id !== id));
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setBlogs(blogs.map(blog => 
        blog._id === id ? (result.blog || result) : blog
      ));
    } catch (error) {
      console.error('Error updating blog status:', error);
      setError(error.message || 'Failed to update blog status. Please try again.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      
      setFormData({
        ...formData,
        imageFile: file,
        image: '' // Clear URL if file is selected
      });
      setError('');
    }
  };

  // Helper function to get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    console.log('Original image path:', imagePath); // Debug log
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a local file path with full system path, extract filename
    if (imagePath.includes('uploads/blog/') || imagePath.includes('uploads\\blog\\')) {
      const filename = imagePath.split(/[/\\]/).pop(); // Handle both / and \ separators
      const imageUrl = `https://bogat.onrender.com/uploads/blog/${filename}`;
      console.log('Converted image URL:', imageUrl); // Debug log
      return imageUrl;
    }
    
    // If it's just a filename, construct full URL
    if (!imagePath.includes('/') && !imagePath.includes('\\')) {
      const imageUrl = `https://bogat.onrender.com/uploads/blog/${imagePath}`;
      console.log('Filename to URL:', imageUrl); // Debug log
      return imageUrl;
    }
    
    // Default case - assume it's a relative path
    const imageUrl = `https://bogat.onrender.com/${imagePath}`;
    console.log('Default case URL:', imageUrl); // Debug log
    return imageUrl;
  };

  // Tag management functions
  const addTag = () => {
    const trimmedTag = formData.tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmedTag],
        tagInput: ''
      });
    }
  };

  const removeTag = (indexToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Helper function to clean tag text - extract only letters and safe characters
  const cleanTagText = (tag) => {
    if (!tag) return '';
    
    // Convert to string and remove all quotes, brackets, and unwanted characters
    let cleanTag = String(tag)
      .replace(/[\[\]"'`]/g, '') // Remove brackets and quotes
      .replace(/[^\w\s-]/g, '') // Keep only letters, numbers, spaces, and hyphens
      .trim(); // Remove leading/trailing spaces
    
    return cleanTag;
  };

  const removeImage = () => {
    setFormData({
      ...formData,
      imageFile: null,
      image: ''
    });
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (Array.isArray(blog.tags) && blog.tags.some(tag => 
                           cleanTagText(tag).toLowerCase().includes(searchTerm.toLowerCase())
                         ));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'published' && blog.status === 'publish') ||
                         (filterStatus === 'draft' && blog.status === 'draft');
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600"></div>
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-amber-300 opacity-20"></div>
          </div>
          <p className="text-amber-700 mt-4 font-medium">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Blog Management
          </h1>
          <p className="text-gray-600 mt-2">Create, edit, and manage your blog posts</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <p>{error}</p>
              <button 
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}


        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-4 h-4" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white transition-all duration-200"
                >
                  <option value="all">All Blogs</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-amber-700 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Blog
            </button>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {editingBlog ? 'Edit Blog' : 'Create New Blog'}
              </h2>
              <button
                onClick={resetForm}
                className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter blog title"
                  disabled={submitting}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Content *
                </label>
                <textarea
                  required
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Write your blog content here..."
                  disabled={submitting}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Blog Image
                </label>
                
                {/* Image Preview */}
                {(formData.imageFile || formData.image) && (
                  <div className="mb-4 relative inline-block">
                    <img
                      src={formData.imageFile ? URL.createObjectURL(formData.imageFile) : getImageUrl(formData.image)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-xl border border-amber-200 shadow-md"
                      onError={(e) => {
                        console.error('Image load error for URL:', e.target.src);
                        console.error('Original formData.image:', formData.image);
                        e.target.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        console.log('Image loaded successfully:', e.target.src);
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                      disabled={submitting}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-amber-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-sm text-amber-600 font-medium">Upload from device</p>
                        <p className="text-xs text-amber-500">PNG, JPG, GIF up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={submitting}
                      />
                    </label>
                  </div>
                  
                  {/* URL Input */}
                  <div className="relative">
                    <span className="text-xs text-amber-600 mb-2 block font-medium">Or paste image URL:</span>
                    <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-4 h-4" />
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value, imageFile: null})}
                      className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      placeholder="https://example.com/image.jpg"
                      disabled={!!formData.imageFile || submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Tags
                </label>
                
                {/* Display existing tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full shadow-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-1 text-amber-500 hover:text-amber-700 transition-colors"
                          disabled={submitting}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Add new tag input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.tagInput}
                    onChange={(e) => setFormData({...formData, tagInput: e.target.value})}
                    onKeyPress={handleTagInputKeyPress}
                    className="flex-1 px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter a tag and press Enter"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!formData.tagInput.trim() || submitting}
                    className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                
                <p className="text-xs text-amber-600 mt-2">
                  Type a tag and press Enter or click Add button. Click × to remove tags.
                </p>
              </div>

              {/* Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white transition-all duration-200"
                    disabled={submitting}
                  >
                    <option value="draft">Draft</option>
                    <option value="publish">Publish</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-amber-700 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {submitting 
                    ? (editingBlog ? 'Updating...' : 'Creating...') 
                    : (editingBlog ? 'Update Blog' : 'Create Blog')
                  }
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Blogs List */}
        <div className="grid gap-6">
          {filteredBlogs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-12 text-center">
              <div className="text-amber-600 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-amber-900 mb-2">No blogs found</h3>
              <p className="text-amber-700">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first blog post to get started'
                }
              </p>
            </div>
          ) : (
            filteredBlogs.map((blog) => (
              <div key={blog._id} className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-amber-900">{blog.title}</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          blog.status === 'publish'
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {blog.status === 'publish' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-amber-600 mb-4">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {blog.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Content Preview */}
                      <p className="text-amber-800 mb-4 line-clamp-3 leading-relaxed">
                        {blog.content && blog.content.length > 150 
                          ? blog.content.substring(0, 150) + '...' 
                          : blog.content
                        }
                      </p>

                      {/* Tags */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <Tag className="w-4 h-4 text-amber-600" />
                          <div className="flex flex-wrap gap-2">
                            {blog.tags
                              .map(tag => cleanTagText(tag))
                              .filter(tag => tag) // Remove empty tags after cleaning
                              .map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200"
                                >
                                  {tag}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Blog Image */}
                    {blog.image && (
                      <div className="ml-6 flex-shrink-0">
                        <img
                          src={getImageUrl(blog.image)}
                          alt={blog.title}
                          className="w-24 h-24 object-cover rounded-xl border border-amber-200 shadow-md"
                          onError={(e) => {
                            console.error('Blog image load error for URL:', e.target.src);
                            console.error('Original blog.image:', blog.image);
                            console.error('Blog ID:', blog._id);
                            e.target.style.display = 'none';
                          }}
                          onLoad={(e) => {
                            console.log('Blog image loaded successfully:', e.target.src);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t border-amber-100">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="flex items-center gap-1 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 hover:text-amber-800 rounded-xl transition-colors border border-amber-200 hover:border-amber-300"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    
                    <button
                      onClick={() => togglePublish(blog._id)}
                      className={`flex items-center gap-1 px-4 py-2 text-sm rounded-xl transition-colors border ${
                        blog.status === 'publish'
                          ? 'text-yellow-700 hover:bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                          : 'text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300'
                      }`}
                    >
                      {blog.status === 'publish' ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Publish
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="flex items-center gap-1 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlogs;