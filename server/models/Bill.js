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

// Barcode details schema for items
const barcodeDetailsSchema = new mongoose.Schema({
  barcodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barcode'
  },
  barcode: {
    type: String,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  mrp: {
    type: Number,
    default: null
  },
  retailRate: {
    type: Number,
    default: null
  },
  wholesaleRate: {
    type: Number,
    default: null
  }
}, { _id: false });

// Item schema with barcode support
const itemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  // Barcode fields
  barcode: {
    type: String,
    default: null
  },
  barcodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barcode',
    default: null
  },
  barcodeDetails: {
    type: barcodeDetailsSchema,
    default: null
  }
}, { _id: false });

const billSchema = new mongoose.Schema({
  // ✅ COMPANY ID
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
  items: [itemSchema],
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
  returnAmount: {
    type: Number,
    default: 0
  },
  upiPaid: {
    type: Number,
    default: 0
  },
  rateType: {
    type: String,
    enum: ['retail', 'wholesale'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'credit', 'estimate'],
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

// ✅ TOTAL CALCULATION
billSchema.pre('save', function() {
  this.items = this.items.map(item => {
    // Ensure barcodeDetails is properly structured
    if (item.barcodeDetails && typeof item.barcodeDetails === 'object') {
      // If barcodeDetails is provided, make sure it has the correct structure
      item.barcodeDetails = {
        barcodeId: item.barcodeDetails.barcodeId || null,
        barcode: item.barcodeDetails.barcode || null,
        expiryDate: item.barcodeDetails.expiryDate || null,
        mrp: item.barcodeDetails.mrp || null,
        retailRate: item.barcodeDetails.retailRate || null,
        wholesaleRate: item.barcodeDetails.wholesaleRate || null
      };
    }
    
    return {
      ...item.toObject(),
      total: item.quantity * item.price
    };
  });

  this.subtotal = this.items.reduce((sum, i) => sum + i.total, 0);
  this.discountAmount = (this.subtotal * this.discount) / 100;
  this.total = this.subtotal - this.discountAmount;
});

// ✅ Add indexes for better query performance
billSchema.index({ companyId: 1, billNumber: 1 }, { unique: true });
billSchema.index({ companyId: 1, billDate: -1 });
billSchema.index({ companyId: 1, 'customer.name': 1 });
// Add index for barcode lookups
billSchema.index({ 'items.barcodeId': 1 });
billSchema.index({ 'items.barcode': 1 });
// Add index for expiry date queries
billSchema.index({ 'items.barcodeDetails.expiryDate': 1 });

module.exports = mongoose.model('Bill', billSchema);