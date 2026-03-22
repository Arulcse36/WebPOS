const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// Create new bill
exports.createBill = async (req, res) => {
  try {
    const {
      items,
      discount,
      paymentMethod,
      total,
      customerId,
      customerName,
      notes
    } = req.body;

    console.log('Creating bill with data:', req.body);

    // Validate input
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart cannot be empty'
      });
    }

    // Calculate subtotal and prepare items
    let subtotal = 0;
    const formattedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      // Check stock
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      formattedItems.push({
        productId: item.productId,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal
      });

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    const discountAmount = subtotal * (discount / 100);
    const finalTotal = subtotal - discountAmount;

    // Prepare customer data
    let customerData = {
      name: customerName || 'Walk-in Customer'
    };

    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customerData = {
          customerId: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        };
        // Update customer purchase stats
        await customer.updatePurchaseStats(finalTotal);
      }
    }

    // Create bill
    const bill = new Bill({
      items: formattedItems,
      subtotal,
      discount,
      discountAmount,
      total: finalTotal,
      paymentMethod,
      customer: customerData,
      notes,
      status: 'completed'
    });

    await bill.save();

    // Return bill details with bill number
    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      bill: {
        billNumber: bill.billNumber,
        items: bill.items,
        subtotal: bill.subtotal,
        discount: bill.discount,
        discountAmount: bill.discountAmount,
        total: bill.total,
        paymentMethod: bill.paymentMethod,
        customer: bill.customer,
        transactionDate: bill.transactionDate
      }
    });

  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bill',
      error: error.message
    });
  }
};

// Get all bills with pagination and filters
exports.getBills = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      paymentMethod,
      customerId,
      status
    } = req.query;

    console.log('Fetching bills with filters:', req.query);

    const query = {};

    // Date filter
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    // Payment method filter
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Customer filter
    if (customerId) query['customer.customerId'] = customerId;

    // Status filter
    if (status) query.status = status;

    const bills = await Bill.find(query)
      .sort({ transactionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalBills: total
    });

  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};

// Get single bill by ID
exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }
    res.json({
      success: true,
      bill
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill',
      error: error.message
    });
  }
};

// Get bill by bill number
exports.getBillByNumber = async (req, res) => {
  try {
    const bill = await Bill.findOne({ billNumber: req.params.billNumber });
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }
    res.json({
      success: true,
      bill
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill',
      error: error.message
    });
  }
};

// Cancel/Refund bill
exports.cancelBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    if (bill.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Bill cannot be cancelled'
      });
    }

    // Restore product stock
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }

    bill.status = 'cancelled';
    bill.notes = reason || 'Bill cancelled';
    await bill.save();

    res.json({
      success: true,
      message: 'Bill cancelled successfully',
      bill
    });

  } catch (error) {
    console.error('Cancel bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel bill',
      error: error.message
    });
  }
};

// Get daily sales report
exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const bills = await Bill.find({
      transactionDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    });

    const totalSales = bills.reduce((sum, bill) => sum + bill.total, 0);
    const totalItems = bills.reduce((sum, bill) => 
      sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    
    const paymentBreakdown = {
      cash: 0,
      card: 0,
      upi: 0
    };

    bills.forEach(bill => {
      paymentBreakdown[bill.paymentMethod] += bill.total;
    });

    res.json({
      success: true,
      report: {
        date: startOfDay,
        totalBills: bills.length,
        totalSales,
        totalItems,
        averageBillValue: bills.length > 0 ? totalSales / bills.length : 0,
        paymentBreakdown
      }
    });

  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};