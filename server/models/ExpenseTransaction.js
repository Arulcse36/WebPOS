const mongoose = require('mongoose');

const expenseTransactionSchema = new mongoose.Schema({
    expenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseMaster',
        required: [true, 'Expense category is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company ID is required']
    }
}, {
    timestamps: true
});

// Index for faster queries
expenseTransactionSchema.index({ companyId: 1, date: -1 });
expenseTransactionSchema.index({ companyId: 1, expenseId: 1 });

module.exports = mongoose.model('ExpenseTransaction', expenseTransactionSchema);