// Update your Order model (models/Order.js) to include admin note fields

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
    }
  }],
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
  timestamps: true
});

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

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

// Pre-save middleware to update adminNoteUpdatedAt when adminNote changes
orderSchema.pre('save', function(next) {
  if (this.isModified('adminNote')) {
    this.adminNoteUpdatedAt = new Date();
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

// Static method to find orders with admin notes
orderSchema.statics.findOrdersWithAdminNotes = function() {
  return this.find({ 
    adminNote: { $exists: true, $ne: '' } 
  }).populate('user', 'name email')
    .populate('adminNoteUpdatedBy', 'name email');
};

module.exports = mongoose.model('Order', orderSchema);