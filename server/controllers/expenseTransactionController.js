const ExpenseTransaction = require('../models/ExpenseTransaction');
const ExpenseMaster = require('../models/ExpenseMaster');
const mongoose = require('mongoose');

// Get all expense transactions
exports.getExpenseTransactions = async (req, res) => {
    try {
        const { companyId, startDate, endDate, expenseId, limit = 100 } = req.query;
        
        let query = {};

        if (companyId) {
            query.companyId = companyId;
        }

        // Date range filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Filter by expense category
        if (expenseId) {
            query.expenseId = expenseId;
        }

        const transactions = await ExpenseTransaction.find(query)
            .populate('expenseId', 'expenseName')
            .sort({ date: -1, createdAt: -1 })
            .limit(parseInt(limit));

        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
            error: error.message
        });
    }
};

// Create new expense transaction
exports.createExpenseTransaction = async (req, res) => {
    try {
        const { expenseId, amount, date, notes, companyId } = req.body;

        // Validation
        if (!expenseId) {
            return res.status(400).json({
                success: false,
                message: 'Expense category is required'
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        // Verify expense exists and is active
        const expense = await ExpenseMaster.findOne({
            _id: expenseId,
            companyId,
            isActive: true
        });

        if (!expense) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive expense category'
            });
        }

        const transaction = new ExpenseTransaction({
            expenseId,
            amount,
            date: date || new Date(),
            notes,
            companyId
        });

        await transaction.save();
        await transaction.populate('expenseId', 'expenseName');

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create transaction',
            error: error.message
        });
    }
};

// Update expense transaction
exports.updateExpenseTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { expenseId, amount, date, notes, companyId } = req.body;

        // Validation
        if (!expenseId) {
            return res.status(400).json({
                success: false,
                message: 'Expense category is required'
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        // Check if transaction exists
        const transaction = await ExpenseTransaction.findOne({
            _id: id,
            companyId
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Verify expense exists and is active
        const expense = await ExpenseMaster.findOne({
            _id: expenseId,
            companyId,
            isActive: true
        });

        if (!expense) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive expense category'
            });
        }

        transaction.expenseId = expenseId;
        transaction.amount = amount;
        transaction.date = date || transaction.date;
        transaction.notes = notes;

        await transaction.save();
        await transaction.populate('expenseId', 'expenseName');

        res.json(transaction);
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update transaction',
            error: error.message
        });
    }
};

// Delete expense transaction
exports.deleteExpenseTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId } = req.query;

        const transaction = await ExpenseTransaction.findOneAndDelete({
            _id: id,
            companyId
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete transaction',
            error: error.message
        });
    }
};