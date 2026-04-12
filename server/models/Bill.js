// models/Bill.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'mixed', 'credit'],
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
  // ✅ ADD COMPANY ID
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required'],
    index: true
  },
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
    enum: ['cash', 'upi', 'card', 'mixed', 'credit'],
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
  
  // PAYMENT HISTORY
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

// ✅ TOTAL CALCULATION (NO next)
billSchema.pre('save', function() {
  this.items = this.items.map(item => ({
    ...item.toObject(),
    total: item.quantity * item.price
  }));

  this.subtotal = this.items.reduce((sum, i) => sum + i.total, 0);
  this.discountAmount = (this.subtotal * this.discount) / 100;
  this.total = this.subtotal - this.discountAmount;
});

// ✅ Add compound index for companyId + billNumber
billSchema.index({ companyId: 1, billNumber: 1 }, { unique: true });
// ✅ Add index for companyId + billDate for reports
billSchema.index({ companyId: 1, billDate: -1 });
// ✅ Add index for companyId + customer name for customer reports
billSchema.index({ companyId: 1, 'customer.name': 1 });

module.exports = mongoose.model('Bill', billSchema);