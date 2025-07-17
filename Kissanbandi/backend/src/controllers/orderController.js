const Order = require('../models/Order');
const Product = require('../models/Product');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const RazorpayTransaction = require('../models/RazorpayTransaction');
require('dotenv').config();

// GST configuration
const GST_RATES = {
  CGST: 2.5, // 2.5%
  SGST: 2.5, // 2.5%
  IGST: 5.0  // 5% (for inter-state transactions)
};

// Helper function to calculate GST
const calculateGST = (subtotal) => {
  const cgst = (subtotal * GST_RATES.CGST) / 100;
  const sgst = (subtotal * GST_RATES.SGST) / 100;
  const totalGST = cgst + sgst;
  
  return {
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    totalGST: Math.round(totalGST * 100) / 100
  };
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, gst } = req.body;

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

    // Calculate GST
    const gstCalculation = calculateGST(subtotal);
    const gstAmount = gst || gstCalculation.totalGST; // Use frontend GST if provided, otherwise calculate

    // Calculate shipping charge
    const shippingCharge = subtotal >= 500 ? 0 : 50;

    // Final total amount (subtotal + GST + shipping)
    const totalAmount = subtotal + gstAmount + shippingCharge;
    
    console.log("=== ORDER CREATION DEBUG ===");
    console.log("Subtotal:", subtotal);
    console.log("GST Amount:", gstAmount);
    console.log("Shipping Charge:", shippingCharge);
    console.log("Total Amount:", totalAmount);
    
    // Create new order
    const order = new Order({
      user: req.user.userId,
      items,
      totalAmount,
      gstAmount, // Save GST amount
      shippingCharge,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'initiated',
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
// Updated getAllOrders function to support all the frontend filters
exports.getAllOrders = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      search, 
      sortField = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { '_id': { $regex: searchRegex } },
        { 'user.name': { $regex: searchRegex } },
        { 'user.email': { $regex: searchRegex } },
        { 'user.phone': { $regex: searchRegex } }
      ];
    }

    // Build sort object
    const sortObj = {};
    if (sortField === 'user.name') {
      sortObj['user.name'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price image')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
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
    const { startDate, endDate, status, search } = req.query;
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

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { '_id': { $regex: searchRegex } },
        { 'user.name': { $regex: searchRegex } },
        { 'user.email': { $regex: searchRegex } },
        { 'user.phone': { $regex: searchRegex } }
      ];
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

    // Create CSV content with admin notes
    const csvRows = [];
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Items',
      'Subtotal',
      'GST Amount',
      'Shipping Charge',
      'Total Amount',
      'Status',
      'Payment Status',
      'Payment Method',
      'Shipping Address',
      'Admin Note' // Added admin note column
    ];

    csvRows.push(headers.join(','));

    for (const order of orders) {
      // Calculate subtotal from items
      const subtotal = (order.items || []).reduce((sum, item) => 
        sum + (item.price || 0) * (item.quantity || 0), 0
      );

      const row = [
        `"${order._id || ''}"`,
        `"${order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}"`,
        `"${(order.user?.name || '').replace(/"/g, '""')}"`,
        `"${(order.user?.email || '').replace(/"/g, '""')}"`,
        `"${(order.user?.phone || '').replace(/"/g, '""')}"`,
        `"${(order.items || []).map(item => 
          `${(item.product?.name || '').replace(/"/g, '""')} (${item.quantity || 0} × ₹${item.price || 0})`
        ).join('; ')}"`,
        `"₹${subtotal.toLocaleString()}"`,
        `"₹${(order.gstAmount || 0).toLocaleString()}"`,
        `"₹${(order.shippingCharge || 0).toLocaleString()}"`,
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
        }"`,
        `"${(order.adminNote || '').replace(/"/g, '""')}"` // Added admin note to export
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
    const totalGST = orders.reduce((sum, order) => sum + (order.gstAmount || 0), 0);
    const totalShipping = orders.reduce((sum, order) => sum + (order.shippingCharge || 0), 0);
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
          totalRevenue: { $sum: "$totalAmount" },
          totalGST: { $sum: "$gstAmount" },
          totalShipping: { $sum: "$shippingCharge" }
        }
      },
      { $sort: { "_id": -1 } }
    ]);

    const stats = {
      totalOrders,
      totalRevenue,
      totalGST,
      totalShipping,
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

// Create Razorpay order - Updated to handle GST
exports.createRazorpayOrder = async (req, res) => {
  try {
    console.log('=== RAZORPAY ORDER CREATE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User from auth middleware:', req.user ? { id: req.user.userId, role: req.user.role } : 'No user');
    
    const { 
      amount, 
      items, 
      shippingAddress, 
      subtotal: frontendSubtotal, 
      shipping: frontendShipping,
      gst: frontendGST 
    } = req.body;

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

      // Calculate components based on frontend data
      let calculatedShipping = frontendShipping || 0;
      let calculatedSubtotal = frontendSubtotal || 0;
      let calculatedGST = frontendGST || 0;

      if (frontendSubtotal !== undefined) {
        // Use the subtotal sent from frontend to calculate shipping and GST
        calculatedShipping = frontendSubtotal < 500 ? 50 : 0;
        const gstCalc = calculateGST(frontendSubtotal);
        calculatedGST = frontendGST || gstCalc.totalGST;
        
        console.log('📦 Calculated components based on frontend subtotal:', { 
          frontendSubtotal, 
          calculatedShipping,
          calculatedGST,
          expectedTotal: frontendSubtotal + calculatedGST + calculatedShipping
        });
      }

      // Verify the total matches
      const expectedTotal = calculatedSubtotal + calculatedGST + calculatedShipping;
      if (Math.abs(expectedTotal - amount) > 0.01) {
        console.log('❌ Amount mismatch in simple request:', {
          calculatedSubtotal,
          calculatedGST,
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

      // Store transaction info with GST details
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
          gstAmount: calculatedGST,
          shippingCharge: calculatedShipping,
          totalAmount: amount
        }
      });

      await transaction.save();
      console.log('✅ Transaction saved with GST info');

      return res.json({
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        metadata: {
          shippingCharge: calculatedShipping,
          gstAmount: calculatedGST,
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

    // Step 2: Calculate GST and shipping charge
    const gstCalculation = calculateGST(subtotal);
    const gstAmount = frontendGST || gstCalculation.totalGST;
    const shippingCharge = subtotal < 500 ? 50 : 0;

    // Step 3: Total payable amount
    const totalAmount = subtotal + gstAmount + shippingCharge;

    console.log('=== ORDER CALCULATION ===');
    console.log('Subtotal:', subtotal);
    console.log('GST Amount:', gstAmount);
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
        gstAmount,
        subtotal,
        orderType: 'full'
      }
    });

    await transaction.save();
    console.log('✅ Transaction saved with full details including GST');

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      metadata: {
        shippingCharge,
        gstAmount,
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

// Verify Razorpay payment - Updated to handle GST
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
    const { items, shippingAddress, gst: frontendGST } = order_details;
    console.log('📦 Order details received:', {
      hasItems: !!items,
      itemsCount: items ? items.length : 0,
      hasShippingAddress: !!shippingAddress,
      shippingFromOrderDetails: order_details.shipping,
      gstFromOrderDetails: frontendGST
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
      
      if (!item || !item.product || !item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        console.error('❌ Invalid item:', item);
        return res.status(400).json({ 
          error: 'Invalid item details',
          details: 'Each item must have valid product ID and quantity'
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

    // Calculate GST based on subtotal
    const gstCalculation = calculateGST(subtotal);
    const gstAmount = frontendGST || gstCalculation.totalGST;

    // Calculate shipping charge based on subtotal (server-side calculation)
    const shippingCharge = subtotal < 500 ? 50 : 0;
    
    // Calculate total amount (server-side calculation)
    const totalAmount = subtotal + gstAmount + shippingCharge;

    console.log('=== 💰 FINAL CALCULATION SUMMARY ===');
    console.log('📊 Subtotal (calculated from products):', subtotal);
    console.log('🧾 GST Amount (calculated):', gstAmount);
    console.log('🚚 Shipping charge (calculated):', shippingCharge);
    console.log('💸 Total amount (calculated):', totalAmount);
    console.log('💳 Transaction amount (from Razorpay):', transaction.amount);
    console.log('🧾 Frontend GST (order_details.gst):', frontendGST);
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
        calculatedGST: gstAmount,
        calculatedShipping: shippingCharge,
        frontendGST: frontendGST,
        frontendShipping: order_details.shipping,
        transactionMetadata: transaction.metadata
      });
      
      // More detailed error message
      return res.status(400).json({ 
        error: 'Order amount mismatch',
        details: `Calculated total (₹${totalAmount}) doesn't match payment amount (₹${transaction.amount}). Please refresh and try again.`,
        debug: {
          subtotal,
          calculatedGST: gstAmount,
          calculatedShipping: shippingCharge,
          calculatedTotal: totalAmount,
          paidAmount: transaction.amount,
          itemsCount: items.length
        }
      });
    }
    
    console.log('✅ Amount verification passed');
    console.log('💾 Creating order in database...');

    // Create order in database with GST
    const order = new Order({
      user: req.user.userId,
      items,
      totalAmount,
      gstAmount, // Save GST amount
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
      gstAmount,
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
// Get order by ID - Updated with proper authorization
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone address')
      .populate('items.product', 'name price image category description');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Proper ObjectId comparison
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

// Download invoice as PDF - Updated to include GST
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

    // Calculate subtotal from items
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // GST breakdown
    const gstCalculation = calculateGST(subtotal);
    const gstAmount = order.gstAmount || gstCalculation.totalGST;

    // Create invoice data with GST details
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
        website: 'www.bogat.com',
        gstNumber: 'YOUR_GST_NUMBER' // Add your actual GST number
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
        cgst: gstCalculation.cgst,
        sgst: gstCalculation.sgst,
        totalGST: gstAmount,
        shipping: order.shippingCharge || 0,
        grandTotal: order.totalAmount || 0
      },
      gstBreakdown: {
        cgstRate: GST_RATES.CGST,
        sgstRate: GST_RATES.SGST,
        cgstAmount: gstCalculation.cgst,
        sgstAmount: gstCalculation.sgst,
        totalGST: gstAmount
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


//order cancellation
exports.updateAdminNote = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const orderId = req.params.id;

    console.log('Updating admin note for order:', orderId);
    console.log('Admin note:', adminNote);
    console.log('User role:', req.user.role);

    // Validate input
    if (!orderId) {
      return res.status(400).json({ 
        success: false,
        error: 'Order ID is required' 
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required. Only administrators can add/edit admin notes.' 
      });
    }

    // Validate admin note (optional - can be empty to clear note)
    if (adminNote && typeof adminNote !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Admin note must be a string' 
      });
    }

    // Limit note length (optional)
    if (adminNote && adminNote.length > 1000) {
      return res.status(400).json({ 
        success: false,
        error: 'Admin note cannot exceed 1000 characters' 
      });
    }

    // Find the order first to check if it exists
    const existingOrder = await Order.findById(orderId);
    
    if (!existingOrder) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Allow notes on ALL orders (removed the cancelled-only restriction)
    console.log(`Adding admin note to ${existingOrder.status} order`);

    // Update the order with admin note
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 
        adminNote: adminNote ? adminNote.trim() : '',
        adminNoteUpdatedAt: new Date(),
        adminNoteUpdatedBy: req.user.userId
      },
      { 
        new: true, 
        runValidators: true 
      }
    )
    .populate('user', 'name email phone')
    .populate('items.product', 'name price image');

    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found after update' 
      });
    }

    console.log('Admin note updated successfully for order:', orderId);

    res.json({
      success: true,
      order: updatedOrder,
      message: adminNote ? 'Admin note updated successfully' : 'Admin note cleared successfully'
    });

  } catch (error) {
    console.error('Error updating admin note:', error);
    
    // Handle different types of errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        details: error.message 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order ID format' 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Internal server error while updating admin note',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};

// Get admin note history (optional - for audit trail)
exports.getAdminNoteHistory = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required' 
      });
    }

    const order = await Order.findById(orderId)
      .populate('adminNoteUpdatedBy', 'name email')
      .select('adminNote adminNoteUpdatedAt adminNoteUpdatedBy status');

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    res.json({
      success: true,
      adminNote: order.adminNote,
      adminNoteUpdatedAt: order.adminNoteUpdatedAt,
      adminNoteUpdatedBy: order.adminNoteUpdatedBy,
      orderStatus: order.status
    });

  } catch (error) {
    console.error('Error fetching admin note history:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch admin note history' 
    });
  }
};