// routes/billRoutes.js
const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');



// Get all unique customers for filter dropdown
router.get('/customers', async (req, res) => {
  try {
    // Method 1: Get customers from embedded data in bills
    const bills = await Bill.find({}, 'customer.name');
    
    // Extract unique customer names from bills
    const customerNamesFromBills = bills
      .map(bill => bill.customer?.name)
      .filter(name => name && name.trim() !== '');
    
    // Remove duplicates
    const uniqueCustomersFromBills = [...new Set(customerNamesFromBills)];
    
    // Method 2: Optionally also get customers from Customer collection
    let customersFromCollection = [];
    try {
      const allCustomers = await Customer.find({}, 'name');
      customersFromCollection = allCustomers
        .map(c => c.name)
        .filter(name => name && name.trim() !== '');
    } catch (err) {
      console.log('Customer collection not available or error:', err.message);
    }
    
    // Combine both sources and remove duplicates
    const allCustomers = [...new Set([...uniqueCustomersFromBills, ...customersFromCollection])];
    
    // Sort alphabetically
    allCustomers.sort();
    
    
    
    console.log(`Found ${allCustomers.length} unique customers`);
    res.json({ 
      success: true, 
      customers: allCustomers 
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    // Return default options on error
    res.json({ 
      success: true, 
      customers: ['Walk-in'] 
    });
  }
});


// Specific routes first
router.post('/', billController.createBill);
router.get('/', billController.getBills);
// router.get('/daily-report', billController.getDailySales);
router.get('/number/:billNumber', billController.getBillByNumber);

// ✅ ADD REPORT ROUTE - This is what your frontend is calling
router.get('/reports/bills', billController.getReport);  // ← Add this line

// Payment routes
router.post('/:id/payment', billController.recordPayment);
router.get('/:id/payment-history', billController.getPaymentHistory);
router.put('/:id/cancel', billController.cancelBill);

// Parameter routes (keep these at the end)
router.get('/:id', billController.getBillById);
router.put('/:id', billController.updateBill);
router.delete('/:id', billController.deleteBill);


// Add these routes to your bill routes
router.patch('/bills/:id/print', billController.updatePrintStatus);
router.post('/bills/:id/email', billController.emailBill);

module.exports = router;