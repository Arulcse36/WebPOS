const express = require('express');
const router = express.Router();
const {
  getExpenseMasters,
  getExpenseMasterById,
  createExpenseMaster,
  updateExpenseMaster,
  toggleExpenseStatus,
  deleteExpenseMaster
} = require('../controllers/expenseMasterController');

// GET /api/expense-master - Get all expense masters
router.get('/', getExpenseMasters);

// GET /api/expense-master/:id - Get single expense master
router.get('/:id', getExpenseMasterById);

// POST /api/expense-master - Create new expense master
router.post('/', createExpenseMaster);

// PUT /api/expense-master/:id - Update expense master
router.put('/:id', updateExpenseMaster);

// ✅ IMPORTANT: This route must come BEFORE the general /:id route
// PUT /api/expense-master/:id/status - Toggle expense status
router.put('/:id/status', toggleExpenseStatus);

// DELETE /api/expense-master/:id - Delete expense master
router.delete('/:id', deleteExpenseMaster);

module.exports = router;