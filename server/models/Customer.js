const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    sparse: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },
  address: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true
  },
    balance: {
    type: Number,
    default: 0
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  lastPurchaseDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update total purchases when bill is created
customerSchema.methods.updatePurchaseStats = async function(amount) {
  this.totalPurchases += amount;
  this.lastPurchaseDate = new Date();
  await this.save();
};

module.exports = mongoose.model('Customer', customerSchema);