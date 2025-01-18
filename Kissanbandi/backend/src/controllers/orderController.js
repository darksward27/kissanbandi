const Order = require('../models/Order');
const Product = require('../models/Product');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    // Validate stock availability and calculate total
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
      item.price = product.price;
      totalAmount += product.price * item.quantity;

      // Update product stock
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    const order = new Order({
      user: req.user.userId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const orders = await Order.find({ user: req.user.userId })
      .populate('items.product', 'name price image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments({ user: req.user.userId });

    res.json({
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get order by ID
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email')
      .populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update payment status (admin)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is authorized to cancel this order
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Only allow cancellation of pending or processing orders
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get orders by date range
exports.getOrdersByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const orders = await Order.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('user', 'name email phone')
    .populate('items.product', 'name price image')
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export orders
exports.exportOrders = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });

    // Create CSV content
    const csvRows = [];
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Items',
      'Total Amount',
      'Status',
      'Payment Status',
      'Shipping Address'
    ];

    csvRows.push(headers.join(','));

    for (const order of orders) {
      const row = [
        order._id,
        new Date(order.createdAt).toLocaleDateString(),
        order.user.name,
        order.user.email,
        order.user.phone,
        order.items.map(item => `${item.product.name}(${item.quantity})`).join('; '),
        order.totalAmount,
        order.status,
        order.paymentStatus,
        `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${new Date().toISOString().split('T')[0]}.csv`);

    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [orders, dailyStats] = await Promise.all([
      Order.find(query),
      Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" }
          }
        },
        { $sort: { "_id": -1 } }
      ])
    ]);

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
      statusBreakdown: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}),
      dailyStats
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 