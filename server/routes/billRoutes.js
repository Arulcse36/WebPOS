const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

router.post('/', billController.createBill);
router.get('/', billController.getBills);
router.get('/daily-report', billController.getDailySales);
router.get('/number/:billNumber', billController.getBillByNumber);

// ✅ IMPORTANT ORDER
router.get('/:id', billController.getBillById);

// ✅ ADD THIS (FIX)
router.put('/:id', billController.updateBill);
router.put('/:id/cancel', billController.cancelBill);

// ✅ ADD DELETE ROUTE
router.delete('/:id', billController.deleteBill);

module.exports = router;