// Updated Order model (models/Order.js) with coupon support
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    // Add GST info for each item (optional, for detailed tracking)
    gst: {
      type: Number,
      default: 0
    }
  }],
  
  // ✅ NEW: Coupon and discount fields
  subtotal: {
    type: Number,
    min: 0,
    default: 0
  },
  
  discountedSubtotal: {
    type: Number,
    min: 0,
    default: 0
  },
  
  discount: {
    type: Number,
    min: 0,
    default: 0
  },
  
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  
  // Existing fields
  totalAmount: {
    type: Number,
    required: true
  },
  gstAmount: {
    type: Number,
    required: true,
    default: 0
  },
  shippingCharge: {
    type: Number,
    default: 0
  },
  shippingAddress: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'razorpay'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayDetails: {
    orderId: String,
    paymentId: String,
    signature: String
  },
  
  // Admin note fields for cancelled orders
  adminNote: {
    type: String,
    default: '',
    maxlength: [1000, 'Admin note cannot exceed 1000 characters'],
    trim: true
  },
  adminNoteUpdatedAt: {
    type: Date,
    default: null
  },
  adminNoteUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ couponCode: 1 }); // ✅ NEW: Index for coupon queries
orderSchema.index({ couponId: 1 });   // ✅ NEW: Index for coupon queries

// Virtual for formatted admin note date
orderSchema.virtual('adminNoteUpdatedAtFormatted').get(function() {
  if (!this.adminNoteUpdatedAt) return null;
  return this.adminNoteUpdatedAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// ✅ NEW: Virtual for discount information
orderSchema.virtual('discountInfo').get(function() {
  if (!this.discount || this.discount === 0) {
    return null;
  }
  
  return {
    amount: this.discount,
    percentage: this.subtotal > 0 ? ((this.discount / this.subtotal) * 100).toFixed(1) : 0,
    couponCode: this.couponCode,
    savings: this.discount
  };
});

// ✅ NEW: Virtual for order summary
orderSchema.virtual('orderSummary').get(function() {
  return {
    subtotal: this.subtotal || 0,
    discount: this.discount || 0,
    discountedSubtotal: this.discountedSubtotal || this.subtotal || 0,
    gst: this.gstAmount || 0,
    shipping: this.shippingCharge || 0,
    total: this.totalAmount || 0,
    itemsCount: this.items ? this.items.length : 0,
    totalQuantity: this.items ? this.items.reduce((sum, item) => sum + item.quantity, 0) : 0
  };
});

// Pre-save middleware to update adminNoteUpdatedAt when adminNote changes
orderSchema.pre('save', function(next) {
  if (this.isModified('adminNote')) {
    this.adminNoteUpdatedAt = new Date();
  }
  
  // ✅ NEW: Auto-calculate discountedSubtotal if not provided
  if (this.isModified('subtotal') || this.isModified('discount')) {
    if (this.subtotal && this.discount) {
      this.discountedSubtotal = Math.max(0, this.subtotal - this.discount);
    } else if (this.subtotal && !this.discount) {
      this.discountedSubtotal = this.subtotal;
    }
  }
  
  next();
});

// Instance method to check if order can have admin notes
orderSchema.methods.canHaveAdminNote = function() {
  return this.status === 'cancelled';
};

// Instance method to clear admin note
orderSchema.methods.clearAdminNote = function() {
  this.adminNote = '';
  this.adminNoteUpdatedAt = new Date();
  return this.save();
};

// ✅ NEW: Instance method to check if order used a coupon
orderSchema.methods.hasCoupon = function() {
  return !!(this.couponCode && this.discount > 0);
};

// ✅ NEW: Instance method to get coupon savings info
orderSchema.methods.getCouponSavings = function() {
  if (!this.hasCoupon()) {
    return null;
  }
  
  return {
    code: this.couponCode,
    savings: this.discount,
    originalTotal: (this.subtotal || 0) + (this.gstAmount || 0) + (this.shippingCharge || 0),
    finalTotal: this.totalAmount,
    discountPercentage: this.subtotal > 0 ? ((this.discount / this.subtotal) * 100).toFixed(1) : 0
  };
};

// Static method to find orders with admin notes
orderSchema.statics.findOrdersWithAdminNotes = function() {
  return this.find({ 
    adminNote: { $exists: true, $ne: '' } 
  }).populate('user', 'name email')
    .populate('adminNoteUpdatedBy', 'name email');
};

// ✅ NEW: Static method to find orders with coupons
orderSchema.statics.findOrdersWithCoupons = function(couponCode = null) {
  const query = { 
    couponCode: { $exists: true, $ne: '' },
    discount: { $gt: 0 }
  };
  
  if (couponCode) {
    query.couponCode = couponCode.toUpperCase();
  }
  
  return this.find(query)
    .populate('user', 'name email')
    .populate('couponId', 'title discountType discountValue')
    .populate('items.product', 'name price');
};

// ✅ NEW: Static method to get coupon usage statistics
orderSchema.statics.getCouponStats = async function(startDate = null, endDate = null) {
  const matchStage = {
    couponCode: { $exists: true, $ne: '' },
    discount: { $gt: 0 }
  };
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$couponCode',
        totalUsage: { $sum: 1 },
        totalDiscount: { $sum: '$discount' },
        totalOrderValue: { $sum: '$totalAmount' },
        totalSavings: { $sum: '$discount' },
        averageDiscount: { $avg: '$discount' },
        averageOrderValue: { $avg: '$totalAmount' },
        users: { $addToSet: '$user' }
      }
    },
    {
      $addFields: {
        uniqueUsers: { $size: '$users' }
      }
    },
    {
      $project: {
        users: 0 // Remove users array from output
      }
    },
    { $sort: { totalUsage: -1 } }
  ]);
  
  return stats;
};

// ✅ NEW: Static method to calculate total savings from coupons
orderSchema.statics.getTotalCouponSavings = async function(startDate = null, endDate = null) {
  const matchStage = {
    couponCode: { $exists: true, $ne: '' },
    discount: { $gt: 0 }
  };
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSavings: { $sum: '$discount' },
        totalOrderValue: { $sum: '$totalAmount' },
        averageDiscount: { $avg: '$discount' },
        uniqueCoupons: { $addToSet: '$couponCode' },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $addFields: {
        uniqueCouponsCount: { $size: '$uniqueCoupons' },
        uniqueUsersCount: { $size: '$uniqueUsers' }
      }
    }
  ]);
  
  return result[0] || {
    totalOrders: 0,
    totalSavings: 0,
    totalOrderValue: 0,
    averageDiscount: 0,
    uniqueCouponsCount: 0,
    uniqueUsersCount: 0
  };
};

module.exports = mongoose.model('Order', orderSchema);