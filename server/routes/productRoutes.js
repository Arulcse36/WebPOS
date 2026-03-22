const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GET
router.get("/", async (req, res) => {
  const data = await Product.find()
    .populate("category")
    .populate("brand")
    .populate("uom")
    .sort({ createdAt: -1 });

  res.json(data);
});

// ADD
router.post("/", async (req, res) => {
  const newItem = new Product(req.body);
  const saved = await newItem.save();
  res.json(saved);
});

// UPDATE
router.put("/:id", async (req, res) => {
  const updated = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  )
    .populate("category")
    .populate("brand")
    .populate("uom");

  res.json(updated);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;