const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required'],
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true 
  },
  address: {
    type: String,
    trim: true
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

// Compound index for companyId + phone (unique within company)
customerSchema.index({ companyId: 1, phone: 1 }, { unique: true });


// Index for querying customers by company
customerSchema.index({ companyId: 1, name: 1 });
customerSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('Customer', customerSchema);