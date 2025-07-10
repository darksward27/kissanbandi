const Order = require('../models/Order');
const Product = require('../models/Product');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const RazorpayTransaction = require('../models/RazorpayTransaction');
require('dotenv').config();
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

    console.log('Export query:', query);

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 })
      .lean();

    if (!orders || !orders.length) {
      return res.status(404).json({ error: 'No orders found for the specified criteria' });
    }

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
      'Payment Method',
      'Shipping Address'
    ];

    csvRows.push(headers.join(','));

    for (const order of orders) {
      const row = [
        `"${order._id || ''}"`,
        `"${order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}"`,
        `"${(order.user?.name || '').replace(/"/g, '""')}"`,
        `"${(order.user?.email || '').replace(/"/g, '""')}"`,
        `"${(order.user?.phone || '').replace(/"/g, '""')}"`,
        `"${(order.items || []).map(item => 
          `${(item.product?.name || '').replace(/"/g, '""')} (${item.quantity || 0} × ₹${item.price || 0})`
        ).join('; ')}"`,
        `"₹${(order.totalAmount || 0).toLocaleString()}"`,
        `"${order.status || 'pending'}"`,
        `"${order.paymentStatus || 'pending'}"`,
        `"${order.paymentMethod || 'N/A'}"`,
        `"${order.shippingAddress ? 
          [
            order.shippingAddress.address,
            order.shippingAddress.city,
            order.shippingAddress.state,
            order.shippingAddress.pincode
          ].filter(Boolean).join(', ').replace(/"/g, '""')
          : 'Address not available'
        }"`
      ];
      
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const filename = `orders-${new Date().toISOString().split('T')[0]}.csv`;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent));
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    // Send the CSV content
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({ 
      error: 'Failed to export orders',
      details: error.message 
    });
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

    // Get orders with populated data
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .lean();

    // Calculate basic stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    // Calculate status breakdown
    const statusBreakdown = orders.reduce((acc, order) => {
      const status = order.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Calculate daily stats
    const dailyStats = await Order.aggregate([
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
    ]);

    const stats = {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusBreakdown,
      dailyStats
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({ 
      error: 'Failed to get order statistics',
      details: error.message 
    });
  }
};

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    };

    // Create Razorpay order first
    const razorpayOrder = await razorpay.orders.create(options);
    console.log('Razorpay order created:', razorpayOrder);

    // Then create our transaction record
    const transaction = new RazorpayTransaction({
      userId: req.user.userId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount / 100, // Convert back to rupees for storage
      currency: razorpayOrder.currency,
      status: 'created',
      paymentMethod: 'razorpay',
      metadata: { // Store any additional data we might need later
        receipt: options.receipt,
        created_at: new Date()
      }
    });

    await transaction.save();
    console.log('Transaction record created:', transaction._id);

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      error: 'Failed to create payment order',
      details: error.message
    });
  }console.log('req.user:', req.user);

};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_details
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_details) {
      console.error('Missing required fields:', {
        hasOrderId: !!razorpay_order_id,
        hasPaymentId: !!razorpay_payment_id,
        hasSignature: !!razorpay_signature,
        hasOrderDetails: !!order_details
      });
      return res.status(400).json({ error: 'Missing required payment details' });
    }

    console.log('Verifying payment with details:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      hasSignature: !!razorpay_signature,
      orderDetails: !!order_details
    });

    // Find the transaction record first
    const transaction = await RazorpayTransaction.findOne({
      razorpayOrderId: razorpay_order_id
    });

    console.log('Found transaction:', transaction ? {
      id: transaction._id,
      status: transaction.status,
      amount: transaction.amount
    } : 'Not found');

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found',
        details: 'No transaction record found for the given order ID'
      });
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    console.log('Signature verification:', {
      matches: razorpay_signature === expectedSign,
      received: razorpay_signature.slice(0, 10) + '...',
      expected: expectedSign.slice(0, 10) + '...'
    });

    if (razorpay_signature !== expectedSign) {
      // Update transaction status to failed
      transaction.status = 'failed';
      transaction.errorDescription = 'Invalid payment signature';
      await transaction.save();
      
      return res.status(400).json({ 
        error: "Invalid payment signature",
        details: "Payment signature verification failed"
      });
    }

    // Validate order details
    const { items, shippingAddress } = order_details;
    if (!items || !Array.isArray(items) || !shippingAddress) {
      console.error('Invalid order details:', { items, shippingAddress });
      return res.status(400).json({ error: 'Invalid order details provided' });
    }

    // Calculate total and validate stock
    let totalAmount = 0;
    for (const item of items) {
      // Detailed item validation
      console.log('Validating item:', item);
      
      if (!item) {
        console.error('Item is null or undefined');
        return res.status(400).json({ 
          error: 'Invalid item details',
          details: 'Item cannot be null or undefined'
        });
      }

      if (typeof item !== 'object') {
        console.error('Item is not an object:', typeof item);
        return res.status(400).json({ 
          error: 'Invalid item details',
          details: 'Item must be an object'
        });
      }

      if (!item.product) {
        console.error('Missing product ID in item:', item);
        return res.status(400).json({ 
          error: 'Invalid item details',
          details: 'Product ID is required for each item'
        });
      }

      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        console.error('Invalid quantity in item:', item);
        return res.status(400).json({ 
          error: 'Invalid item details',
          details: 'Valid quantity is required for each item'
        });
      }

      try {
        const product = await Product.findById(item.product);
        if (!product) {
          console.error('Product not found:', item.product);
          return res.status(404).json({ 
            error: 'Product not found',
            details: `Product with ID ${item.product} does not exist`
          });
        }

        if (product.stock < item.quantity) {
          console.error('Insufficient stock:', {
            product: product._id,
            productName: product.name,
            requested: item.quantity,
            available: product.stock
          });
          return res.status(400).json({ 
            error: 'Insufficient stock',
            details: `Only ${product.stock} units available for ${product.name}`
          });
        }

        // Set the price from the product
        item.price = product.price;
        totalAmount += product.price * item.quantity;

        // Update product stock
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
        
        console.log('Item validated successfully:', {
          productId: product._id,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        });
      } catch (error) {
        console.error('Error processing item:', error);
        return res.status(400).json({ 
          error: 'Error processing item',
          details: error.message
        });
      }
    }

    // Add shipping cost to total amount
    totalAmount += order_details.shipping || 0;

    // Verify amount matches with a small tolerance for floating-point differences
    const amountDifference = Math.abs(totalAmount - transaction.amount);
    if (amountDifference > 0.01) {  // 1 paisa tolerance
      console.error('Amount mismatch:', {
        calculated: totalAmount,
        transaction: transaction.amount,
        difference: amountDifference,
        shipping: order_details.shipping || 0
      });
      return res.status(400).json({ 
        error: 'Order amount mismatch',
        details: 'Calculated order amount does not match payment amount'
      });
    }

    // Create order in database
    const order = new Order({
      user: req.user.userId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: 'razorpay',
      paymentStatus: 'completed',
      razorpayDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature
      }
    });

    await order.save();
    console.log('Order created successfully:', order._id);

    // Update transaction record with order details
    transaction.orderId = order._id;
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.status = 'captured';
    transaction.metadata = {
      ...transaction.metadata,
      items: items.map(item => ({
        productId: item.product,
        quantity: item.quantity,
        price: item.price
      })),
      captured_at: new Date()
    };
    
    await transaction.save();
    console.log('Transaction updated successfully');

    res.status(201).json({
      success: true,
      order,
      message: 'Payment verified and order created successfully'
    });
  } catch (error) {
    console.error('Payment verification error:', {
      message: error.message,
      stack: error.stack
    });
    
    // Update transaction status if it exists
    if (req.body?.razorpay_order_id) {
      try {
        await RazorpayTransaction.findOneAndUpdate(
          { razorpayOrderId: req.body.razorpay_order_id },
          {
            status: 'failed',
            errorCode: error.code,
            errorDescription: error.message
          }
        );
      } catch (updateError) {
        console.error('Error updating transaction status:', updateError);
      }
    }
    
    res.status(500).json({ 
      error: error.message,
      details: 'An error occurred during payment verification'
    });
  }
};

// Process refund
exports.processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const transaction = await RazorpayTransaction.findOne({ orderId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'captured') {
      return res.status(400).json({ error: 'Payment not captured or already refunded' });
    }

    // Create refund in Razorpay
    const refund = await razorpay.payments.refund(transaction.razorpayPaymentId, {
      amount: amount * 100, // Convert to paise
      notes
    });

    // Update transaction record
    await RazorpayTransaction.findByIdAndUpdate(transaction._id, {
      status: 'refunded',
      refundId: refund.id,
      refundStatus: refund.status,
      refundAmount: amount,
      metadata: {
        ...transaction.metadata,
        refund: {
          reason: notes,
          processedAt: new Date()
        }
      }
    });

    // Update order status
    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    await order.save();

    res.json({ success: true, refund });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get transaction details
exports.getTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await RazorpayTransaction.findById(transactionId)
      .populate('orderId')
      .populate('userId', 'name email phone');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all transactions (admin only)
exports.getAllTransactions = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await RazorpayTransaction.find(query)
      .populate('orderId')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await RazorpayTransaction.countDocuments(query);

    res.json({
      transactions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get transaction statistics (admin only)
exports.getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await RazorpayTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const dailyStats = await RazorpayTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id': -1 } }
    ]);

    res.json({
      statusWiseStats: stats,
      dailyStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 

//edit shipping address
// Edit order shipping address
exports.editOrderAddress = async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    const orderId = req.params.id;

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({ error: 'Valid shipping address is required' });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is authorized to edit this order
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this order' });
    }

    // Only allow address editing for pending or processing orders
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ error: 'Address cannot be edited for this order status' });
    }

    // Update the shipping address
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { shippingAddress },
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('items.product', 'name price image');

    res.json({
      success: true,
      order: updatedOrder,
      message: 'Shipping address updated successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};