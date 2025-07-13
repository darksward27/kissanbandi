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

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Validate stock availability and calculate subtotal
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      item.price = product.price;
      subtotal += product.price * item.quantity;

      // Update product stock
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Calculate shipping charge
    const shippingCharge = subtotal >= 500 ? 0 : 50;

    // Final total amount
    const totalAmount = subtotal + shippingCharge;
    console.log("VAIBHAV SAYS : ", totalAmount);
    
    // Create new order
    const order = new Order({
      user: req.user.userId,
      items,
      totalAmount,
      shippingCharge,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'initiated', // optional logic
      status: 'pending'
    });

    await order.save();

    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
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
// Create Razorpay order - UPDATED to handle both simple amount and full order details
// Create Razorpay order - UPDATED to handle both simple amount and full order details
// Create Razorpay order - FIXED to avoid variable conflicts
// Create Razorpay order - FIXED for consistent shipping calculation
exports.createRazorpayOrder = async (req, res) => {
  try {
    console.log('=== RAZORPAY ORDER CREATE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User from auth middleware:', req.user ? { id: req.user.userId, role: req.user.role } : 'No user');
    
    const { amount, items, shippingAddress, subtotal: frontendSubtotal, shipping: frontendShipping } = req.body;

    // Handle simple amount-only requests (from your current frontend)
    if (amount && !items) {
      console.log('📝 Processing simple amount-only request');
      
      if (typeof amount !== 'number' || amount <= 0) {
        console.log('❌ Invalid amount:', amount);
        return res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
      }

      // FIXED: Calculate shipping based on subtotal from frontend
      let calculatedShipping = 0;
      let calculatedSubtotal = frontendSubtotal;

      if (frontendSubtotal !== undefined) {
        // Use the subtotal sent from frontend to calculate shipping
        calculatedShipping = frontendSubtotal < 500 ? 50 : 0;
        console.log('📦 Calculated shipping based on frontend subtotal:', { 
          frontendSubtotal, 
          calculatedShipping,
          expectedTotal: frontendSubtotal + calculatedShipping
        });
      } else {
        // Fallback: assume shipping based on total amount (less reliable)
        calculatedSubtotal = amount - 50; // Assume 50 shipping initially
        if (calculatedSubtotal >= 500) {
          calculatedShipping = 0;
          calculatedSubtotal = amount; // No shipping needed
        } else {
          calculatedShipping = 50;
        }
        console.log('📦 Fallback shipping calculation:', { 
          amount, 
          calculatedSubtotal, 
          calculatedShipping 
        });
      }

      // Verify the total matches
      const expectedTotal = calculatedSubtotal + calculatedShipping;
      if (Math.abs(expectedTotal - amount) > 0.01) {
        console.log('❌ Amount mismatch in simple request:', {
          calculatedSubtotal,
          calculatedShipping,
          expectedTotal,
          receivedAmount: amount
        });
        return res.status(400).json({
          success: false,
          error: `Amount mismatch. Expected: ₹${expectedTotal}, Received: ₹${amount}`
        });
      }
      
      console.log('✅ Creating Razorpay order for amount:', amount);
      
      // Create Razorpay order
      const options = {
        amount: amount * 100, // Amount in paise
        currency: "INR",
        receipt: `order_${Date.now()}`,
        payment_capture: 1
      };

      const razorpayOrder = await razorpay.orders.create(options);
      console.log('✅ Razorpay order created:', razorpayOrder.id);

      // Store transaction info with shipping details
      const transaction = new RazorpayTransaction({
        userId: req.user.userId,
        razorpayOrderId: razorpayOrder.id,
        amount: amount,
        currency: "INR",
        status: 'created',
        paymentMethod: 'razorpay',
        metadata: {
          receipt: options.receipt,
          created_at: new Date(),
          orderType: 'simple',
          subtotal: calculatedSubtotal,
          shippingCharge: calculatedShipping,
          totalAmount: amount
        }
      });

      await transaction.save();
      console.log('✅ Transaction saved with shipping info');

      return res.json({
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        metadata: {
          shippingCharge: calculatedShipping,
          subtotal: calculatedSubtotal
        }
      });
    }

    // Handle full order details with items
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('❌ Cart is empty or invalid');
      return res.status(400).json({ 
        success: false,
        error: 'Cart is empty or invalid. Please provide either amount or items.' 
      });
    }

    console.log('📝 Processing full order with items validation');

    // Step 1: Validate products and calculate subtotal
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        console.log('❌ Product not found:', item.product);
        return res.status(404).json({ 
          success: false,
          error: `Product not found: ${item.product}` 
        });
      }

      if (product.stock < item.quantity) {
        console.log('❌ Insufficient stock:', { product: product.name, requested: item.quantity, available: product.stock });
        return res.status(400).json({ 
          success: false,
          error: `Insufficient stock for ${product.name}` 
        });
      }

      subtotal += product.price * item.quantity;
    }

    // Step 2: Calculate shipping charge (consistent with verifyPayment)
    const shippingCharge = subtotal < 500 ? 50 : 0;

    // Step 3: Total payable amount
    const totalAmount = subtotal + shippingCharge;

    console.log('=== ORDER CALCULATION ===');
    console.log('Subtotal:', subtotal);
    console.log('Shipping charge:', shippingCharge);
    console.log('Total amount:', totalAmount);
    console.log('Free shipping eligible:', subtotal >= 500);

    // Step 4: Create Razorpay order
    const options = {
      amount: totalAmount * 100, // Amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', razorpayOrder.id);

    // Step 5: Store transaction metadata
    const transaction = new RazorpayTransaction({
      userId: req.user.userId,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: "INR",
      status: 'created',
      paymentMethod: 'razorpay',
      metadata: {
        receipt: options.receipt,
        created_at: new Date(),
        items,
        shippingAddress,
        shippingCharge,
        subtotal,
        orderType: 'full'
      }
    });

    await transaction.save();
    console.log('✅ Transaction saved with full details');

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      metadata: {
        shippingCharge,
        subtotal,
        totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Razorpay order',
      details: error.message
    });
  }
};


// Verify Razorpay payment
// Enhanced verifyPayment function with extensive debugging
exports.verifyPayment = async (req, res) => {
  try {
    console.log('🚀 === PAYMENT VERIFICATION STARTED ===');
    console.log('📦 Request body received:', JSON.stringify(req.body, null, 2));
    
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_details
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_details) {
      console.error('❌ Missing required fields:', {
        hasOrderId: !!razorpay_order_id,
        hasPaymentId: !!razorpay_payment_id,
        hasSignature: !!razorpay_signature,
        hasOrderDetails: !!order_details
      });
      return res.status(400).json({ error: 'Missing required payment details' });
    }

    console.log('✅ All required fields present');
    console.log('🔍 Looking for transaction with Razorpay Order ID:', razorpay_order_id);

    // Find the transaction record first
    const transaction = await RazorpayTransaction.findOne({
      razorpayOrderId: razorpay_order_id
    });

    console.log('📋 Transaction found:', transaction ? {
      id: transaction._id,
      status: transaction.status,
      amount: transaction.amount,
      metadata: transaction.metadata
    } : 'Not found');

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found',
        details: 'No transaction record found for the given order ID'
      });
    }

    console.log('🔐 Starting signature verification...');
    
    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    console.log('🔐 Signature verification:', {
      matches: razorpay_signature === expectedSign,
      received: razorpay_signature.slice(0, 10) + '...',
      expected: expectedSign.slice(0, 10) + '...'
    });

    if (razorpay_signature !== expectedSign) {
      console.error('❌ Signature verification failed');
      // Update transaction status to failed
      transaction.status = 'failed';
      transaction.errorDescription = 'Invalid payment signature';
      await transaction.save();
      
      return res.status(400).json({ 
        error: "Invalid payment signature",
        details: "Payment signature verification failed"
      });
    }

    console.log('✅ Signature verification passed');
    console.log('📝 Validating order details...');

    // Validate order details
    const { items, shippingAddress } = order_details;
    console.log('📦 Order details received:', {
      hasItems: !!items,
      itemsCount: items ? items.length : 0,
      hasShippingAddress: !!shippingAddress,
      shippingFromOrderDetails: order_details.shipping
    });

    if (!items || !Array.isArray(items) || !shippingAddress) {
      console.error('❌ Invalid order details:', { 
        hasItems: !!items, 
        isArray: Array.isArray(items), 
        itemsLength: items ? items.length : 0,
        hasShippingAddress: !!shippingAddress 
      });
      return res.status(400).json({ error: 'Invalid order details provided' });
    }

    console.log('✅ Order details validation passed');
    console.log('💰 Starting subtotal calculation...');

    // Calculate subtotal and validate stock
    let subtotal = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`📦 Processing item ${i + 1}/${items.length}:`, {
        productId: item.product,
        quantity: item.quantity,
        priceFromFrontend: item.price
      });
      
      if (!item) {
        console.error('❌ Item is null or undefined at index:', i);
        return res.status(400).json({ 
          error: 'Invalid item details',
          details: 'Item cannot be null or undefined'
        });
      }

      if (!item.product) {
        console.error('❌ Missing product ID in item:', item);
        return res.status(400).json({ 
          error: 'Invalid item details',
          details: 'Product ID is required for each item'
        });
      }

      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        console.error('❌ Invalid quantity in item:', item);
        return res.status(400).json({ 
          error: 'Invalid item details',
          details: 'Valid quantity is required for each item'
        });
      }

      try {
        const product = await Product.findById(item.product);
        if (!product) {
          console.error('❌ Product not found:', item.product);
          return res.status(404).json({ 
            error: 'Product not found',
            details: `Product with ID ${item.product} does not exist`
          });
        }

        console.log(`✅ Product found:`, {
          id: product._id,
          name: product.name,
          price: product.price,
          stock: product.stock
        });

        if (product.stock < item.quantity) {
          console.error('❌ Insufficient stock:', {
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

        // Set the price from the product (server-side price, not frontend price)
        item.price = product.price;
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        console.log(`💰 Item calculation:`, {
          productName: product.name,
          serverPrice: product.price,
          quantity: item.quantity,
          itemTotal: itemTotal,
          runningSubtotal: subtotal
        });

        // Update product stock
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
        
        console.log(`📦 Stock updated for ${product.name}: ${product.stock} -> ${product.stock - item.quantity}`);
      } catch (error) {
        console.error('❌ Error processing item:', error);
        return res.status(400).json({ 
          error: 'Error processing item',
          details: error.message
        });
      }
    }

    console.log('✅ All items processed successfully');

    // Calculate shipping charge based on subtotal (server-side calculation)
    const shippingCharge = subtotal < 500 ? 50 : 0;
    
    // Calculate total amount (server-side calculation)
    const totalAmount = subtotal + shippingCharge;

    console.log('=== 💰 FINAL CALCULATION SUMMARY ===');
    console.log('📊 Subtotal (calculated from products):', subtotal);
    console.log('🚚 Shipping charge (calculated):', shippingCharge);
    console.log('💸 Total amount (calculated):', totalAmount);
    console.log('💳 Transaction amount (from Razorpay):', transaction.amount);
    console.log('🚚 Frontend shipping (order_details.shipping):', order_details.shipping);
    console.log('✅ Free shipping eligible:', subtotal >= 500);
    console.log('📋 Transaction metadata:', transaction.metadata);

    // Verify amount matches with a small tolerance for floating-point differences
    const amountDifference = Math.abs(totalAmount - transaction.amount);
    console.log('🔍 Amount difference:', amountDifference);
    
    if (amountDifference > 0.01) {  // 1 paisa tolerance
      console.error('❌ AMOUNT MISMATCH - Details:', {
        calculatedTotal: totalAmount,
        transactionAmount: transaction.amount,
        difference: amountDifference,
        subtotal,
        calculatedShipping: shippingCharge,
        frontendShipping: order_details.shipping,
        transactionMetadata: transaction.metadata
      });
      
      // More detailed error message
      return res.status(400).json({ 
        error: 'Order amount mismatch',
        details: `Calculated total (₹${totalAmount}) doesn't match payment amount (₹${transaction.amount}). Please refresh and try again.`,
        debug: {
          subtotal,
          calculatedShipping: shippingCharge,
          calculatedTotal: totalAmount,
          paidAmount: transaction.amount,
          itemsCount: items.length
        }
      });
    }
    
    console.log('✅ Amount verification passed');
    console.log('💾 Creating order in database...');

    // Create order in database
    const order = new Order({
      user: req.user.userId,
      items,
      totalAmount,
      shippingCharge,  // Add shipping charge to order
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
    console.log('✅ Order created successfully in database:', order._id);

    console.log('📝 Updating transaction record...');

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
      subtotal,
      shippingCharge,
      captured_at: new Date()
    };
    
    await transaction.save();
    console.log('✅ Transaction updated successfully');

    console.log('🎉 === PAYMENT VERIFICATION COMPLETED SUCCESSFULLY ===');

    res.status(201).json({
      success: true,
      order,
      message: 'Payment verified and order created successfully'
    });
  } catch (error) {
    console.error('💥 === PAYMENT VERIFICATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
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
        console.log('📝 Transaction status updated to failed');
      } catch (updateError) {
        console.error('❌ Error updating transaction status:', updateError);
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


//get orders by id 
// FIXED getOrderById function - Replace this in your orderController.js

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone address')
      .populate('items.product', 'name price image category description');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // FIXED: Proper ObjectId comparison
    // Your auth middleware sets req.user.userId as ObjectId, order.user._id is also ObjectId
    const orderUserId = order.user._id.toString();
    const requestUserId = req.user.userId.toString();
    
    // Check authorization - users can only see their own orders, admins can see all
    if (req.user.role !== 'admin' && orderUserId !== requestUserId) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ error: error.message });
  }
};

// ALTERNATIVE: More robust version with debugging (recommended)
exports.getOrderByIdRobust = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('Getting order:', {
      orderId,
      requestUserId: req.user.userId,
      userRole: req.user.role
    });

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone address')
      .populate('items.product', 'name price image category description');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Convert both to strings for comparison
    const orderUserId = order.user._id.toString();
    const requestUserId = req.user.userId.toString();
    const isAdmin = req.user.role === 'admin';
    
    console.log('Authorization check:', {
      orderUserId,
      requestUserId,
      isAdmin,
      match: orderUserId === requestUserId
    });

    // Check authorization
    if (!isAdmin && orderUserId !== requestUserId) {
      console.log('❌ Authorization failed');
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    console.log('✅ Authorization successful');
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ error: error.message });
  }
};


// Download invoice as PDF
exports.downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order with populated data
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone address')
      .populate('items.product', 'name price image category description');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to download this invoice' });
    }

    // Calculate totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 50;

    // Create invoice data
    const invoiceData = {
      invoice: {
        number: `INV-${order._id.slice(-8).toUpperCase()}`,
        date: new Date(order.createdAt).toLocaleDateString('en-IN'),
        orderId: order._id,
        status: order.status || 'pending',
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod || 'N/A'
      },
      company: {
        name: 'BOGAT',
        tagline: 'Premium Quality Products',
        email: 'support@bogat.com',
        website: 'www.bogat.com'
      },
      customer: {
        name: order.user?.name || 'Customer',
        email: order.user?.email || 'N/A',
        phone: order.user?.phone || 'N/A'
      },
      shippingAddress: {
        address: order.shippingAddress?.address || 'N/A',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        pincode: order.shippingAddress?.pincode || 'N/A',
        phone: order.shippingAddress?.phone || 'N/A'
      },
      items: order.items.map(item => ({
        name: item.product?.name || 'Product',
        description: item.product?.description || '',
        quantity: item.quantity || 0,
        unitPrice: item.price || 0,
        total: (item.price || 0) * (item.quantity || 0)
      })),
      totals: {
        subtotal: subtotal,
        shipping: shipping,
        grandTotal: order.totalAmount || 0
      },
      razorpayDetails: order.razorpayDetails || null
    };

    // Send invoice data for PDF generation
    res.json({
      success: true,
      invoiceData,
      message: 'Invoice data generated successfully'
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      error: 'Failed to generate invoice',
      details: error.message 
    });
  }
};