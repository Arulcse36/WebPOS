const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
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
  total: Number
});

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true
  },

  items: [billItemSchema],

  subtotal: Number,
  discount: { type: Number, default: 0 },
  discountAmount: Number,
  total: Number,


  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'credit'],
    required: true
  },

  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  cashPaid: { type: Number, default: 0 },
  upiPaid: { type: Number, default: 0 },

  customer: {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null
    },
    name: {
      type: String,
      default: 'Walk-in Customer'
    }
  },

  cashier: {
    type: String,
    default: 'System'
  },

  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded'],
    default: 'completed'
  },

  transactionDate: {
    type: Date,
    default: Date.now
  },

  billDate: {
    type: Date
  }

}, { timestamps: true });


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


// ✅ BILL NUMBER (ASYNC, NO next)
billSchema.pre('save', async function () {
  if (!this.billNumber) {
    const count = await mongoose.model('Bill').countDocuments();
    this.billNumber = `BILL-${1000 + count}`;
  }
});

module.exports = mongoose.model('Bill', billSchema);