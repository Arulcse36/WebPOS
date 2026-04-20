const mongoose = require('mongoose');

const expenseMasterSchema = new mongoose.Schema({
  expenseName: {
    type: String,
    required: [true, 'Expense name is required'],
    trim: true,
    minlength: [2, 'Expense name must be at least 2 characters'],
    maxlength: [100, 'Expense name cannot exceed 100 characters']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique expense name per company
expenseMasterSchema.index({ companyId: 1, expenseName: 1 }, { unique: true });

// Index for faster search
expenseMasterSchema.index({ expenseName: 'text' });

module.exports = mongoose.model('ExpenseMaster', expenseMasterSchema);