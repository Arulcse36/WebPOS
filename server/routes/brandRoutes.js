const express = require("express");
const router = express.Router();
const Brand = require("../models/Brand");

// GET brands with company filter
router.get("/", async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        const data = await Brand.find({ companyId }).sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        console.error("Error fetching brands:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST create brand
router.post("/", async (req, res) => {
    try {
        const { companyId, name } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Brand name required" });
        }
        
        // Check if brand already exists for this company
        const existingBrand = await Brand.findOne({ 
            companyId, 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
        });
        
        if (existingBrand) {
            return res.status(400).json({ message: "Brand already exists for this company" });
        }
        
        const newItem = new Brand({ 
            companyId, 
            name: name.trim()
        });
        
        console.log("New Brand:", newItem);
        const saved = await newItem.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error("Error creating brand:", err);
        if (err.code === 11000) {
            res.status(400).json({ message: "Brand already exists for this company" });
        } else {
            res.status(400).json({ message: err.message });
        }
    }
});

// UPDATE brand
router.put("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;
        const { name } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Brand name required" });
        }
        
        // Check if another brand with same name exists for this company
        const existingBrand = await Brand.findOne({ 
            companyId, 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            _id: { $ne: req.params.id }
        });
        
        if (existingBrand) {
            return res.status(400).json({ message: "Brand already exists for this company" });
        }
        
        const updated = await Brand.findOneAndUpdate(
            { _id: req.params.id, companyId },
            { name: name.trim() },
            { new: true }
        );
        
        if (!updated) {
            return res.status(404).json({ error: "Brand not found or access denied" });
        }
        
        res.json(updated);
    } catch (err) {
        console.error("Error updating brand:", err);
        if (err.code === 11000) {
            res.status(400).json({ message: "Brand already exists for this company" });
        } else {
            res.status(400).json({ error: err.message });
        }
    }
});

// UPDATE brand status
router.put("/:id/status", async (req, res) => {
    try {
        const { companyId } = req.query;
        const { isActive } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        const updated = await Brand.findOneAndUpdate(
            { _id: req.params.id, companyId },
            { isActive },
            { new: true }
        );
        
        if (!updated) {
            return res.status(404).json({ error: "Brand not found or access denied" });
        }
        
        res.json(updated);
    } catch (err) {
        console.error("Error updating brand status:", err);
        res.status(400).json({ error: err.message });
    }
});

// DELETE brand
router.delete("/:id", async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({ error: "Company ID required" });
        }
        
        // Check if brand is being used by any product
        const Product = require("../models/Product");
        const productsUsingBrand = await Product.findOne({ 
            companyId, 
            brand: req.params.id 
        });
        
        if (productsUsingBrand) {
            return res.status(400).json({ 
                message: "Cannot delete brand as it is being used by one or more products. Please reassign or delete those products first." 
            });
        }
        
        const deleted = await Brand.findOneAndDelete({ 
            _id: req.params.id, 
            companyId 
        });
        
        if (!deleted) {
            return res.status(404).json({ error: "Brand not found or access denied" });
        }
        
        res.json({ message: "Brand deleted successfully" });
    } catch (err) {
        console.error("Error deleting brand:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;