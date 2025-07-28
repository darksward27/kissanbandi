const Order = require('../models/Order');
const Product = require('../models/Product');
  const Coupon = require('../models/Coupon');
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
    const { 
      items, 
      shippingAddress, 
      paymentMethod, 
      gst,
      subtotal,
      discountedSubtotal,
      discount,
      couponCode,
      couponId,
      shipping,
      amount
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    let calculatedSubtotal = 0;
    let processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      const itemPrice = item.price || product.price;
      calculatedSubtotal += itemPrice * item.quantity;

      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        price: itemPrice,
        name: product.name
      });

      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    const orderSubtotal = subtotal || calculatedSubtotal;
    const orderDiscount = discount || 0;
    const orderDiscountedSubtotal = discountedSubtotal || (orderSubtotal - orderDiscount);
    const gstAmount = gst || calculateGST(orderDiscountedSubtotal).totalGST;
    const shippingCharge = shipping !== undefined ? shipping : (orderDiscountedSubtotal >= 500 ? 0 : 50);
    const totalAmount = amount || (orderDiscountedSubtotal + gstAmount + shippingCharge);

    if (couponId && couponCode) {
      const coupon = await Coupon.findById(couponId);
      if (!coupon || !coupon.isActive || new Date() > coupon.endDate) {
        return res.status(400).json({ error: 'Invalid or expired coupon' });
      }
    }

    const order = new Order({
      user: req.user.userId,
      items: processedItems,
      subtotal: orderSubtotal,
      discountedSubtotal: orderDiscountedSubtotal,
      discount: orderDiscount,
      couponCode: couponCode || null,
      couponId: couponId || null,
      totalAmount,
      gstAmount,
      shippingCharge,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'initiated',
      status: 'pending'
    });

    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      order: savedOrder,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('❌ Error in createOrder:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create order', 
      details: error.message 
    });
  }
};

const updateCouponAfterPayment = async (couponId, orderId, userId, discountAmount, orderTotal) => {
  try {
    console.log('🎫 Manually updating coupon usage:', {
      couponId,
      orderId,
      discountAmount,
      orderTotal
    });

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      console.error('❌ Coupon not found for manual update');
      return;
    }

    // Check if already updated
    const existingUsage = coupon.usageHistory.find(
      usage => usage.orderId && usage.orderId.toString() === orderId.toString()
    );

    if (existingUsage) {
      console.log('✅ Coupon usage already recorded');
      return;
    }

    // Manual update
    coupon.usageHistory.push({
      userId,
      orderId,
      discountAmount: parseFloat(discountAmount),
      orderTotal: parseFloat(orderTotal),
      usedAt: new Date()
    });
    
    coupon.currentUsage = (coupon.currentUsage || 0) + 1;
    coupon.totalSales = (coupon.totalSales || 0) + parseFloat(orderTotal);
    coupon.budgetUtilized = (coupon.budgetUtilized || 0) + parseFloat(discountAmount);
    
    await coupon.save();

    console.log('✅ Manual coupon update successful:', {
      code: coupon.code,
      currentUsage: coupon.currentUsage,
      totalSales: coupon.totalSales,
      budgetUtilized: coupon.budgetUtilized
    });

  } catch (error) {
    console.error('❌ Manual coupon update failed:', error);
  }
};

// ✅ NEW: Enhanced Razorpay order creation (if you have a separate function)


exports.createRazorpayOrder = async (req, res) => {
  try {
    const { 
      amount, 
      subtotal, 
      discountedSubtotal,
      discount,
      couponCode,
      couponId,
      gst,
      shipping,
      cartItems,
      calculationMethod = 'discount_then_gst'
    } = req.body;

    // Validate coupon and calculate discount
    let validatedDiscount = 0;
    let validatedCoupon = null;

    if (couponCode && couponId) {
      validatedCoupon = await Coupon.findById(couponId);
      if (!validatedCoupon || validatedCoupon.code !== couponCode.toUpperCase()) {
        return res.status(400).json({ success: false, error: 'Invalid coupon' });
      }

      // Check validity
      const now = new Date();
      const isCurrentlyValid = (
        validatedCoupon.isActive && 
        now >= validatedCoupon.startDate && 
        now <= validatedCoupon.endDate &&
        (!validatedCoupon.maxUsageCount || validatedCoupon.currentUsage < validatedCoupon.maxUsageCount) &&
        (!validatedCoupon.budget || validatedCoupon.budgetUtilized < validatedCoupon.budget)
      );
      if (!isCurrentlyValid) {
        return res.status(400).json({ success: false, error: 'Coupon is not currently valid' });
      }

      // Calculate discount
      if (subtotal < validatedCoupon.minOrderValue) {
        return res.status(400).json({ success: false, error: `Minimum order value of ₹${validatedCoupon.minOrderValue} required` });
      }
      if (validatedCoupon.discountType === 'percentage') {
        validatedDiscount = (subtotal * validatedCoupon.discountValue) / 100;
        if (validatedCoupon.maxDiscountAmount && validatedDiscount > validatedCoupon.maxDiscountAmount) {
          validatedDiscount = validatedCoupon.maxDiscountAmount;
        }
      } else if (validatedCoupon.discountType === 'fixed') {
        validatedDiscount = Math.min(validatedCoupon.discountValue, subtotal);
      } else {
        return res.status(400).json({ success: false, error: 'Invalid coupon discount type' });
      }
      validatedDiscount = Math.round(validatedDiscount * 100) / 100;

      // Compare with frontend discount (allow 1 paisa difference)
      if (Math.abs(discount - validatedDiscount) > 0.01) {
        return res.status(400).json({
          success: false,
          error: `Discount mismatch. Expected: ₹${validatedDiscount.toFixed(2)}, Received: ₹${discount.toFixed(2)}`
        });
      }
    }

    // Validate cart items and calculate backend amounts
    let processedItems = [];
    let calculatedSubtotal = 0;
    let calculatedGST = 0;

    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      for (const item of cartItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(400).json({ success: false, error: `Product ${item.productId} not found` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ success: false, error: `Insufficient stock for ${product.name}` });
        }
        const itemTotal = product.price * item.quantity;
        calculatedSubtotal += itemTotal;
        const gstRate = product.gst || 5;
        const itemGST = (itemTotal * gstRate) / 100;
        calculatedGST += itemGST;
        processedItems.push({
          product: item.productId,
          quantity: item.quantity,
          price: product.price,
          name: product.name,
          gst: gstRate
        });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Cart items are required' });
    }

    // Backend calculations
    const finalSubtotal = Math.round(calculatedSubtotal * 100) / 100;
    const finalDiscount = Math.round(validatedDiscount * 100) / 100;
    const finalDiscountedSubtotal = Math.max(0, finalSubtotal - finalDiscount);

    // GST on discounted amount
    let finalGST = calculatedGST;
    if (finalDiscount > 0 && finalSubtotal > 0) {
      const discountRatio = finalDiscountedSubtotal / finalSubtotal;
      finalGST = calculatedGST * discountRatio;
    }
    finalGST = Math.round(finalGST * 100) / 100;

    // Shipping
    const finalShipping = finalDiscountedSubtotal >= 500 ? 0 : 50;

    // Final total
    const finalTotal = finalDiscountedSubtotal + finalGST + finalShipping;
    const roundedFinalTotal = Math.round(finalTotal * 100) / 100;

    // Validate total amount (allow 1 paisa difference)
    if (Math.abs(amount - roundedFinalTotal) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Amount mismatch. Expected: ₹${roundedFinalTotal.toFixed(2)}, Received: ₹${amount.toFixed(2)}`
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(roundedFinalTotal * 100), // Convert to paisa
      currency: "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Store transaction info
    const transaction = new RazorpayTransaction({
      userId: req.user.userId,
      razorpayOrderId: razorpayOrder.id,
      amount: roundedFinalTotal,
      currency: "INR",
      status: 'created',
      paymentMethod: 'razorpay',
      metadata: {
        receipt: options.receipt,
        created_at: new Date(),
        originalSubtotal: finalSubtotal,
        discount: finalDiscount,
        discountedSubtotal: finalDiscountedSubtotal,
        gstAmount: finalGST,
        shippingCharge: finalShipping,
        totalAmount: roundedFinalTotal,
        couponCode: couponCode || null,
        couponId: couponId || null,
        cartItems: cartItems || [],
        processedItems: processedItems,
        calculationMethod,
        backendValidated: true,
        validatedAt: new Date()
      }
    });

    await transaction.save();

    // Return backend validated totals to frontend
    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paisa
      currency: razorpayOrder.currency,
      validatedTotals: {
        originalSubtotal: finalSubtotal,
        discount: finalDiscount,
        discountedSubtotal: finalDiscountedSubtotal,
        gst: finalGST,
        shipping: finalShipping,
        total: roundedFinalTotal
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    });
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

    if (status) query.status = status;

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
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

    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

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
// Updated createRazorpayOrder function with proper coupon handling
exports.createRazorpayOrder = async (req, res) => {
  try {
    console.log('=== RAZORPAY ORDER CREATE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User from auth middleware:', req.user ? { id: req.user.userId, role: req.user.role } : 'No user');
    
    const { 
      amount, 
      subtotal: frontendSubtotal, 
      discountedSubtotal: frontendDiscountedSubtotal,
      discount: frontendDiscount,
      couponCode,
      couponId,
      gst: frontendGST,
      shipping: frontendShipping,
      cartItems,
      calculationMethod = 'discount_then_gst'
    } = req.body;

    // Import Coupon model at the top of the file if not already imported
    const Coupon = require('../models/Coupon');

    console.log('🎫 Coupon Info:', {
      couponCode,
      couponId,
      frontendDiscount,
      frontendDiscountedSubtotal
    });

    // Handle coupon validation if coupon is applied
    let validatedDiscount = 0;
    let validatedCoupon = null;
    
    if (couponCode && couponId) {
      try {
        console.log('🎫 Validating coupon on backend...');
        
        // Find and validate coupon
        validatedCoupon = await Coupon.findById(couponId);
        if (!validatedCoupon || validatedCoupon.code !== couponCode.toUpperCase()) {
          return res.status(400).json({
            success: false,
            error: 'Invalid coupon'
          });
        }

        console.log('✅ Coupon found:', validatedCoupon.code);

        // Check if coupon is currently valid
        const now = new Date();
        const isCurrentlyValid = (
          validatedCoupon.isActive && 
          now >= validatedCoupon.startDate && 
          now <= validatedCoupon.endDate &&
          (!validatedCoupon.maxUsageCount || validatedCoupon.currentUsage < validatedCoupon.maxUsageCount) &&
          (!validatedCoupon.budget || validatedCoupon.budgetUtilized < validatedCoupon.budget)
        );

        if (!isCurrentlyValid) {
          return res.status(400).json({
            success: false,
            error: 'Coupon is not currently valid'
          });
        }

        // Check user eligibility if method exists
        if (typeof validatedCoupon.canUserUseCoupon === 'function') {
          const canUse = validatedCoupon.canUserUseCoupon(req.user.userId);
          if (!canUse) {
            return res.status(400).json({
              success: false,
              error: 'You have already used this coupon'
            });
          }
        }

        // Calculate discount using coupon method if available
        let discountResult;
        if (typeof validatedCoupon.calculateDiscount === 'function') {
          discountResult = validatedCoupon.calculateDiscount(frontendSubtotal, cartItems || []);
        } else {
          // Fallback calculation
          if (frontendSubtotal < validatedCoupon.minOrderValue) {
            return res.status(400).json({
              success: false,
              error: `Minimum order value of ₹${validatedCoupon.minOrderValue} required`
            });
          }

          let discount = 0;
          if (validatedCoupon.discountType === 'percentage') {
            discount = (frontendSubtotal * validatedCoupon.discountValue) / 100;
          } else {
            discount = Math.min(validatedCoupon.discountValue, frontendSubtotal);
          }
          
          discountResult = {
            valid: true,
            discount: Math.round(discount * 100) / 100
          };
        }

        if (!discountResult.valid) {
          return res.status(400).json({
            success: false,
            error: discountResult.reason || 'Coupon not valid for this order'
          });
        }

        validatedDiscount = discountResult.discount;
        console.log('🎫 Discount calculated:', validatedDiscount);

        // Compare with frontend discount (allow 1 paisa difference)
        if (Math.abs(frontendDiscount - validatedDiscount) > 0.01) {
          console.error('❌ Discount mismatch:', {
            frontendDiscount,
            backendDiscount: validatedDiscount
          });
          return res.status(400).json({
            success: false,
            error: `Discount mismatch. Expected: ₹${validatedDiscount.toFixed(2)}, Received: ₹${frontendDiscount.toFixed(2)}`
          });
        }

      } catch (couponError) {
        console.error('❌ Coupon validation error:', couponError);
        return res.status(400).json({
          success: false,
          error: 'Coupon validation failed: ' + couponError.message
        });
      }
    }

    console.log('✅ Coupon validation complete, validated discount:', validatedDiscount);

    // Calculate subtotal from cart items if provided, otherwise use frontend subtotal
    let calculatedSubtotal = frontendSubtotal || 0;
    let calculatedGST = frontendGST || 0;

    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      console.log('📦 Calculating from cart items...');
      calculatedSubtotal = 0;
      calculatedGST = 0;
      
      // Calculate subtotal and GST from cart items
      for (const item of cartItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(400).json({
            success: false,
            error: `Product ${item.productId} not found`
          });
        }
        
        const itemTotal = product.price * item.quantity;
        calculatedSubtotal += itemTotal;
        
        const gstRate = product.gst || 0;
        calculatedGST += (itemTotal * gstRate) / 100;
      }
      
      console.log('📦 Calculated from items:', {
        calculatedSubtotal,
        calculatedGST
      });
    } else {
      // Use frontend calculations
      console.log('📦 Using frontend calculations');
    }

    // Apply discount to get discounted subtotal
    const discountedSubtotal = Math.max(0, calculatedSubtotal - validatedDiscount);
    
    // Adjust GST proportionally if discount is applied
    let adjustedGST = calculatedGST;
    if (validatedDiscount > 0 && calculatedSubtotal > 0) {
      const discountRatio = discountedSubtotal / calculatedSubtotal;
      adjustedGST = calculatedGST * discountRatio;
      console.log('🧮 GST adjusted for discount:', {
        originalGST: calculatedGST,
        discountRatio,
        adjustedGST
      });
    }

    // Calculate shipping based on discounted subtotal
    const shippingCharge = discountedSubtotal >= 500 ? 0 : 50;
    
    // Final total = discounted subtotal + adjusted GST + shipping
    const totalAmount = discountedSubtotal + adjustedGST + shippingCharge;

    console.log('🧮 Backend Final Calculations:', {
      originalSubtotal: calculatedSubtotal,
      validatedDiscount,
      discountedSubtotal,
      originalGST: calculatedGST,
      adjustedGST,
      shippingCharge,
      totalAmount,
      frontendAmount: amount
    });

    // Validate total amount (allow 1 paisa difference for rounding)
    if (Math.abs(amount - totalAmount) > 0.01) {
      console.error('❌ Amount mismatch:', {
        frontendAmount: amount,
        backendAmount: totalAmount,
        difference: Math.abs(amount - totalAmount)
      });
      
      return res.status(400).json({
        success: false,
        error: `Amount mismatch. Expected: ₹${totalAmount.toFixed(2)}, Received: ₹${amount.toFixed(2)}`,
        debug: {
          backendCalculation: {
            originalSubtotal: calculatedSubtotal,
            discount: validatedDiscount,
            discountedSubtotal,
            adjustedGST,
            shipping: shippingCharge,
            total: totalAmount
          },
          frontendData: {
            subtotal: frontendSubtotal,
            discount: frontendDiscount,
            discountedSubtotal: frontendDiscountedSubtotal,
            gst: frontendGST,
            shipping: frontendShipping,
            amount
          }
        }
      });
    }

    console.log('✅ Amount validation passed');
    
    // Create Razorpay order
    const options = {
      amount: Math.round(totalAmount * 100), // Convert to paisa
      currency: "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', razorpayOrder.id);

    // Store transaction info with coupon details
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
        originalSubtotal: calculatedSubtotal,
        discount: validatedDiscount,
        discountedSubtotal,
        gstAmount: adjustedGST,
        shippingCharge,
        totalAmount,
        couponCode: couponCode || null,
        couponId: couponId || null,
        cartItems: cartItems || []
      }
    });

    await transaction.save();
    console.log('✅ Transaction saved with coupon info');

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      validatedTotals: {
        originalSubtotal: calculatedSubtotal,
        discount: validatedDiscount,
        discountedSubtotal,
        gst: adjustedGST,
        shipping: shippingCharge,
        total: totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    });
  }
};

// Updated verifyPayment function to handle coupon application
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
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        success: false,
        error: 'Missing required payment details' 
      });
    }

    console.log('✅ All required fields present');

    // Find the transaction record
    const transaction = await RazorpayTransaction.findOne({
      razorpayOrderId: razorpay_order_id
    });

    console.log('📋 Transaction found:', transaction ? {
      id: transaction._id,
      status: transaction.status,
      amount: transaction.amount,
      backendValidated: transaction.metadata?.backendValidated
    } : 'Not found');

    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        error: 'Transaction not found'
      });
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      console.error('❌ Signature verification failed');
      transaction.status = 'failed';
      transaction.errorDescription = 'Invalid payment signature';
      await transaction.save();
      
      return res.status(400).json({ 
        success: false,
        error: "Invalid payment signature"
      });
    }

    console.log('✅ Signature verification passed');

    // ✅ Extract validated data from transaction metadata (BACKEND TRUTH)
    const metadata = transaction.metadata || {};
    const {
      originalSubtotal,
      discount,
      discountedSubtotal,
      gstAmount,
      shippingCharge,
      totalAmount,
      couponCode,
      couponId,
      processedItems,
      backendValidated
    } = metadata;

    console.log('🎫 Using BACKEND validated data from transaction:', {
      originalSubtotal,
      discount,
      discountedSubtotal,
      gstAmount,
      shippingCharge,
      totalAmount,
      couponCode,
      couponId,
      backendValidated
    });

    // Validate order details items
    const { items, shippingAddress } = order_details;
    if (!items || !Array.isArray(items) || !shippingAddress) {
      console.error('❌ Invalid order details');
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order details provided' 
      });
    }

    console.log('✅ Order details validation passed');

    // Update stock for all items
    console.log('💰 Updating stock for items...');
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`📦 Processing item ${i + 1}/${items.length}:`, {
        productId: item.product,
        quantity: item.quantity
      });

      const product = await Product.findById(item.product);
      if (!product) {
        console.error('❌ Product not found:', item.product);
        return res.status(404).json({ 
          success: false,
          error: `Product with ID ${item.product} does not exist`
        });
      }

      if (product.stock < item.quantity) {
        console.error('❌ Insufficient stock:', {
          productName: product.name,
          requested: item.quantity,
          available: product.stock
        });
        return res.status(400).json({ 
          success: false,
          error: `Only ${product.stock} units available for ${product.name}`
        });
      }

      // Update product stock
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
      
      console.log(`📦 Stock updated for ${product.name}: ${product.stock} -> ${product.stock - item.quantity}`);
    }

    console.log('✅ All items processed and stock updated');

    // Create order in database using BACKEND validated transaction data
    console.log('💾 Creating order in database using backend validated amounts...');

    const order = new Order({
      user: req.user.userId,
      items: items,
      // ✅ Use BACKEND validated data from transaction metadata
      subtotal: originalSubtotal || 0,
      discountedSubtotal: discountedSubtotal || 0,
      discount: discount || 0,
      couponCode: couponCode || null,
      couponId: couponId || null,
      totalAmount: totalAmount, // Use backend calculated total
      gstAmount: gstAmount || 0,
      shippingCharge: shippingCharge || 0,
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

    // Apply coupon usage if coupon was used
    if (couponId && discount > 0) {
      try {
        console.log('🎫 Applying coupon usage...');
        const coupon = await Coupon.findById(couponId);
        
        if (coupon) {
          // Apply coupon usage using the model method if available
          if (typeof coupon.applyCoupon === 'function') {
            await coupon.applyCoupon(
              req.user.userId,
              order._id,
              originalSubtotal,
              discount
            );
          } else {
            // Fallback manual update
            coupon.usageHistory = coupon.usageHistory || [];
            coupon.usageHistory.push({
              user: req.user.userId,
              orderId: order._id,
              orderValue: originalSubtotal,
              discountGiven: discount,
              usedAt: new Date()
            });
            
            coupon.currentUsage = (coupon.currentUsage || 0) + 1;
            coupon.totalSales = (coupon.totalSales || 0) + originalSubtotal;
            coupon.budgetUtilized = (coupon.budgetUtilized || 0) + discount;
            
            await coupon.save();
          }
          
          console.log('✅ Coupon usage applied successfully');
        }
      } catch (couponError) {
        console.error('❌ Error applying coupon usage:', couponError);
        // Don't fail the order creation, just log the error
      }
    }

    // Update transaction record
    transaction.orderId = order._id;
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.status = 'captured';
    transaction.metadata = {
      ...transaction.metadata,
      finalOrderId: order._id,
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
      success: false,
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