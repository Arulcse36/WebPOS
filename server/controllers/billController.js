// controllers/billController.js
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Counter = require('../models/Counter');
const Company = require('../models/Company');
const Barcode = require('../models/Barcode');

// Helper function to round numbers to 2 decimal places
const roundToTwo = (num) => {
  if (num === undefined || num === null) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// 🔢 Generate next bill number for specific company
const getNextBillNumber = async (companyId) => {
  const company = await Company.findById(companyId);

  if (!company) {
    throw new Error(`Company not found with ID: ${companyId}`);
  }

  if (!company.companyName) {
    throw new Error(`Company name is missing for company ID: ${companyId}`);
  }

  const counter = await Counter.findOneAndUpdate(
    {
      companyId: companyId,
      name: `bill_${companyId}`
    },
    { $inc: { seq: 1 } },
    {
      returnDocument: "after",
      upsert: true,
      new: true
    }
  );

  return `${company.companyName}-${String(counter.seq).padStart(4, "0")}`;
};

// Helper function to get barcode details
const getBarcodeDetails = async (barcodeId, companyId) => {
  if (!barcodeId) return null;
  
  try {
    const barcode = await Barcode.findOne({ 
      _id: barcodeId, 
      companyId,
      isActive: true
    });
    
    if (!barcode) return null;
    
    return {
      barcodeId: barcode._id,
      barcode: barcode.barcode,
      expiryDate: barcode.expiryDate,
      mrp: barcode.mrp,
      retailRate: barcode.retailRate,
      wholesaleRate: barcode.wholesaleRate
    };
  } catch (error) {
    console.error('Error fetching barcode details:', error);
    return null;
  }
};

// ✅ CREATE BILL
exports.createBill = async (req, res) => {
  try {
    let {
      companyId,
      items,
      discount,
      discountAmount,
      paymentMethod,
      paidAmount,
      dueAmount,
      returnAmount,
      cashPaid,
      upiPaid,
      total,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      billDate,
      notes,
      rateType    
    } = req.body;

    console.log("Create bill payload:", req.body);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    if (!items || items.length === 0) {
      throw new Error("No items in the bill");
    }

    if (!paymentMethod) {
      throw new Error("Payment method is required");
    }

    // ✅ Check stock and validate barcodes
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, companyId });
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      // Check if product has stock field
      if (product.stock !== undefined && product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }

      // If barcodeId is provided, validate it
      if (item.barcodeId) {
        const barcode = await Barcode.findOne({ 
          _id: item.barcodeId, 
          companyId,
          productId: item.productId,
          isActive: true
        });
        if (!barcode) {
          throw new Error(`Invalid barcode for product ${product.name}`);
        }
      }
    }

    // ✅ Prepare items with rounded values and barcode info
    const billItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findOne({ _id: item.productId, companyId });
        const price = roundToTwo(item.price);
        const total = roundToTwo(price * item.quantity);

        // Get barcode details if provided
        let barcodeInfo = null;
        if (item.barcodeId) {
          barcodeInfo = await getBarcodeDetails(item.barcodeId, companyId);
        }

        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: price,
          total: total,
          barcode: item.barcode || null,
          barcodeId: item.barcodeId || null,
          barcodeDetails: barcodeInfo
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
    
    let finalPaidAmount = roundToTwo(paidAmount || 0);
    let finalCashPaid = roundToTwo(cashPaid || 0);
    let finalUpiPaid = roundToTwo(upiPaid || 0);
    
    const finalReturnAmount = returnAmount !== undefined
      ? roundToTwo(returnAmount)
      : finalPaidAmount > finalTotal ? roundToTwo(finalPaidAmount - finalTotal) : 0;
    
    if (finalReturnAmount > 0) {
      finalPaidAmount = roundToTwo(finalPaidAmount - finalReturnAmount);
      
      if (paymentMethod === 'cash') {
        finalCashPaid = roundToTwo(finalCashPaid - finalReturnAmount);
      } 
      else if (paymentMethod === 'upi') {
        finalUpiPaid = roundToTwo(finalUpiPaid - finalReturnAmount);
      }
      else if (paymentMethod === 'credit') {
        if (finalCashPaid >= finalReturnAmount) {
          finalCashPaid = roundToTwo(finalCashPaid - finalReturnAmount);
        } else {
          const remainingReturn = roundToTwo(finalReturnAmount - finalCashPaid);
          finalCashPaid = 0;
          finalUpiPaid = roundToTwo(finalUpiPaid - remainingReturn);
        }
      }
    }
    
    finalPaidAmount = Math.max(0, finalPaidAmount);
    finalCashPaid = Math.max(0, finalCashPaid);
    finalUpiPaid = Math.max(0, finalUpiPaid);
    
    const finalDueAmount = dueAmount !== undefined
      ? roundToTwo(dueAmount)
      : roundToTwo(finalTotal - finalPaidAmount);

    // 👤 Customer
    let customerDetails = {
      customerId: null,
      name: customerName || "Walk-in Customer",
      phone: customerPhone || "",
      email: customerEmail || "",
      address: customerAddress || ""
    };

    if (customerId) {
      const customer = await Customer.findOne({ _id: customerId, companyId });
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

    const billNumber = await getNextBillNumber(companyId);
    
    const bill = new Bill({
      companyId,
      billNumber,
      items: billItems,
      subtotal,
      rateType: rateType || 'retail',
      discount: roundToTwo(discount || 0),
      discountAmount: finalDiscountAmount,
      total: finalTotal,
      paidAmount: finalPaidAmount,
      dueAmount: finalDueAmount,
      returnAmount: finalReturnAmount,
      cashPaid: finalCashPaid,
      upiPaid: finalUpiPaid,
      paymentMethod: paymentMethod,
      customer: customerDetails,
      status: finalDueAmount === 0 ? "completed" : "pending",
      billDate: billDate ? new Date(billDate) : new Date(),
      notes: notes || ""
    });

    await bill.save();

    // 📦 Update stock
    for (const item of items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, companyId },
        { $inc: { stock: -item.quantity } }
      );
    }

    // 💰 Update customer due
    if (customerId && bill.dueAmount > 0) {
      await Customer.findOneAndUpdate(
        { _id: customerId, companyId },
        { $inc: { totalDue: bill.dueAmount } }
      );
    }

    res.status(201).json({
      success: true,
      message: "Bill created successfully",
      bill: {
        ...bill.toObject(),
        returnAmount: finalReturnAmount,
        paidAmount: finalPaidAmount,
        cashPaid: finalCashPaid,
        upiPaid: finalUpiPaid
      }
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
    const { companyId } = req.query;
    let {
      items,
      discount,
      discountAmount,
      paymentMethod,
      paidAmount,
      dueAmount,
      returnAmount,
      cashPaid,
      upiPaid,
      total,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      billDate,
      rateType,
      notes
    } = req.body;

    console.log("Update bill payload:", req.body);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    console.log(`Updating bill with ID: ${id} for company: ${companyId}`);

    discount = roundToTwo(discount);
    discountAmount = roundToTwo(discountAmount);
    paidAmount = roundToTwo(paidAmount);
    dueAmount = roundToTwo(dueAmount);
    returnAmount = roundToTwo(returnAmount);
    cashPaid = roundToTwo(cashPaid);
    upiPaid = roundToTwo(upiPaid);
    total = roundToTwo(total);

    const existingBill = await Bill.findOne({ _id: id, companyId });
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

    // Check stock availability and validate barcodes
    for (const newItem of items) {
      const product = await Product.findOne({ _id: newItem.productId, companyId });
      if (!product) throw new Error(`Product not found: ${newItem.productId}`);

      const oldItem = oldItemsMap.get(newItem.productId.toString());
      const quantityDifference = newItem.quantity - (oldItem ? oldItem.quantity : 0);

      if (quantityDifference > 0 && product.stock < quantityDifference) {
        throw new Error(`Insufficient stock for ${product.name}. Need ${quantityDifference} more, only ${product.stock} available`);
      }

      // Validate barcode if provided
      if (newItem.barcodeId) {
        const barcode = await Barcode.findOne({ 
          _id: newItem.barcodeId, 
          companyId,
          productId: newItem.productId,
          isActive: true
        });
        if (!barcode) {
          throw new Error(`Invalid barcode for product ${product.name}`);
        }
      }
    }

    // ✅ Prepare updated items with rounded values and barcode info
    const billItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findOne({ _id: item.productId, companyId });
        const price = roundToTwo(item.price);
        const total = roundToTwo(price * item.quantity);

        let barcodeInfo = null;
        if (item.barcodeId) {
          barcodeInfo = await getBarcodeDetails(item.barcodeId, companyId);
        }

        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: price,
          total: total,
          barcode: item.barcode || null,
          barcodeId: item.barcodeId || null,
          barcodeDetails: barcodeInfo
        };
      })
    );

    const subtotal = roundToTwo(billItems.reduce((sum, i) => sum + i.total, 0));
    const finalDiscountAmount = discountAmount || roundToTwo((subtotal * (discount || 0)) / 100);
    const finalTotal = total || roundToTwo(subtotal - finalDiscountAmount);
    
    let finalPaidAmount = roundToTwo(paidAmount || 0);
    let finalCashPaid = roundToTwo(cashPaid || 0);
    let finalUpiPaid = roundToTwo(upiPaid || 0);
    
    const finalReturnAmount = returnAmount !== undefined
      ? roundToTwo(returnAmount)
      : paidAmount > finalTotal ? roundToTwo(paidAmount - finalTotal) : 0;
    
    if (finalReturnAmount > 0) {
      finalPaidAmount = roundToTwo(finalPaidAmount - finalReturnAmount);
      
      if (paymentMethod === 'cash') {
        finalCashPaid = roundToTwo(finalCashPaid - finalReturnAmount);
      } 
      else if (paymentMethod === 'upi') {
        finalUpiPaid = roundToTwo(finalUpiPaid - finalReturnAmount);
      }
      else if (paymentMethod === 'credit') {
        if (finalCashPaid >= finalReturnAmount) {
          finalCashPaid = roundToTwo(finalCashPaid - finalReturnAmount);
        } else {
          const remainingReturn = roundToTwo(finalReturnAmount - finalCashPaid);
          finalCashPaid = 0;
          finalUpiPaid = roundToTwo(finalUpiPaid - remainingReturn);
        }
      }
    }
    
    finalPaidAmount = Math.max(0, finalPaidAmount);
    finalCashPaid = Math.max(0, finalCashPaid);
    finalUpiPaid = Math.max(0, finalUpiPaid);
    
    let finalDueAmount = dueAmount !== undefined
      ? roundToTwo(dueAmount)
      : roundToTwo(finalTotal - finalPaidAmount);
    
    finalDueAmount = Math.max(0, finalDueAmount);

    // 👤 Customer
    let customerDetails = {
      customerId: null,
      name: customerName || "Walk-in Customer",
      phone: customerPhone || "",
      email: customerEmail || "",
      address: customerAddress || ""
    };

    if (customerId) {
      const customer = await Customer.findOne({ _id: customerId, companyId });
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
        await Product.findOneAndUpdate(
          { _id: newItem.productId, companyId },
          { $inc: { stock: -quantityDifference } }
        );
      }
    }

    // Handle removed items (restore stock)
    for (const oldItem of oldItems) {
      if (!newItemsMap.has(oldItem.productId.toString())) {
        await Product.findOneAndUpdate(
          { _id: oldItem.productId, companyId },
          { $inc: { stock: oldItem.quantity } }
        );
      }
    }

    // Update customer due
    const oldDueAmount = existingBill.dueAmount || 0;
    if (customerId && finalDueAmount !== oldDueAmount) {
      const dueDifference = finalDueAmount - oldDueAmount;
      await Customer.findOneAndUpdate(
        { _id: customerId, companyId },
        { $inc: { totalDue: dueDifference } }
      );
    }

    // 🧾 Update Bill
    const updatedBill = await Bill.findOneAndUpdate(
      { _id: id, companyId },
      {
        items: billItems,
        subtotal,
        discount: roundToTwo(discount || 0),
        discountAmount: finalDiscountAmount,
        total: finalTotal,
        paidAmount: finalPaidAmount,
        dueAmount: finalDueAmount,
        returnAmount: finalReturnAmount,
        cashPaid: finalCashPaid,
        upiPaid: finalUpiPaid,
        rateType: rateType || existingBill.rateType,
        paymentMethod,
        customer: customerDetails,
        billDate: billDate ? new Date(billDate) : existingBill.billDate,
        notes: notes || existingBill.notes,
        status: finalDueAmount === 0 ? "completed" : "pending",
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
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    const bill = await Bill.findOne({ _id: id, companyId });
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    // Restore stock
    for (const item of bill.items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, companyId },
        { $inc: { stock: item.quantity } }
      );
    }

    // Update customer due
    if (bill.customer.customerId && bill.dueAmount > 0) {
      await Customer.findOneAndUpdate(
        { _id: bill.customer.customerId, companyId },
        { $inc: { totalDue: -bill.dueAmount } }
      );
    }

    // Delete the bill
    await Bill.findOneAndDelete({ _id: id, companyId });

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
      companyId,
      startDate,
      endDate,
      status,
      paymentMethod,
      customerId,
      page = 1,
      limit = 20
    } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    const filter = { companyId };

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
    const { id } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    console.log(`Fetching bill with ID: ${id} for company: ${companyId}`);

    const bill = await Bill.findOne({ _id: id, companyId })
      .populate('customer.customerId', 'name phone email address')
      .populate('items.productId', 'name sku stock retailRate');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    // Format the response with barcode info
    const formattedBill = {
      _id: bill._id,
      billNumber: bill.billNumber,
      items: bill.items.map(item => ({
        productId: item.productId._id,
        productName: item.productName,
        quantity: item.quantity,
        price: roundToTwo(item.price),
        total: roundToTwo(item.total),
        barcode: item.barcode || null,
        barcodeId: item.barcodeId || null,
        barcodeDetails: item.barcodeDetails || null
      })),
      discount: roundToTwo(bill.discount),
      discountAmount: roundToTwo(bill.discountAmount),
      paymentMethod: bill.paymentMethod,
      paidAmount: roundToTwo(bill.paidAmount),
      dueAmount: roundToTwo(bill.dueAmount),
      cashPaid: roundToTwo(bill.cashPaid),
      returnAmount: roundToTwo(bill.returnAmount),
      rateType: bill.rateType,
      upiPaid: roundToTwo(bill.upiPaid),
      total: roundToTwo(bill.total),
      customerId: bill.customer.customerId?._id || null,
      customerName: bill.customer.name,
      customerPhone: bill.customer.phone,
      customerEmail: bill.customer.email,
      customerAddress: bill.customer.address,
      billDate: bill.billDate,
      salesType: bill.rateType,
      notes: bill.notes,
      status: bill.status,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt
    };

    console.log("Fetched bill with barcode info:", formattedBill);

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
    const { billNumber } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    const bill = await Bill.findOne({ billNumber, companyId });

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
    const { id } = req.params;
    const { companyId } = req.query;
    const { reason } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    const bill = await Bill.findOne({ _id: id, companyId });

    if (!bill) throw new Error("Bill not found");
    if (bill.status === "cancelled") throw new Error("Already cancelled");

    // Restore stock
    for (const item of bill.items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, companyId },
        { $inc: { stock: item.quantity } }
      );
    }

    // Update customer due
    if (bill.customer.customerId && bill.dueAmount > 0) {
      await Customer.findOneAndUpdate(
        { _id: bill.customer.customerId, companyId },
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

// ✅ RECORD PAYMENT
exports.recordPayment = async (req, res) => {
  try {
    let { amount, paymentMethod, transactionId, notes } = req.body;
    const { id } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    amount = roundToTwo(amount);

    const bill = await Bill.findOne({ _id: id, companyId });

    if (!bill) throw new Error("Bill not found");
    if (bill.status === "cancelled") throw new Error("Cannot pay cancelled bill");

    if (amount > bill.dueAmount) {
      throw new Error(`Amount exceeds due. Due amount: ₹${bill.dueAmount}`);
    }

    const paymentRecord = {
      amount: amount,
      paymentMethod: paymentMethod,
      date: new Date(),
      transactionId: transactionId || null,
      notes: notes || `Payment of ₹${amount} via ${paymentMethod}`,
      recordedBy: req.user?.name || 'system'
    };

    if (!bill.paymentHistory) {
      bill.paymentHistory = [];
    }
    bill.paymentHistory.push(paymentRecord);

    // Update paid amount and due amount
    bill.paidAmount = roundToTwo((bill.paidAmount || 0) + amount);
    bill.dueAmount = roundToTwo(Math.max(0, (bill.dueAmount || 0) - amount));
    
    // If due amount is 0, mark as completed
    if (bill.dueAmount === 0) {
      bill.status = "completed";
    }

    bill.updatedAt = new Date();
    await bill.save();

    res.json({
      success: true,
      message: "Payment recorded successfully",
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

// ✅ DELETE PAYMENT
exports.deletePayment = async (req, res) => {
  try {
    const { id, paymentIndex } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    const bill = await Bill.findOne({ _id: id, companyId });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    const index = parseInt(paymentIndex);
    if (isNaN(index) || index < 0 || index >= bill.paymentHistory.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment index"
      });
    }

    // Remove the payment
    const deletedPayment = bill.paymentHistory[index];
    bill.paymentHistory.splice(index, 1);

    // Update paid amount and due amount
    bill.paidAmount = roundToTwo(Math.max(0, (bill.paidAmount || 0) - deletedPayment.amount));
    bill.dueAmount = roundToTwo((bill.dueAmount || 0) + deletedPayment.amount);
    
    // Update status if needed
    if (bill.dueAmount > 0) {
      bill.status = "pending";
    }

    await bill.save();

    console.log(`Payment deleted successfully: ${deletedPayment.amount} from bill ${bill.billNumber}`);

    res.json({
      success: true,
      message: "Payment deleted successfully",
      bill: {
        _id: bill._id,
        billNumber: bill.billNumber,
        paidAmount: roundToTwo(bill.paidAmount),
        dueAmount: roundToTwo(bill.dueAmount),
        paymentHistory: bill.paymentHistory
      }
    });

  } catch (error) {
    console.error("Delete payment error:", error);
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
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    const bill = await Bill.findOne({ _id: id, companyId });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    res.json({
      success: true,
      paymentHistory: (bill.paymentHistory || []).map((p, idx) => ({
        ...p.toObject(),
        amount: roundToTwo(p.amount),
        index: idx
      })),
      bill: {
        billNumber: bill.billNumber,
        total: roundToTwo(bill.total),
        paidAmount: roundToTwo(bill.paidAmount),
        dueAmount: roundToTwo(bill.dueAmount)
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

// ✅ GET REPORT
exports.getReport = async (req, res) => {
  try {
    const { type, from, to, companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

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
      companyId,
      billDate: { $gte: startDate, $lte: endDate },
      status: "completed"
    }).sort({ billDate: -1 });

    const summary = bills.reduce((acc, bill) => {
      acc.grandTotal += bill.total;
      acc.totalPaid += bill.paidAmount;
      acc.totalDue += bill.dueAmount;
      return acc;
    }, { grandTotal: 0, totalPaid: 0, totalDue: 0 });

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
          total: roundToTwo(item.total),
          barcode: item.barcode || null,
          barcodeId: item.barcodeId || null
        })),
        subtotal: roundToTwo(bill.subtotal),
        discount: roundToTwo(bill.discount),
        discountAmount: roundToTwo(bill.discountAmount),
        cashPaid: roundToTwo(bill.cashPaid),
        upiPaid: roundToTwo(bill.upiPaid)
      })),
      summary
    });

  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report"
    });
  }
};

// ✅ UPDATE PRINT STATUS
exports.updatePrintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.query;
    const { printed, printCount } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    const bill = await Bill.findOne({ _id: id, companyId });
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
    const { companyId } = req.query;
    const { email, pdfBase64, billNumber } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required"
      });
    }

    // Here you would integrate with an email service like nodemailer
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