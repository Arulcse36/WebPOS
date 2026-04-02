const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Counter = require('../models/Counter');

// Helper function to round numbers to 2 decimal places
const roundToTwo = (num) => {
  if (num === undefined || num === null) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// 🔢 Generate next bill number
const getNextBillNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "bill" },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );

  return `BILL-${String(counter.seq).padStart(4, "0")}`;
};

// ✅ CREATE BILL
exports.createBill = async (req, res) => {
  try {
    let {
      items,
      discount,
      discountAmount,
      paymentMethod,
      paidAmount,
      dueAmount,
      cashPaid,
      upiPaid,
      total, 
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      billDate,
      notes
    } = req.body;

    console.log("Create bill payload:", req.body);
    
    if (!items || items.length === 0) {
      throw new Error("No items in the bill");
    }

    if (!paymentMethod) {
      throw new Error("Payment method is required");
    }

    // ✅ Check stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
    }

    // ✅ Prepare items with rounded values
    const billItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        const price = roundToTwo(item.price);
        const total = roundToTwo(price * item.quantity);
        
        return {
          productId: item.productId,
          name: item.productName || product.name,
          quantity: item.quantity,
          price: price,
          total: total
        };
      })
    );

    const subtotal = roundToTwo(billItems.reduce((sum, i) => sum + i.total, 0));
    const finalDiscountAmount = discountAmount 
      ? roundToTwo(discountAmount) 
      : roundToTwo((subtotal * (discount || 0)) / 100);
    const finalTotal = total 
      ? roundToTwo(total) 
      : roundToTwo(subtotal - finalDiscountAmount);
    const finalPaidAmount = roundToTwo(paidAmount || 0);
    const finalDueAmount = dueAmount !== undefined 
      ? roundToTwo(dueAmount) 
      : roundToTwo(finalTotal - finalPaidAmount);
    const finalCashPaid = roundToTwo(cashPaid || 0);
    const finalUpiPaid = roundToTwo(upiPaid || 0);

    // 👤 Customer
    let customerDetails = {
      customerId: null,
      name: customerName || "Walk-in Customer",
      phone: customerPhone || "",
      email: customerEmail || "",
      address: customerAddress || ""
    };

    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customerDetails = {
          customerId: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address
        };
      }
    }

    // 🔢 Generate Bill Number
    const billNumber = await getNextBillNumber();

    // 🧾 Create Bill with rounded values
    const bill = new Bill({
      billNumber,
      items: billItems,
      subtotal,
      discount: roundToTwo(discount || 0),
      discountAmount: finalDiscountAmount,
      total: finalTotal,
      paidAmount: finalPaidAmount,
      dueAmount: finalDueAmount,
      cashPaid: finalCashPaid,
      upiPaid: finalUpiPaid,
      paymentMethod: paymentMethod,
      customer: customerDetails,
      status: "completed",
      billDate: billDate ? new Date(billDate) : new Date(),
      notes: notes || ""
    });

    await bill.save();

    // 📦 Update stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // 💰 Update customer due
    if (customerId && bill.dueAmount > 0) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalDue: bill.dueAmount }
      });
    }

    res.status(201).json({
      success: true,
      message: "Bill created successfully",
      bill
    });

  } catch (error) {
    console.error("Create bill error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ UPDATE BILL (EDIT)
exports.updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      items,
      discount,
      discountAmount,
      paymentMethod,
      paidAmount,
      dueAmount,
      cashPaid,
      upiPaid,
      total,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      billDate,
      notes
    } = req.body;

    console.log("Update bill payload:", req.body);

    // Round incoming amounts
    discount = roundToTwo(discount);
    discountAmount = roundToTwo(discountAmount);
    paidAmount = roundToTwo(paidAmount);
    dueAmount = roundToTwo(dueAmount);
    cashPaid = roundToTwo(cashPaid);
    upiPaid = roundToTwo(upiPaid);
    total = roundToTwo(total);

    // Find existing bill
    const existingBill = await Bill.findById(id);
    if (!existingBill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    if (!items || items.length === 0) {
      throw new Error("No items in the bill");
    }

    if (!paymentMethod) {
      throw new Error("Payment method is required");
    }

    // 🔄 Calculate stock changes
    const oldItems = existingBill.items;
    const newItemsMap = new Map(items.map(item => [item.productId.toString(), item]));
    const oldItemsMap = new Map(oldItems.map(item => [item.productId.toString(), item]));

    // Check stock availability and calculate differences
    for (const newItem of items) {
      const product = await Product.findById(newItem.productId);
      if (!product) throw new Error(`Product not found: ${newItem.productId}`);

      const oldItem = oldItemsMap.get(newItem.productId.toString());
      const quantityDifference = newItem.quantity - (oldItem ? oldItem.quantity : 0);

      if (quantityDifference > 0 && product.stock < quantityDifference) {
        throw new Error(`Insufficient stock for ${product.name}. Need ${quantityDifference} more, only ${product.stock} available`);
      }
    }

    // ✅ Prepare updated items with rounded values
    const billItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        const price = roundToTwo(item.price);
        const total = roundToTwo(price * item.quantity);
        
        return {
          productId: item.productId,
          name: item.productName || product.name,
          quantity: item.quantity,
          price: price,
          total: total
        };
      })
    );

    const subtotal = roundToTwo(billItems.reduce((sum, i) => sum + i.total, 0));
    const finalDiscountAmount = discountAmount || roundToTwo((subtotal * (discount || 0)) / 100);
    const finalTotal = total || roundToTwo(subtotal - finalDiscountAmount);
    const finalPaidAmount = roundToTwo(paidAmount || 0);
    const finalDueAmount = dueAmount !== undefined ? dueAmount : roundToTwo(finalTotal - finalPaidAmount);
    const finalCashPaid = roundToTwo(cashPaid || 0);
    const finalUpiPaid = roundToTwo(upiPaid || 0);

    // 👤 Customer
    let customerDetails = {
      customerId: null,
      name: customerName || "Walk-in Customer",
      phone: customerPhone || "",
      email: customerEmail || "",
      address: customerAddress || ""
    };

    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customerDetails = {
          customerId: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address
        };
      }
    }

    // 📦 Update stock based on differences
    for (const newItem of items) {
      const oldItem = oldItemsMap.get(newItem.productId.toString());
      const quantityDifference = newItem.quantity - (oldItem ? oldItem.quantity : 0);

      if (quantityDifference !== 0) {
        await Product.findByIdAndUpdate(
          newItem.productId,
          { $inc: { stock: -quantityDifference } }
        );
      }
    }

    // Handle removed items (restore stock)
    for (const oldItem of oldItems) {
      if (!newItemsMap.has(oldItem.productId.toString())) {
        await Product.findByIdAndUpdate(
          oldItem.productId,
          { $inc: { stock: oldItem.quantity } }
        );
      }
    }

    // Update customer due
    const oldDueAmount = existingBill.dueAmount;
    if (customerId && finalDueAmount !== oldDueAmount) {
      const dueDifference = finalDueAmount - oldDueAmount;
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalDue: dueDifference }
      });
    }

    // 🧾 Update Bill
    const updatedBill = await Bill.findByIdAndUpdate(
      id,
      {
        items: billItems,
        subtotal,
        discount: roundToTwo(discount || 0),
        discountAmount: finalDiscountAmount,
        total: finalTotal,
        paidAmount: finalPaidAmount,
        dueAmount: finalDueAmount,
        cashPaid: finalCashPaid,
        upiPaid: finalUpiPaid,
        paymentMethod,
        customer: customerDetails,
        billDate: billDate ? new Date(billDate) : existingBill.billDate,
        notes: notes || existingBill.notes,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Bill updated successfully",
      bill: updatedBill
    });

  } catch (error) {
    console.error("Update bill error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ DELETE BILL
exports.deleteBill = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    // Restore stock
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }

    // Update customer due
    if (bill.customer.customerId && bill.dueAmount > 0) {
      await Customer.findByIdAndUpdate(
        bill.customer.customerId,
        { $inc: { totalDue: -bill.dueAmount } }
      );
    }

    // Delete the bill
    await Bill.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Bill deleted successfully"
    });

  } catch (error) {
    console.error("Delete bill error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ GET ALL BILLS
exports.getBills = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      paymentMethod,
      customerId,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    console.log("Get bills query:", req.query);

    if (startDate || endDate) {
      filter.billDate = {};
      if (startDate) filter.billDate.$gte = new Date(startDate);
      if (endDate) filter.billDate.$lte = new Date(endDate);
    }

    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (customerId) filter['customer.customerId'] = customerId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bills, total] = await Promise.all([
      Bill.find(filter)
        .sort({ billDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('customer.customerId', 'name phone email'),
      Bill.countDocuments(filter)
    ]);

    res.json({
      success: true,
      bills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get bills error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bills"
    });
  }
};

// ✅ GET BILL BY ID
exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer.customerId', 'name phone email address')
      .populate('items.productId', 'name sku stock retailRate');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    // Format the response for POS editing with rounded values
    const formattedBill = {
      _id: bill._id,
      billNumber: bill.billNumber,
      items: bill.items.map(item => ({
        productId: item.productId._id,
        productName: item.name,
        name: item.name,
        quantity: item.quantity,
        price: roundToTwo(item.price),
        total: roundToTwo(item.total)
      })),
      discount: roundToTwo(bill.discount),
      discountAmount: roundToTwo(bill.discountAmount),
      paymentMethod: bill.paymentMethod,
      paidAmount: roundToTwo(bill.paidAmount),
      dueAmount: roundToTwo(bill.dueAmount),
      cashPaid: roundToTwo(bill.cashPaid),
      upiPaid: roundToTwo(bill.upiPaid),
      total: roundToTwo(bill.total),
      customerId: bill.customer.customerId?._id || null,
      customerName: bill.customer.name,
      customerPhone: bill.customer.phone,
      customerEmail: bill.customer.email,
      customerAddress: bill.customer.address,
      billDate: bill.billDate,
      notes: bill.notes,
      status: bill.status,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt
    };

    console.log("Fetched bill:", formattedBill);

    res.json(formattedBill);

  } catch (error) {
    console.error("Get bill error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bill"
    });
  }
};

// ✅ GET BILL BY NUMBER
exports.getBillByNumber = async (req, res) => {
  try {
    const bill = await Bill.findOne({ billNumber: req.params.billNumber });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    res.json({
      success: true,
      bill
    });

  } catch (error) {
    console.error("Get bill error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bill"
    });
  }
};

// ✅ CANCEL BILL
exports.cancelBill = async (req, res) => {
  try {
    const { reason } = req.body;

    const bill = await Bill.findById(req.params.id);

    if (!bill) throw new Error("Bill not found");
    if (bill.status === "cancelled") throw new Error("Already cancelled");

    // Restore stock
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }

    // Update customer due
    if (bill.customer.customerId && bill.dueAmount > 0) {
      await Customer.findByIdAndUpdate(
        bill.customer.customerId,
        { $inc: { totalDue: -bill.dueAmount } }
      );
    }

    bill.status = "cancelled";
    bill.notes = reason || bill.notes;
    bill.cancelledAt = new Date();

    await bill.save();

    res.json({
      success: true,
      message: "Bill cancelled successfully",
      bill
    });

  } catch (error) {
    console.error("Cancel bill error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ RECORD PAYMENT (Payment History Only - No updates to paid amounts)
exports.recordPayment = async (req, res) => {
  try {
    let { amount, paymentMethod, transactionId, notes } = req.body;
    const { id } = req.params;

    // Round the amount
    amount = roundToTwo(amount);

    const bill = await Bill.findById(id);

    if (!bill) throw new Error("Bill not found");
    if (bill.status === "cancelled") throw new Error("Cannot pay cancelled bill");

    if (amount > bill.dueAmount) {
      throw new Error(`Amount exceeds due. Due amount: ₹${bill.dueAmount}`);
    }

    // Create payment record with rounded amount
    const paymentRecord = {
      amount: amount,
      paymentMethod: paymentMethod,
      date: new Date(),
      transactionId: transactionId || null,
      notes: notes || `Payment of ₹${amount} via ${paymentMethod}`,
      recordedBy: req.user?.name || 'system'
    };

    // ✅ ONLY add to payment history
    if (!bill.paymentHistory) {
      bill.paymentHistory = [];
    }
    bill.paymentHistory.push(paymentRecord);

    bill.updatedAt = new Date();
    await bill.save();

    res.json({
      success: true,
      message: "Payment recorded successfully in payment history",
      bill: {
        _id: bill._id,
        billNumber: bill.billNumber,
        paidAmount: roundToTwo(bill.paidAmount),
        dueAmount: roundToTwo(bill.dueAmount),
        paymentMethod: bill.paymentMethod,
        paymentHistory: bill.paymentHistory
      }
    });

  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ GET PAYMENT HISTORY
exports.getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("Fetching payment history for bill:", id);
    
    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }
    
    // Calculate totals from payment history with rounding
    const totalFromHistory = (bill.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);
    const originalPaid = roundToTwo(bill.paidAmount || 0);
    const totalPaidCombined = roundToTwo(originalPaid + totalFromHistory);
    const remainingDue = roundToTwo(Math.max(0, bill.total - totalPaidCombined));
    
    console.log("Payment history details:", {
      totalFromHistory: roundToTwo(totalFromHistory),
      originalPaid,
      totalPaidCombined,
      remainingDue,
      historyCount: (bill.paymentHistory || []).length
    });
    
    res.json({
      success: true,
      paymentHistory: (bill.paymentHistory || []).map(p => ({
        ...p.toObject(),
        amount: roundToTwo(p.amount)
      })),
      bill: {
        billNumber: bill.billNumber,
        total: roundToTwo(bill.total),
        originalPaidAmount: originalPaid,
        originalDueAmount: roundToTwo(bill.dueAmount),
        totalFromHistory: roundToTwo(totalFromHistory),
        totalPaid: totalPaidCombined,
        remainingDue: remainingDue
      }
    });
    
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history"
    });
  }
};

// ✅ GET REPORT (for Reports page)
exports.getReport = async (req, res) => {
  try {
    const { type, from, to } = req.query;
    let startDate, endDate;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (type) {
      case 'daily':
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (!from || !to) {
          return res.status(400).json({
            success: false,
            message: "From and To dates are required for custom report"
          });
        }
        startDate = new Date(from);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
    }

    const bills = await Bill.find({
      billDate: { $gte: startDate, $lte: endDate },
      status: "completed"
    }).sort({ billDate: -1 });

    // Calculate summary with rounding
    const summary = bills.reduce((acc, bill) => {
      acc.grandTotal += bill.total;
      acc.totalPaid += bill.paidAmount;
      acc.totalDue += bill.dueAmount;
      return acc;
    }, { grandTotal: 0, totalPaid: 0, totalDue: 0 });

    // Round summary values
    summary.grandTotal = roundToTwo(summary.grandTotal);
    summary.totalPaid = roundToTwo(summary.totalPaid);
    summary.totalDue = roundToTwo(summary.totalDue);

    res.json({
      success: true,
      bills: bills.map(bill => ({
        _id: bill._id,
        id: bill._id,
        billNumber: bill.billNumber,
        date: bill.billDate,
        customer: bill.customer.name,
        total: roundToTwo(bill.total),
        paid: roundToTwo(bill.paidAmount),
        due: roundToTwo(bill.dueAmount),
        paymentMethod: bill.paymentMethod,
        items: bill.items.map(item => ({
          ...item.toObject(),
          price: roundToTwo(item.price),
          total: roundToTwo(item.total)
        })),
        subtotal: roundToTwo(bill.subtotal),
        discount: roundToTwo(bill.discount),
        discountAmount: roundToTwo(bill.discountAmount),
        cashPaid: roundToTwo(bill.cashPaid),
        upiPaid: roundToTwo(bill.upiPaid)
      })),
      summary
    });

    console.log(`Generated ${type} report from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report"
    });
  }
};

// Add this to your existing billController.js

// ✅ UPDATE PRINT STATUS
exports.updatePrintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { printed, printCount } = req.body;
    
    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }
    
    bill.printed = printed !== undefined ? printed : bill.printed;
    bill.printedAt = printed ? new Date() : bill.printedAt;
    bill.printCount = (bill.printCount || 0) + (printCount || 1);
    
    await bill.save();
    
    res.json({
      success: true,
      message: "Print status updated",
      bill
    });
  } catch (error) {
    console.error("Update print status error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ EMAIL BILL
exports.emailBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, pdfBase64, billNumber } = req.body;
    
    // Here you would integrate with a email service like nodemailer
    // For now, just return success
    
    res.json({
      success: true,
      message: `Bill ${billNumber} sent to ${email}`
    });
  } catch (error) {
    console.error("Email bill error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};