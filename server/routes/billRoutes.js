// routes/billRoutes.js
const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');

// Get all unique customers for filter dropdown (with company filter)
router.get('/customers', async (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Company ID required' 
      });
    }
    
    // Method 1: Get customers from embedded data in bills (filtered by company)
    const bills = await Bill.find({ companyId }, 'customer.name');
    
    // Extract unique customer names from bills
    const customerNamesFromBills = bills
      .map(bill => bill.customer?.name)
      .filter(name => name && name.trim() !== '');
    
    // Remove duplicates
    const uniqueCustomersFromBills = [...new Set(customerNamesFromBills)];
    
    // Method 2: Get customers from Customer collection (filtered by company)
    let customersFromCollection = [];
    try {
      const allCustomers = await Customer.find({ companyId }, 'name');
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
router.get('/reports/bills', billController.getReport);

// Payment routes
router.post('/:id/payment', billController.recordPayment);
router.get('/:id/payment-history', billController.getPaymentHistory);
router.put('/:id/cancel', billController.cancelBill);

// Add this route with your other routes
router.delete('/:id/payment/:paymentIndex', billController.deletePayment);

// Parameter routes (keep these at the end)
router.get('/:id', billController.getBillById);
router.put('/:id', billController.updateBill);
router.delete('/:id', billController.deleteBill);

// Add these routes to your bill routes
router.patch('/bills/:id/print', billController.updatePrintStatus);
router.post('/bills/:id/email', billController.emailBill);

module.exports = router;