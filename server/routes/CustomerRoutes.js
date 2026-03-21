const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");


// 🔹 CREATE CUSTOMER
router.post("/", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      openingBalance = 0
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name & Phone required" });
    }

    const customer = new Customer({
      name,
      phone,
      email,
      address,
      openingBalance,
      balance: openingBalance   // ✅ IMPORTANT
    });

    await customer.save();

    res.json(customer);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Phone already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});


// 🔹 GET CUSTOMERS (WITH SEARCH)
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";

    const customers = await Customer.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ]
    }).sort({ createdAt: -1 });

    res.json(customers);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 UPDATE CUSTOMER
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      openingBalance = 0
    } = req.body;

    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        email,
        address,
        openingBalance,
        balance: openingBalance   // ✅ keep in sync
      },
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 DELETE CUSTOMER
router.delete("/:id", async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;