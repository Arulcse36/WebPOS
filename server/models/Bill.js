const mongoose = require('mongoose');

/* ================================
   BILL ITEM SCHEMA
================================ */
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
  total: {
    type: Number,
    required: true
  }
});

/* ================================
   BILL SCHEMA
================================ */
const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true,
    required: true
  },

  items: [billItemSchema],

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

  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi'],
    required: true
  },

  customer: {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null
    },
    name: {
      type: String,
      default: 'Walk-in Customer'
    },
    phone: String,
    email: String
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

  notes: String,

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/* ================================
   AUTO GENERATE BILL NUMBER
================================ */
billSchema.pre('validate', async function () {
  if (this.isNew && !this.billNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      const dateStr = `${year}${month}${day}`;

      const Bill = this.constructor;

      const lastBill = await Bill.findOne({
        billNumber: { $regex: `^INV-${dateStr}-`, $options: 'i' }
      }).sort({ billNumber: -1 });

      let sequence = 1;

      if (lastBill && lastBill.billNumber) {
        const parts = lastBill.billNumber.split('-');

        if (parts.length === 3) {
          const lastSequence = parseInt(parts[2]);

          if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
          }
        }
      }

      this.billNumber = `INV-${dateStr}-${String(sequence).padStart(4, '0')}`;

      console.log('Generated bill number:', this.billNumber);

    } catch (error) {
      console.error('Bill number generation failed:', error);

      // fallback
      this.billNumber = `INV-${Date.now()}`;
    }
  }
});

/* ================================
   UPDATE TIMESTAMP ON SAVE
================================ */
billSchema.pre('save', function () {
  this.updatedAt = new Date();
});

/* ================================
   UPDATE TIMESTAMP ON UPDATE
================================ */
billSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: new Date() });
});

/* ================================
   INDEXES
================================ */
billSchema.index({ transactionDate: -1 });
billSchema.index({ status: 1, transactionDate: -1 });
billSchema.index({ 'customer.customerId': 1, transactionDate: -1 });

/* ================================
   EXPORT MODEL
================================ */
module.exports = mongoose.model('Bill', billSchema);