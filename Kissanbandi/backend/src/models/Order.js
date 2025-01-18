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
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'online']
  },
  deliveryNotes: String,
  trackingNumber: String
}, {
  timestamps: true
});

// Add indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

// Calculate total amount before saving
orderSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema); 