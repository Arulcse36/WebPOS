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

const app = express();
app.use(cors());
app.use(express.json());

app.use('/bills', billRoutes);  // This will make /billing work
app.use('/customers', customerRoutes);  // This will make /customers work
app.use("/categories", categoryRoutes);
app.use("/brands", brandRoutes);
app.use("/uoms", uomRoutes);
app.use("/products", productRoutes);
app.use('/reports', require('./routes/reportRoutes'));


// Connect MongoDB
// mongoose.connect("mongodb://127.0.0.1:27017/todo_db")
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.log(err));


// mongoose.connect("mongodb+srv://arulcse3:9965899817@cluster0.apvzp.mongodb.net/todo_db")
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.log(err));


// 👉 CONNECT TO MONGODB HERE
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

  // Routes
app.get("/", (req, res) => {
  res.send("API Running");
});


const Invoice = require("./models/Invoice");

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



// Server start
const PORT = process.env.PORT || 5000;

// Start server
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});