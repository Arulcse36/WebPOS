require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ==================== ROUTE IMPORTS ====================
const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const uomRoutes = require("./routes/uomRoutes");
const productRoutes = require("./routes/productRoutes");
const billRoutes = require("./routes/billRoutes");
const customerRoutes = require("./routes/customerRoutes");
const companyRoutes = require("./routes/companyRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const expenseMasterRoutes = require("./routes/expenseMasterRoutes");
const paymentReportRoutes = require("./routes/paymentReportRoutes");
const expenseTransactionRoutes = require("./routes/expenseTransactionRoutes");
const seedRoutes = require("./routes/seedRoutes");

// ==================== MODEL IMPORTS ====================
const Invoice = require("./models/Invoice");
const Product = require("./models/Product");
const Bill = require("./models/Bill");

// ==================== INITIALIZE APP ====================
const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// ==================== API ROUTES ====================
// Core routes
app.use("/admin", authRoutes);
app.use("/bills", billRoutes);
app.use("/brands", brandRoutes);
app.use("/categories", categoryRoutes);
app.use("/companies", companyRoutes);
app.use("/customers", customerRoutes);
app.use("/expense-master", expenseMasterRoutes);
app.use("/expense-transactions", expenseTransactionRoutes);
app.use("/payment-reports", paymentReportRoutes);
app.use("/products", productRoutes);
app.use("/reports", reportRoutes);
app.use("/uoms", uomRoutes);
app.use("/users", userRoutes);

// Seed routes (must be last to avoid conflicts)
app.use("/", seedRoutes);

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.send("API Running");
});

// ==================== BILLING ENDPOINTS ====================
/**
 * Create new billing invoice
 * POST /billing
 */
// app.post("/billing", async (req, res) => {
//   try {
//     const { items } = req.body;
//     let totalAmount = 0;

//     // Update stock for each item
//     for (const item of items) {
//       totalAmount += item.total;
//       await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
//     }

//     const invoice = new Invoice({ items, totalAmount });
//     const saved = await invoice.save();
    
//     res.json(saved);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

/**
 * Get distinct customers from bills
 * GET /bills/customers
 */
// app.get("/bills/customers", async (req, res) => {
//   try {
//     const customers = await Bill.distinct("customer");
//     const filteredCustomers = customers
//       .filter(c => c && c.trim() !== "")
//       .sort();
    
//     res.json({ success: true, customers: filteredCustomers });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// Add this line with your other routes
const paymentReportRoutes = require('./routes/paymentReportRoutes');
app.use('/payment-reports', paymentReportRoutes);


const expenseTransactionRoutes = require('./routes/expenseTransactionRoutes');
app.use('/expense-transactions', expenseTransactionRoutes);

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
});