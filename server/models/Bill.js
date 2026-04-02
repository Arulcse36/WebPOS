// models/Bill.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'mixed','credit'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  transactionId: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  recordedBy: {
    type: String,
    default: 'system'
  }
});

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    quantity: Number,
    price: Number,
    total: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  cashPaid: {
    type: Number,
    default: 0
  },
  upiPaid: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'mixed','credit'],
    required: true
  },
  customer: {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    name: String,
    phone: String,
    email: String,
    address: String
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'pending'],
    default: 'completed'
  },
  billDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  cancelledAt: Date,
  
  // ✅ ADD PAYMENT HISTORY
  paymentHistory: [paymentSchema],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bill', billSchema);
// ✅ TOTAL CALCULATION (NO next)
billSchema.pre('save', function () {
  this.items = this.items.map(item => ({
    ...item.toObject(),
    total: item.quantity * item.price
  }));

  this.subtotal = this.items.reduce((sum, i) => sum + i.total, 0);
  this.discountAmount = (this.subtotal * this.discount) / 100;
  this.total = this.subtotal - this.discountAmount;
});






module.exports = mongoose.model('Bill', billSchema);