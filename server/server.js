require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const Category = require("./models/Category");
const Brand = require("./models/Brand");
const Uom = require("./models/Uom");
const Product = require("./models/Product");
const customerRoutes = require("./routes/CustomerRoutes");


const app = express();

app.use(cors());
app.use(express.json());

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



// ✅ Define schema FIRST
const TodoSchema = new mongoose.Schema({
  text: String,
  completed: Boolean,
  targetDate: String   // or Date
});

const Todo = mongoose.model("Todo", TodoSchema);

// Routes

// Get all
app.get("/todos", async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});

// Add
app.post("/todos", async (req, res) => {
  const newTodo = new Todo(req.body);
  await newTodo.save();
  res.json(newTodo);
});

// Update
app.put("/todos/:id", async (req, res) => {
  const updated = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete
app.delete("/todos/:id", async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});


// GET
app.get("/categories", async (req, res) => {
  const data = await Category.find();
  res.json(data);
});

// POST
app.post("/categories", async (req, res) => {
  try {
    const newItem = new Category({ name: req.body.name });
    const saved = await newItem.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
app.delete("/categories/:id", async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

app.put("/categories/:id", async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name }, // or include isActive if needed
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/categories/:id/status", async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET
app.get("/brands", async (req, res) => {
  const data = await Brand.find().sort({ createdAt: -1 });
  res.json(data);
});

// ADD
app.post("/brands", async (req, res) => {
  try {
    const newItem = new Brand({ name: req.body.name });
    const saved = await newItem.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: "Brand already exists" });
  }
});

// UPDATE (edit name)
app.put("/brands/:id", async (req, res) => {
  try {
    const updated = await Brand.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TOGGLE ACTIVE
app.put("/brands/:id/status", async (req, res) => {
  try {
    const updated = await Brand.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
app.delete("/brands/:id", async (req, res) => {
  await Brand.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});


// GET
app.get("/uoms", async (req, res) => {
  const data = await Uom.find().sort({ createdAt: -1 });
  res.json(data);
});

// ADD
app.post("/uoms", async (req, res) => {
  try {
    const newItem = new Uom({ name: req.body.name });
    const saved = await newItem.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: "UOM already exists" });
  }
});

// UPDATE (edit name)
app.put("/uoms/:id", async (req, res) => {
  try {
    const updated = await Uom.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TOGGLE ACTIVE
app.put("/uoms/:id/status", async (req, res) => {
  try {
    const updated = await Uom.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
app.delete("/uoms/:id", async (req, res) => {
  await Uom.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});



// GET PRODUCTS
app.get("/products", async (req, res) => {
  try {
    const data = await Product.find()
      .populate("category")
      .populate("brand")
      .populate("uom")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD PRODUCT
app.post("/products", async (req, res) => {
  try {
    const newItem = new Product(req.body);
    const saved = await newItem.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
app.delete("/products/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

app.put("/products/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("category")
      .populate("brand")
      .populate("uom");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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



app.use("/customers", customerRoutes);

// Server start
const PORT = process.env.PORT || 5000;

// Start server
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});