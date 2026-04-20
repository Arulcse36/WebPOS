const express = require('express');
const router = express.Router();
const {
    getExpenseTransactions,
    createExpenseTransaction,
    updateExpenseTransaction,
    deleteExpenseTransaction
} = require('../controllers/expenseTransactionController');

router.get('/', getExpenseTransactions);
router.post('/', createExpenseTransaction);
router.put('/:id', updateExpenseTransaction);
router.delete('/:id', deleteExpenseTransaction);

module.exports = router;