const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');

// 📄 INDIVIDUAL BILL REPORT
router.get('/bills', async (req, res) => {
  try {
    const { type, from, to } = req.query;

    let startDate, endDate;
    const now = new Date();

    // ✅ DAILY
    if (type === 'daily') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date();
    }

    // ✅ WEEKLY
    else if (type === 'weekly') {
      const firstDay = new Date();
      firstDay.setDate(now.getDate() - 7);
      startDate = new Date(firstDay.setHours(0, 0, 0, 0));
      endDate = new Date();
    }
    else if (type === 'monthly') {
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  startDate = new Date(firstDay.setHours(0, 0, 0, 0));
  endDate = new Date();
}

    // ✅ CUSTOM
    else if (type === 'custom') {
      if (!from || !to) {
        return res.status(400).json({ error: "From & To required" });
      }

      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    }

    else {
      return res.status(400).json({ error: "Invalid type" });
    }

    // ✅ FETCH BILLS
    const bills = await Bill.find({
      transactionDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ transactionDate: -1 });

    // ✅ GRAND TOTALS
    let grandTotal = 0;
    let totalDiscount = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalItems = 0;

const formattedBills = bills.map(bill => {
  const itemCount = bill.items.reduce((sum, i) => sum + i.quantity, 0);

  grandTotal += bill.total || 0;
  totalDiscount += bill.discountAmount || 0;
  totalPaid += bill.paidAmount || 0;
  totalDue += bill.dueAmount || 0;
  totalItems += itemCount;

  return {
    _id: bill._id,   // ✅ ADD THIS LINE (VERY IMPORTANT)

    billNumber: bill.billNumber,
    date: bill.transactionDate,
    customer: bill.customer?.name,
    paymentMethod: bill.paymentMethod,

    itemCount,
    total: bill.total,
    discount: bill.discountAmount,

    paid: bill.paidAmount,
    due: bill.dueAmount,

    items: bill.items
  };
});

    res.json({
      success: true,
      count: bills.length,

      summary: {
        grandTotal,
        totalDiscount,
        totalPaid,
        totalDue,
        totalItems
      },

      bills: formattedBills
    });

  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

module.exports = router;