const Product = require('../models/Product');

// Get all products with filtering, sorting, and pagination
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      search,
      minPrice,
      maxPrice,
      sortBy,
      status,
      page = 1,
      limit = 12
    } = req.query;

    // Build query
    const query = {};
    if (status && status !== 'all') query.status = status; // Allow 'active' or 'inactive' from frontend
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'price-low':
        sortOptions.price = 1;
        break;
      case 'price-high':
        sortOptions.price = -1;
        break;
      case 'rating':
        sortOptions.rating = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

  const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get single product by ID
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if ('stock' in updateData && Number(updateData.stock) === 0) {
      updateData.status = 'inactive';
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// Delete product (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.InactiveProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product marked as inactive successfully', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.ActiveProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product marked as active successfully', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product categories and subcategories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          subcategories: { $addToSet: '$subcategory' }
        }
      },
      {
        $project: {
          name: '$_id',
          subcategories: {
            $filter: {
              input: '$subcategories',
              as: 'subcategory',
              cond: { $ne: ['$$subcategory', null] }
            }
          },
          _id: 0
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product stock
exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const numericStock = Number(stock);

    const updateData = { stock: numericStock };

    if (numericStock === 0) {
      updateData.status = 'inactive';
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

