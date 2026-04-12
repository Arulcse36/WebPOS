const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const mongoose = require('mongoose');

// Helper function to get date range for different periods
function getDateRange(period, from, to) {
  const now = new Date();
  let startDate, endDate;
  
  switch(period) {
    case 'daily':
      // Today from 00:00:00 to 23:59:59 in local timezone
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'weekly':
      // Last 7 days from today
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'monthly':
      // Current month from 1st to today
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'custom':
      if (from && to) {
        startDate = new Date(from);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
      
    default:
      startDate = null;
      endDate = null;
  }
  
  return { startDate, endDate };
}

// ✅ COMPLETE PAYMENT REPORT: Handles all payments (main bill + history) as separate entries
router.get('/payment-report', async (req, res) => {
  try {
    const { companyId, startDate, endDate, customer, period } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: "Company ID required"
      });
    }

    // Get date range based on period
    let startDateTime = null;
    let endDateTime = null;
    
    if (period === 'custom' && startDate && endDate) {
      startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      
      endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
    } else if (period === 'daily') {
      // Today's date range
      const today = new Date();
      startDateTime = new Date(today);
      startDateTime.setHours(0, 0, 0, 0);
      
      endDateTime = new Date(today);
      endDateTime.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      // Last 7 days
      const today = new Date();
      startDateTime = new Date(today);
      startDateTime.setDate(today.getDate() - 7);
      startDateTime.setHours(0, 0, 0, 0);
      
      endDateTime = new Date(today);
      endDateTime.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      // Current month
      const today = new Date();
      startDateTime = new Date(today.getFullYear(), today.getMonth(), 1);
      startDateTime.setHours(0, 0, 0, 0);
      
      endDateTime = new Date(today);
      endDateTime.setHours(23, 59, 59, 999);
    }
    
    if (startDateTime && endDateTime) {
      console.log(`Filtering payments from ${startDateTime.toISOString()} to ${endDateTime.toISOString()}`);
    }

    // Build query for bills (only to get relevant bills)
    let billQuery = {
      companyId: new mongoose.Types.ObjectId(companyId),
      status: { $ne: 'cancelled' }
    };

    // Add customer filter if provided
    if (customer && customer !== '') {
      billQuery['customer.name'] = customer;
      console.log(`Filtering by customer name: ${customer}`);
    }

    // Get all bills that match the customer filter
    const bills = await Bill.find(billQuery).sort({ billDate: -1 });

    console.log(`Found ${bills.length} bills for customer filter`);

    const paymentEntries = [];
    
    // Use a Map to store bill summary with all required fields
    const billSummaryMap = new Map();

    bills.forEach(bill => {
      const billTotal = bill.total || 0;
      const billDate = bill.billDate;
      const customerName = bill.customer?.name || "Walk-in";
      const customerId_value = bill.customer?._id;
      let hasPaymentsInDateRange = false;
      
      // Track payments for this bill within date range
      let billTotalCash = 0;
      let billTotalUpi = 0;
      let billTotalPaid = 0;
      let billPaymentCount = 0;
      
      // Entry 1: Cash from main bill (if exists) - Check if within date range
      if (bill.cashPaid && bill.cashPaid > 0) {
        // Use bill.createdAt for payment date, fallback to billDate
        const paymentDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
        const isInDateRange = !startDateTime || (paymentDate >= startDateTime && paymentDate <= endDateTime);
        
        console.log(`Bill ${bill.billNumber} - Cash payment date: ${paymentDate}, In range: ${isInDateRange}`);
        
        if (isInDateRange) {
          paymentEntries.push({
            billNumber: bill.billNumber,
            billDate: billDate,
            billTotal: billTotal,
            customerName: customerName,
            customerId: customerId_value,
            paymentType: "Cash",
            source: "Main Bill",
            amount: bill.cashPaid,
            transactionId: null,
            notes: "Initial payment at bill creation",
            recordedBy: "system",
            recordedAt: paymentDate
          });
          
          billTotalCash += bill.cashPaid;
          billTotalPaid += bill.cashPaid;
          billPaymentCount++;
          hasPaymentsInDateRange = true;
        }
      }
      
      // Entry 2: UPI from main bill (if exists) - Check if within date range
      if (bill.upiPaid && bill.upiPaid > 0) {
        // Use bill.createdAt for payment date, fallback to billDate
        const paymentDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
        const isInDateRange = !startDateTime || (paymentDate >= startDateTime && paymentDate <= endDateTime);
        
        console.log(`Bill ${bill.billNumber} - UPI payment date: ${paymentDate}, In range: ${isInDateRange}`);
        
        if (isInDateRange) {
          paymentEntries.push({
            billNumber: bill.billNumber,
            billDate: billDate,
            billTotal: billTotal,
            customerName: customerName,
            customerId: customerId_value,
            paymentType: "UPI",
            source: "Main Bill",
            amount: bill.upiPaid,
            transactionId: null,
            notes: "Initial payment at bill creation",
            recordedBy: "system",
            recordedAt: paymentDate
          });
          
          billTotalUpi += bill.upiPaid;
          billTotalPaid += bill.upiPaid;
          billPaymentCount++;
          hasPaymentsInDateRange = true;
        }
      }
      
      // Entry 3: Payments from payment history - Check each payment date
      if (bill.paymentHistory && bill.paymentHistory.length > 0) {
        console.log(`Bill ${bill.billNumber} has ${bill.paymentHistory.length} payment history entries`);
        
        bill.paymentHistory.forEach((payment, index) => {
          if ((payment.paymentMethod === 'cash' || payment.paymentMethod === 'upi') && payment.amount > 0) {
            const paymentDate = new Date(payment.date);
            const isInDateRange = !startDateTime || (paymentDate >= startDateTime && paymentDate <= endDateTime);
            
            console.log(`Bill ${bill.billNumber} - History payment ${index + 1} date: ${paymentDate}, In range: ${isInDateRange}`);
            
            if (isInDateRange) {
              paymentEntries.push({
                billNumber: bill.billNumber,
                billDate: payment.date,
                billTotal: billTotal,
                customerName: customerName,
                customerId: customerId_value,
                paymentType: payment.paymentMethod === 'cash' ? "Cash" : "UPI",
                source: "Payment History",
                amount: payment.amount,
                transactionId: payment.transactionId || null,
                notes: payment.notes || `Payment via ${payment.paymentMethod}`,
                recordedBy: payment.recordedBy || "system",
                recordedAt: paymentDate
              });
              
              if (payment.paymentMethod === 'cash') {
                billTotalCash += payment.amount;
              } else {
                billTotalUpi += payment.amount;
              }
              billTotalPaid += payment.amount;
              billPaymentCount++;
              hasPaymentsInDateRange = true;
            }
          }
        });
      }
      
      // Only add to bill summary if there were payments in the date range
      if (hasPaymentsInDateRange) {
        if (!billSummaryMap.has(bill.billNumber)) {
          billSummaryMap.set(bill.billNumber, {
            billNumber: bill.billNumber,
            billDate: billDate,
            billTotal: billTotal,
            customerName: customerName,
            customerId: customerId_value,
            totalCash: billTotalCash,
            totalUpi: billTotalUpi,
            totalPaid: billTotalPaid,
            paymentCount: billPaymentCount
          });
        } else {
          const summary = billSummaryMap.get(bill.billNumber);
          summary.totalCash += billTotalCash;
          summary.totalUpi += billTotalUpi;
          summary.totalPaid += billTotalPaid;
          summary.paymentCount += billPaymentCount;
        }
      }
    });

    // Sort by recorded date (newest first)
    paymentEntries.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

    // Calculate totals from filtered payment entries
    const totals = paymentEntries.reduce((acc, curr) => {
      if (curr.paymentType === 'Cash') {
        acc.totalCash += curr.amount;
      } else if (curr.paymentType === 'UPI') {
        acc.totalUpi += curr.amount;
      }
      return acc;
    }, { totalCash: 0, totalUpi: 0 });

    console.log(`Total payment entries: ${paymentEntries.length}`);
    console.log(`Total bills with payments: ${billSummaryMap.size}`);
    console.log(`Total cash: ${totals.totalCash}, Total UPI: ${totals.totalUpi}`);

    res.json({
      success: true,
      summary: {
        totalCash: totals.totalCash,
        totalUpi: totals.totalUpi,
        totalPaid: totals.totalCash + totals.totalUpi,
        totalTransactions: paymentEntries.length,
        totalBills: billSummaryMap.size
      },
      billSummary: Array.from(billSummaryMap.values()),
      paymentEntries: paymentEntries
    });

  } catch (error) {
    console.error("Payment report error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ BILL WISE PAYMENT DETAILS (Complete with all payments)
router.get('/bill-payments/:billNumber', async (req, res) => {
  try {
    const { companyId } = req.query;
    const { billNumber } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: "Company ID required"
      });
    }

    const bill = await Bill.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      billNumber: billNumber,
      status: { $ne: 'cancelled' }
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: "Bill not found"
      });
    }

    const payments = [];

    // Add main bill payments with proper dates
    if (bill.cashPaid && bill.cashPaid > 0) {
      payments.push({
        paymentId: `main_cash_${bill._id}`,
        paymentType: "Cash",
        source: "Main Bill",
        amount: bill.cashPaid,
        date: bill.createdAt || bill.billDate,
        transactionId: null,
        notes: "Initial payment at bill creation",
        recordedBy: "system"
      });
    }
    
    if (bill.upiPaid && bill.upiPaid > 0) {
      payments.push({
        paymentId: `main_upi_${bill._id}`,
        paymentType: "UPI",
        source: "Main Bill",
        amount: bill.upiPaid,
        date: bill.createdAt || bill.billDate,
        transactionId: null,
        notes: "Initial payment at bill creation",
        recordedBy: "system"
      });
    }

    // Add payment history
    if (bill.paymentHistory && bill.paymentHistory.length > 0) {
      console.log(`Found ${bill.paymentHistory.length} payment history entries for bill ${billNumber}`);
      
      bill.paymentHistory.forEach((payment, index) => {
        if (payment.paymentMethod === 'cash' || payment.paymentMethod === 'upi') {
          payments.push({
            paymentId: `history_${bill._id}_${index}`,
            paymentType: payment.paymentMethod === 'cash' ? "Cash" : "UPI",
            source: "Payment History",
            amount: payment.amount,
            date: payment.date,
            transactionId: payment.transactionId,
            notes: payment.notes,
            recordedBy: payment.recordedBy || "system"
          });
        }
      });
    }

    // Calculate totals
    const totalCash = payments.filter(p => p.paymentType === 'Cash').reduce((sum, p) => sum + p.amount, 0);
    const totalUpi = payments.filter(p => p.paymentType === 'UPI').reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = totalCash + totalUpi;
    const dueAmount = Math.max(0, (bill.total || 0) - totalPaid);

    console.log(`Bill ${billNumber} - Total Paid: ${totalPaid}, Due Amount: ${dueAmount}, Payments Count: ${payments.length}`);

    res.json({
      success: true,
      billNumber: bill.billNumber,
      customer: bill.customer?.name || "Walk-in",
      billDate: bill.billDate,
      billTotal: bill.total,
      subtotal: bill.subtotal,
      discount: bill.discount,
      discountAmount: bill.discountAmount,
      summary: {
        totalCash,
        totalUpi,
        totalPaid,
        dueAmount,
        paymentCount: payments.length
      },
      payments: payments.sort((a, b) => new Date(b.date) - new Date(a.date))
    });

  } catch (error) {
    console.error("Bill payments error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ SUMMARY REPORT: Cash and UPI totals with breakdown
router.get('/payment-summary', async (req, res) => {
  try {
    const { companyId, startDate, endDate, customer, period } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: "Company ID required"
      });
    }

    // Get date range based on period
    let startDateTime = null;
    let endDateTime = null;
    
    if (period === 'custom' && startDate && endDate) {
      startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      
      endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
    } else if (period === 'daily') {
      const today = new Date();
      startDateTime = new Date(today);
      startDateTime.setHours(0, 0, 0, 0);
      
      endDateTime = new Date(today);
      endDateTime.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      const today = new Date();
      startDateTime = new Date(today);
      startDateTime.setDate(today.getDate() - 7);
      startDateTime.setHours(0, 0, 0, 0);
      
      endDateTime = new Date(today);
      endDateTime.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      const today = new Date();
      startDateTime = new Date(today.getFullYear(), today.getMonth(), 1);
      startDateTime.setHours(0, 0, 0, 0);
      
      endDateTime = new Date(today);
      endDateTime.setHours(23, 59, 59, 999);
    }

    // Build query for bills
    let billQuery = {
      companyId: new mongoose.Types.ObjectId(companyId),
      status: { $ne: 'cancelled' }
    };

    // Add customer filter if provided
    if (customer && customer !== '') {
      billQuery['customer.name'] = customer;
    }

    const bills = await Bill.find(billQuery);

    let totalCashFromBills = 0;
    let totalUpiFromBills = 0;
    let totalCashFromHistory = 0;
    let totalUpiFromHistory = 0;
    let totalBillsCount = 0;
    let billsWithCash = 0;
    let billsWithUpi = 0;
    let billsWithMixed = 0;

    bills.forEach(bill => {
      let hasCashInRange = false;
      let hasUpiInRange = false;
      let hasMixedInRange = false;
      let billHasPayments = false;
      
      // Check main bill cash payment
      if (bill.cashPaid && bill.cashPaid > 0) {
        const paymentDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
        const isInDateRange = !startDateTime || (paymentDate >= startDateTime && paymentDate <= endDateTime);
        
        if (isInDateRange) {
          totalCashFromBills += bill.cashPaid;
          hasCashInRange = true;
          billHasPayments = true;
        }
      }
      
      // Check main bill UPI payment
      if (bill.upiPaid && bill.upiPaid > 0) {
        const paymentDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
        const isInDateRange = !startDateTime || (paymentDate >= startDateTime && paymentDate <= endDateTime);
        
        if (isInDateRange) {
          totalUpiFromBills += bill.upiPaid;
          hasUpiInRange = true;
          billHasPayments = true;
        }
      }
      
      // Check payment history
      if (bill.paymentHistory && bill.paymentHistory.length > 0) {
        bill.paymentHistory.forEach(payment => {
          if (payment.paymentMethod === 'cash' || payment.paymentMethod === 'upi') {
            const paymentDate = new Date(payment.date);
            const isInDateRange = !startDateTime || (paymentDate >= startDateTime && paymentDate <= endDateTime);
            
            if (isInDateRange) {
              if (payment.paymentMethod === 'cash') {
                totalCashFromHistory += payment.amount;
                hasCashInRange = true;
              } else if (payment.paymentMethod === 'upi') {
                totalUpiFromHistory += payment.amount;
                hasUpiInRange = true;
              }
              billHasPayments = true;
            }
          }
        });
      }
      
      // Update statistics only if bill has payments in date range
      if (billHasPayments) {
        totalBillsCount++;
        if (hasCashInRange && hasUpiInRange) {
          hasMixedInRange = true;
        }
        if (hasCashInRange) billsWithCash++;
        if (hasUpiInRange) billsWithUpi++;
        if (hasMixedInRange) billsWithMixed++;
      }
    });

    res.json({
      success: true,
      dateRange: {
        from: startDate || 'All',
        to: endDate || 'All'
      },
      summary: {
        totalCash: totalCashFromBills + totalCashFromHistory,
        totalUpi: totalUpiFromBills + totalUpiFromHistory,
        totalPaid: (totalCashFromBills + totalCashFromHistory) + (totalUpiFromBills + totalUpiFromHistory),
        breakdown: {
          fromBills: {
            cash: totalCashFromBills,
            upi: totalUpiFromBills
          },
          fromPaymentHistory: {
            cash: totalCashFromHistory,
            upi: totalUpiFromHistory
          }
        }
      },
      statistics: {
        totalBills: totalBillsCount,
        billsWithCash,
        billsWithUpi,
        billsWithMixed
      }
    });

  } catch (error) {
    console.error("Payment summary error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;