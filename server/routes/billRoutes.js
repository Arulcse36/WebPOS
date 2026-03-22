// routes/billRoutes.js
const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

// All routes are relative to the mount point in server.js
// If mounted at '/billing', these will be:
// POST /billing        - Create bill
// GET /billing         - Get all bills
// GET /billing/:id     - Get bill by ID
// GET /billing/number/:billNumber - Get bill by number
// PUT /billing/:id/cancel - Cancel bill
// GET /billing/daily-report - Get daily report

router.post('/', billController.createBill);
router.get('/', billController.getBills);
router.get('/daily-report', billController.getDailyReport);  // Note: moved before :id
router.get('/:id', billController.getBillById);
router.get('/number/:billNumber', billController.getBillByNumber);
router.put('/:id/cancel', billController.cancelBill);

module.exports = router;