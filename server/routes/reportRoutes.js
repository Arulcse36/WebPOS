const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const mongoose = require('mongoose');

// 📄 INDIVIDUAL BILL REPORT with customer filter and company filter
router.get('/bills', async (req, res) => {
  try {
    const { type, from, to, customer, companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        error: "Company ID required" 
      });
    }

    let startDate, endDate;
    const now = new Date();

    if (type === 'daily') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (type === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (type === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (type === 'custom') {
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
    } else {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid type. Use: daily, weekly, monthly, or custom" 
      });
    }

    let query = {
      companyId: companyId,
      billDate: { $gte: startDate, $lte: endDate }
    };

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

    console.log(`Fetching ${type} report from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const bills = await Bill.find(query).sort({ billDate: -1 });

    let grandTotal = 0;
    let totalDiscount = 0;
    let totalPaidFromBill = 0;
    let totalPaidFromHistory = 0;
    let totalCombinedPaid = 0;
    let totalCombinedDue = 0;
    let totalItems = 0;

    const formattedBills = bills.map(bill => {
      const itemCount = bill.items.reduce((sum, i) => sum + i.quantity, 0);
      const paidFromHistory = (bill.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);
      const combinedPaid = (bill.paidAmount || 0) + paidFromHistory;
      const combinedDue = Math.max(0, (bill.total || 0) - combinedPaid);

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
        paidOriginal: bill.paidAmount,
        dueOriginal: bill.dueAmount,
        paidFromHistory: paidFromHistory,
        paid: combinedPaid,
        due: combinedDue,
        items: bill.items,
        subtotal: bill.subtotal,
        discountPercent: bill.discount,
        cashPaid: bill.cashPaid,
        upiPaid: bill.upiPaid,
        status: bill.status,
        paymentHistory: bill.paymentHistory
      };
    });

    res.json({
      success: true,
      count: bills.length,
      filter: customer || 'All Customers',
      summary: {
        grandTotal,
        totalDiscount,
        totalPaidFromBill,
        totalPaidFromHistory,
        totalPaid: totalCombinedPaid,
        totalDue: totalCombinedDue,
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

// ✅ Simplified: Get Today's Cash and UPI Collection
router.get('/today-collection', async (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        error: "Company ID required" 
      });
    }
    
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const bills = await Bill.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      billDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });
    
    let totalCash = 0;
    let totalUpi = 0;
    
    bills.forEach(bill => {
      // Cash Bill Sales
      if (bill.paymentMethod === 'cash') {
        totalCash += bill.paidAmount || 0;
      }
      // UPI Bill Sales
      else if (bill.paymentMethod === 'upi') {
        totalUpi += bill.paidAmount || 0;
      }
      // Mixed Bill
      else if (bill.paymentMethod === 'mixed') {
        totalCash += bill.cashPaid || 0;
        totalUpi += bill.upiPaid || 0;
      }
      // Credit Bill - Check payment history
      else if (bill.paymentMethod === 'credit') {
        if (bill.paymentHistory && bill.paymentHistory.length > 0) {
          bill.paymentHistory.forEach(payment => {
            if (payment.paymentMethod === 'cash') {
              totalCash += payment.amount;
            } else if (payment.paymentMethod === 'upi') {
              totalUpi += payment.amount;
            }
          });
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        cash: totalCash,
        upi: totalUpi,
        total: totalCash + totalUpi,
        billCount: bills.length
      }
    });
    
  } catch (error) {
    console.error("Today's collection error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// ✅ NEW API: Get Collection by Date Range
router.get('/collection-by-date', async (req, res) => {
  try {
    const { companyId, from, to } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        error: "Company ID required" 
      });
    }
    
    let startDate, endDate;
    
    if (from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to today
      const today = new Date();
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    }
    
    const bills = await Bill.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      billDate: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    });
    
    let totalCash = 0;
    let totalUpi = 0;
    let totalCredit = 0;
    let totalMixed = 0;
    let totalCard = 0;
    let dailyBreakdown = {};
    
    bills.forEach(bill => {
      const dateKey = bill.billDate.toISOString().split('T')[0];
      
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = {
          date: dateKey,
          cash: 0,
          upi: 0,
          credit: 0,
          mixed: 0,
          card: 0,
          total: 0
        };
      }
      
      const paidFromHistory = (bill.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);
      
      switch (bill.paymentMethod) {
        case 'cash':
          totalCash += (bill.paidAmount || 0) + paidFromHistory;
          dailyBreakdown[dateKey].cash += (bill.paidAmount || 0) + paidFromHistory;
          break;
        case 'upi':
          totalUpi += (bill.paidAmount || 0) + paidFromHistory;
          dailyBreakdown[dateKey].upi += (bill.paidAmount || 0) + paidFromHistory;
          break;
        case 'credit':
          totalCredit += (bill.paidAmount || 0) + paidFromHistory;
          dailyBreakdown[dateKey].credit += (bill.paidAmount || 0) + paidFromHistory;
          break;
        case 'mixed':
          totalMixed += (bill.paidAmount || 0) + paidFromHistory;
          dailyBreakdown[dateKey].mixed += (bill.paidAmount || 0) + paidFromHistory;
          totalCash += bill.cashPaid || 0;
          totalUpi += bill.upiPaid || 0;
          dailyBreakdown[dateKey].cash += bill.cashPaid || 0;
          dailyBreakdown[dateKey].upi += bill.upiPaid || 0;
          break;
        case 'card':
          totalCard += (bill.paidAmount || 0) + paidFromHistory;
          dailyBreakdown[dateKey].card += (bill.paidAmount || 0) + paidFromHistory;
          break;
        default:
          totalCash += (bill.paidAmount || 0) + paidFromHistory;
          dailyBreakdown[dateKey].cash += (bill.paidAmount || 0) + paidFromHistory;
          break;
      }
      
      dailyBreakdown[dateKey].total += (bill.paidAmount || 0) + paidFromHistory;
    });
    
    const totalCollection = totalCash + totalUpi + totalCredit + totalMixed + totalCard;
    
    res.json({
      success: true,
      dateRange: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0]
      },
      summary: {
        totalCollection,
        cash: totalCash,
        upi: totalUpi,
        credit: totalCredit,
        mixed: totalMixed,
        card: totalCard,
        billCount: bills.length
      },
      dailyBreakdown: Object.values(dailyBreakdown)
    });
    
  } catch (error) {
    console.error("Collection by date error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ NEW API: Get Category Breakdown Report
router.get('/category-breakdown', async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        error: "Company ID required" 
      });
    }

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        billDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const bills = await Bill.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          ...dateFilter
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$category.name", "Uncategorized"] },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          quantity: { $sum: "$items.quantity" },
          billCount: { $addToSet: "$_id" }
        }
      },
      {
        $project: {
          name: "$_id",
          revenue: 1,
          quantity: 1,
          billCount: { $size: "$billCount" },
          percentage: {
            $multiply: [
              { $divide: ["$revenue", { $sum: "$revenue" }] },
              100
            ]
          }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({
      success: true,
      categories: bills,
      totalCategories: bills.length
    });

  } catch (error) {
    console.error("Category breakdown error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ NEW API: Get Brand Breakdown Report
router.get('/brand-breakdown', async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        error: "Company ID required" 
      });
    }

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        billDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const bills = await Bill.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          ...dateFilter
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "brands",
          localField: "product.brand",
          foreignField: "_id",
          as: "brand"
        }
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$brand.name", "Unbranded"] },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          quantity: { $sum: "$items.quantity" },
          billCount: { $addToSet: "$_id" }
        }
      },
      {
        $project: {
          name: "$_id",
          revenue: 1,
          quantity: 1,
          billCount: { $size: "$billCount" },
          percentage: {
            $multiply: [
              { $divide: ["$revenue", { $sum: "$revenue" }] },
              100
            ]
          }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({
      success: true,
      brands: bills,
      totalBrands: bills.length
    });

  } catch (error) {
    console.error("Brand breakdown error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ NEW API: Get Combined Category & Brand Dashboard Data
router.get('/dashboard-analytics', async (req, res) => {
  try {
    const { companyId, period, from, to } = req.query;

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        error: "Company ID required" 
      });
    }

    let startDate, endDate;
    const now = new Date();

    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'custom') {
      if (!from || !to) {
        return res.status(400).json({ 
          success: false, 
          error: "From and To dates required for custom period" 
        });
      }
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid period. Use: daily, weekly, monthly, or custom" 
      });
    }

    const dateFilter = {
      billDate: { $gte: startDate, $lte: endDate }
    };

    // Get category breakdown
    const categoryData = await Bill.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          ...dateFilter
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$category.name", "Uncategorized"] },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          quantity: { $sum: "$items.quantity" }
        }
      },
      {
        $project: {
          name: "$_id",
          revenue: 1,
          quantity: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 6 }
    ]);

    // Get brand breakdown
    const brandData = await Bill.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          ...dateFilter
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "brands",
          localField: "product.brand",
          foreignField: "_id",
          as: "brand"
        }
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$brand.name", "Unbranded"] },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          quantity: { $sum: "$items.quantity" }
        }
      },
      {
        $project: {
          name: "$_id",
          revenue: 1,
          quantity: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 6 }
    ]);

    // Get top products
    const topProducts = await Bill.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          ...dateFilter
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$items.name",
          productId: { $first: "$items.productId" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          quantity: { $sum: "$items.quantity" }
        }
      },
      {
        $project: {
          name: "$_id",
          revenue: 1,
          quantity: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Get daily sales trend
    const dailyTrends = await Bill.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%d-%b", date: "$billDate" }
          },
          total: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id",
          total: 1,
          count: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      period,
      dateRange: {
        from: startDate,
        to: endDate
      },
      categories: categoryData,
      brands: brandData,
      topProducts,
      dailyTrends
    });

  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ NEW API: Get Top Selling Products by Category
router.get('/top-products-by-category', async (req, res) => {
  try {
    const { companyId, category, limit = 10 } = req.query;

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        error: "Company ID required" 
      });
    }

    const matchStage = {
      companyId: new mongoose.Types.ObjectId(companyId)
    };

    const pipeline = [
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } }
    ];

    // Add category filter if specified
    if (category && category !== 'All') {
      pipeline.push({
        $match: { "category.name": category }
      });
    }

    pipeline.push(
      {
        $group: {
          _id: "$items.name",
          productId: { $first: "$items.productId" },
          category: { $first: "$category.name" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          quantity: { $sum: "$items.quantity" }
        }
      },
      {
        $project: {
          name: "$_id",
          category: { $ifNull: ["$category", "Uncategorized"] },
          revenue: 1,
          quantity: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: parseInt(limit) }
    );

    const topProducts = await Bill.aggregate(pipeline);

    res.json({
      success: true,
      category: category || 'All',
      products: topProducts,
      totalProducts: topProducts.length
    });

  } catch (error) {
    console.error("Top products by category error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ Get customer report summary (for dashboard)
router.get('/customer-summary', async (req, res) => {
  try {
    const { customer, companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        error: "Company ID required" 
      });
    }
    
    let query = { companyId: companyId };
    
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