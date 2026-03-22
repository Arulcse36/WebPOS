const express = require("express");
const router = express.Router();
const Brand = require("../models/Brand");

router.get("/", async (req, res) => {
  const data = await Brand.find().sort({ createdAt: -1 });
  res.json(data);
});

router.post("/", async (req, res) => {
  try {
    const newItem = new Brand({ name: req.body.name });
    console.log("New Brand:", newItem);
    const saved = await newItem.save();
    res.json(saved);
  } catch {
    res.status(400).json({ message: "Brand already exists" });
  }
});

router.put("/:id", async (req, res) => {
  const updated = await Brand.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name },
    { new: true }
  );
  res.json(updated);
});

router.put("/:id/status", async (req, res) => {
  const updated = await Brand.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  );
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await Brand.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;