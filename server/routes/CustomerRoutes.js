const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");


// ➤ Create Customer
router.post("/", async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ➤ Get All Customers
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";

    const customers = await Customer.find({
      name: { $regex: search, $options: "i" }
    });

    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ➤ Update Customer
router.put("/:id", async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ➤ Delete Customer
router.delete("/:id", async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;