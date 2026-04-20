const ExpenseMaster = require('../models/ExpenseMaster');

// Get all expense masters
exports.getExpenseMasters = async (req, res) => {
  try {
    const { search, companyId, limit = 100 } = req.query;
    
    let query = {};

    // Filter by companyId if provided
    if (companyId) {
      query.companyId = companyId;
    }

    // Search functionality
    if (search) {
      query = {
        ...query,
        $or: [
          { expenseName: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const expenses = await ExpenseMaster.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(expenses);
  } catch (error) {
    console.error('Get expense masters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense masters',
      error: error.message
    });
  }
};

// Get single expense master
exports.getExpenseMasterById = async (req, res) => {
  try {
    const expense = await ExpenseMaster.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense master not found'
      });
    }
    
    res.json(expense);
  } catch (error) {
    console.error('Get expense master error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense master',
      error: error.message
    });
  }
};

// Create new expense master
exports.createExpenseMaster = async (req, res) => {
  try {
    const { expenseName, companyId } = req.body;

    // Validation
    if (!expenseName || !expenseName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Expense name is required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Check if expense name already exists for this company (case-insensitive)
    const existingExpense = await ExpenseMaster.findOne({
      expenseName: { $regex: new RegExp(`^${expenseName.trim()}$`, 'i') },
      companyId: companyId
    });

    if (existingExpense) {
      return res.status(400).json({
        success: false,
        message: 'Expense name already exists for this company'
      });
    }

    const expense = new ExpenseMaster({
      expenseName: expenseName.trim(),
      companyId,
      isActive: true // Default to active
    });

    await expense.save();

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense master error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Expense name already exists for this company'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create expense master',
      error: error.message
    });
  }
};

// Update expense master
exports.updateExpenseMaster = async (req, res) => {
  try {
    const { expenseName } = req.body;
    const { id } = req.params;

    // Validation
    if (!expenseName || !expenseName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Expense name is required'
      });
    }

    // Check if expense exists
    const existingExpense = await ExpenseMaster.findById(id);
    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: 'Expense master not found'
      });
    }

    // Check if another expense with same name exists for this company
    const duplicateExpense = await ExpenseMaster.findOne({
      expenseName: { $regex: new RegExp(`^${expenseName.trim()}$`, 'i') },
      companyId: existingExpense.companyId,
      _id: { $ne: id }
    });

    if (duplicateExpense) {
      return res.status(400).json({
        success: false,
        message: 'Expense name already exists for this company'
      });
    }

    const expense = await ExpenseMaster.findByIdAndUpdate(
      id,
      { 
        expenseName: expenseName.trim(), 
        updatedAt: new Date() 
      },
      { new: true, runValidators: true }
    );

    res.json(expense);
  } catch (error) {
    console.error('Update expense master error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Expense name already exists for this company'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update expense master',
      error: error.message
    });
  }
};

// ✅ NEW: Toggle expense master status (Activate/Deactivate)
exports.toggleExpenseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.query;
    const { isActive } = req.body;

    // Validation
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Check if expense exists and belongs to company
    const expense = await ExpenseMaster.findOne({
      _id: id,
      companyId: companyId
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense master not found'
      });
    }

    // Update status
    expense.isActive = isActive;
    expense.updatedAt = new Date();
    await expense.save();

    res.json(expense);
  } catch (error) {
    console.error('Toggle expense status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense status',
      error: error.message
    });
  }
};

// Delete expense master
exports.deleteExpenseMaster = async (req, res) => {
  try {
    const expense = await ExpenseMaster.findByIdAndDelete(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense master not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Expense master deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense master error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense master',
      error: error.message
    });
  }
};