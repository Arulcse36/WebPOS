const express = require("express");
const router = express.Router();
const Uom = require("../models/Uom");

// GET all UOMs (common for all companies)
router.get("/", async (req, res) => {
    try {
        const data = await Uom.find().sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        console.error("Error fetching UOMs:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST create UOM
router.post("/", async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "UOM name required" });
        }
        
        // Check if UOM already exists
        const existingUom = await Uom.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
        });
        
        if (existingUom) {
            return res.status(400).json({ message: "UOM already exists" });
        }
        
        const newItem = new Uom({ 
            name: name.trim()
        });
        
        const saved = await newItem.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error("Error creating UOM:", err);
        if (err.code === 11000) {
            res.status(400).json({ message: "UOM already exists" });
        } else {
            res.status(400).json({ message: err.message });
        }
    }
});

// UPDATE UOM
router.put("/:id", async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "UOM name required" });
        }
        
        // Check if another UOM with same name exists
        const existingUom = await Uom.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            _id: { $ne: req.params.id }
        });
        
        if (existingUom) {
            return res.status(400).json({ message: "UOM already exists" });
        }
        
        const updated = await Uom.findByIdAndUpdate(
            req.params.id,
            { name: name.trim() },
            { new: true }
        );
        
        if (!updated) {
            return res.status(404).json({ error: "UOM not found" });
        }
        
        res.json(updated);
    } catch (err) {
        console.error("Error updating UOM:", err);
        if (err.code === 11000) {
            res.status(400).json({ message: "UOM already exists" });
        } else {
            res.status(400).json({ error: err.message });
        }
    }
});

// UPDATE UOM status
router.put("/:id/status", async (req, res) => {
    try {
        const { isActive } = req.body;
        
        const updated = await Uom.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        );
        
        if (!updated) {
            return res.status(404).json({ error: "UOM not found" });
        }
        
        res.json(updated);
    } catch (err) {
        console.error("Error updating UOM status:", err);
        res.status(400).json({ error: err.message });
    }
});

// DELETE UOM
router.delete("/:id", async (req, res) => {
    try {
        // Check if UOM is being used by any product
        const Product = require("../models/Product");
        const productsUsingUom = await Product.findOne({ 
            uom: req.params.id 
        });
        
        if (productsUsingUom) {
            return res.status(400).json({ 
                message: "Cannot delete UOM as it is being used by one or more products. Please reassign or delete those products first." 
            });
        }
        
        const deleted = await Uom.findByIdAndDelete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({ error: "UOM not found" });
        }
        
        res.json({ message: "UOM deleted successfully" });
    } catch (err) {
        console.error("Error deleting UOM:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;