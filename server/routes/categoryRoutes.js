const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// GET
router.get("/", async (req, res) => {
  const data = await Category.find();
  res.json(data);
});

// POST
router.post("/", async (req, res) => {
  try {
    const newItem = new Category({ name: req.body.name });
    const saved = await newItem.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  const updated = await Category.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name },
    { new: true }
  );
  res.json(updated);
});

// STATUS
router.put("/:id/status", async (req, res) => {
  const updated = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  );
  res.json(updated);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;