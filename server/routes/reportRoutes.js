const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');

// 📄 INDIVIDUAL BILL REPORT with customer filter
router.get('/bills', async (req, res) => {
  try {
    const { type, from, to, customer } = req.query; // ✅ Added customer parameter

    let startDate, endDate;
    const now = new Date();

    // ✅ DAILY
    if (type === 'daily') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    }
    // ✅ WEEKLY
    else if (type === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    }
    // ✅ MONTHLY
    else if (type === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    }
    // ✅ CUSTOM
    else if (type === 'custom') {
      if (!from || !to) {
        return res.status(400).json({ 
          success: false, 
          error: "From & To dates are required for custom report" 
        });
      }

      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    }
    else {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid type. Use: daily, weekly, monthly, or custom" 
      });
    }

    // ✅ BUILD QUERY WITH CUSTOMER FILTER
    let query = {
      billDate: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // ✅ Add customer filter if provided
    if (customer && customer !== '' && customer !== 'All Customers') {
      if (customer === 'Walk-in') {
        // For Walk-in customers, match either:
        // - customer.name is null/empty
        // - customer.name is "Walk-in"
        // - customer field doesn't exist
        query.$or = [
          { 'customer.name': { $exists: false } },
          { 'customer.name': null },
          { 'customer.name': '' },
          { 'customer.name': 'Walk-in' }
        ];
      } else {
        // For specific customer, match by name
        query['customer.name'] = customer;
      }
    }

    console.log(`Fetching ${type} report from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log('Query:', JSON.stringify(query, null, 2));

    // ✅ FETCH BILLS
    const bills = await Bill.find(query).sort({ billDate: -1 });

    console.log(`Found ${bills.length} bills`);

    // ✅ Calculate summaries
    let grandTotal = 0;
    let totalDiscount = 0;
    let totalPaidFromBill = 0;
    let totalPaidFromHistory = 0;
    let totalCombinedPaid = 0;
    let totalCombinedDue = 0;
    let totalItems = 0;

    const formattedBills = bills.map(bill => {
      const itemCount = bill.items.reduce((sum, i) => sum + i.quantity, 0);
      
      // Calculate total paid from payment history
      const paidFromHistory = (bill.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);
      
      // Combined paid amount = original paidAmount + payment history
      const combinedPaid = (bill.paidAmount || 0) + paidFromHistory;
      
      // Calculate due amount (cannot be negative)
      const combinedDue = Math.max(0, (bill.total || 0) - combinedPaid);

      // Accumulate totals
      grandTotal += bill.total || 0;
      totalDiscount += bill.discountAmount || 0;
      totalPaidFromBill += bill.paidAmount || 0;
      totalPaidFromHistory += paidFromHistory;
      totalCombinedPaid += combinedPaid;
      totalCombinedDue += combinedDue;
      totalItems += itemCount;

      return {
        _id: bill._id,
        id: bill._id,
        billNumber: bill.billNumber,
        date: bill.billDate,
        customer: bill.customer?.name || "Walk-in",
        paymentMethod: bill.paymentMethod,
        itemCount,
        total: bill.total,
        discount: bill.discountAmount,
        
        // Original amounts from bill
        paidOriginal: bill.paidAmount,
        dueOriginal: bill.dueAmount,
        
        // Payment history amounts
        paidFromHistory: paidFromHistory,
        
        // Combined amounts (original + history)
        paid: combinedPaid,
        due: combinedDue,
        
        items: bill.items,
        subtotal: bill.subtotal,
        discountPercent: bill.discount,
        cashPaid: bill.cashPaid,
        upiPaid: bill.upiPaid,
        status: bill.status,
        paymentHistory: bill.paymentHistory // Include payment history for reference
      };
    });

    res.json({
      success: true,
      count: bills.length,
      filter: customer || 'All Customers', // Include filter info in response
      summary: {
        grandTotal,
        totalDiscount,
        totalPaidFromBill,      // Original paid amount from bills
        totalPaidFromHistory,   // Total from payment history
        totalPaid: totalCombinedPaid,      // Combined total paid
        totalDue: totalCombinedDue,         // Combined total due
        totalItems
      },
      bills: formattedBills
    });

  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch report",
      message: error.message 
    });
  }
});

// ✅ Optional: Get customer report summary (for dashboard)
router.get('/customer-summary', async (req, res) => {
  try {
    const { customer } = req.query;
    
    let query = {};
    if (customer && customer !== '' && customer !== 'All Customers') {
      if (customer === 'Walk-in') {
        query.$or = [
          { 'customer.name': { $exists: false } },
          { 'customer.name': null },
          { 'customer.name': '' },
          { 'customer.name': 'Walk-in' }
        ];
      } else {
        query['customer.name'] = customer;
      }
    }
    
    const bills = await Bill.find(query);
    
    let totalSpent = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let billCount = bills.length;
    
    bills.forEach(bill => {
      const paidFromHistory = (bill.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);
      const combinedPaid = (bill.paidAmount || 0) + paidFromHistory;
      
      totalSpent += bill.total || 0;
      totalPaid += combinedPaid;
      totalDue += Math.max(0, (bill.total || 0) - combinedPaid);
    });
    
    res.json({
      success: true,
      customer: customer || 'All Customers',
      billCount,
      totalSpent,
      totalPaid,
      totalDue
    });
  } catch (error) {
    console.error("Customer summary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;