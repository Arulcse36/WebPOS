require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const uomRoutes = require("./routes/uomRoutes");
const productRoutes = require("./routes/productRoutes");
const billRoutes = require('./routes/billRoutes');
const customerRoutes = require('./routes/customerRoutes');
const companyRoutes = require('./routes/companyRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // ✅ ADD USER ROUTES

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/bills', billRoutes);
app.use('/customers', customerRoutes);
app.use("/categories", categoryRoutes);
app.use("/brands", brandRoutes);
app.use("/uoms", uomRoutes);
app.use("/products", productRoutes);
app.use('/reports', require('./routes/reportRoutes'));
app.use('/companies', companyRoutes);
app.use('/admin', authRoutes);
app.use('/users', userRoutes); // ✅ ADD USER ROUTES - User management

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Routes
app.get("/", (req, res) => {
  res.send("API Running");
});

const Invoice = require("./models/Invoice");
const Product = require("./models/Product");
const Bill = require("./models/Bill");

app.post("/billing", async (req, res) => {
  try {
    const { items } = req.body;

    let totalAmount = 0;

    // update stock
    for (let item of items) {
      totalAmount += item.total;

      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.qty } }
      );
    }

    const invoice = new Invoice({
      items,
      totalAmount
    });

    const saved = await invoice.save();
    res.json(saved);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /bills/customers
app.get('/bills/customers', async (req, res) => {
  try {
    const customers = await Bill.distinct('customer');
    const filteredCustomers = customers.filter(c => c && c.trim() !== '').sort();
    res.json({ success: true, customers: filteredCustomers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);

});